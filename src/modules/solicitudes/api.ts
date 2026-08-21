import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { publicar } from "@/kernel/eventos/bus";
import { Conflicto, NoEncontrado } from "@/kernel/errores";
import { obtenerPersona } from "@/kernel/identidad/personas";
import { obtenerTitularDeNodo } from "@/kernel/organigrama/arbol";
import { obtenerCliente } from "@/modules/clientes/api";
import { solicitudesMensaje, solicitudesSolicitud } from "./schema";

export type EstadoSolicitud =
  "recibida" | "en_evaluacion" | "aceptada" | "rechazada";
export type TipoSolicitud = "funcionalidad_nueva" | "bug" | "consulta" | "otro";

export interface DatosSolicitud {
  titulo: string;
  descripcion: string;
  tipo: TipoSolicitud;
}

export async function obtenerSolicitud(id: number) {
  const [fila] = await db
    .select()
    .from(solicitudesSolicitud)
    .where(eq(solicitudesSolicitud.id, id));
  if (!fila) {
    throw new NoEncontrado(`No existe la solicitud ${id}`);
  }
  return fila;
}

// Alta desde el portal (PR 7.5): el cliente nunca elige un nodo (no ve
// el organigrama, diseño §8) — se hereda del nodo_responsable_id del
// cliente, igual que hace proyectos con el suyo.
export async function crearSolicitud(
  clienteId: number,
  creadaPorPersonaId: number,
  datos: DatosSolicitud,
) {
  const cliente = await obtenerCliente(clienteId);
  await obtenerPersona(creadaPorPersonaId);

  const [creada] = await db
    .insert(solicitudesSolicitud)
    .values({
      clienteId,
      creadaPorPersonaId,
      nodoResponsableId: cliente.nodoResponsableId,
      ...datos,
    })
    .returning();

  const destinatarioPersonaId = await obtenerTitularDeNodo(
    cliente.nodoResponsableId,
  );
  await publicar("solicitud.creada", {
    solicitudId: creada!.id,
    clienteId,
    titulo: creada!.titulo,
    destinatarioPersonaId,
  });
  return creada!;
}

// Bandeja interna (PR 7.4): todas, sin filtrar por cliente — a
// diferencia de listarSolicitudesDeCliente, que es la única que puede
// llamar el portal.
export async function listarSolicitudes(filtro?: { estado?: EstadoSolicitud }) {
  return db
    .select()
    .from(solicitudesSolicitud)
    .where(
      filtro?.estado
        ? eq(solicitudesSolicitud.estado, filtro.estado)
        : undefined,
    )
    .orderBy(desc(solicitudesSolicitud.creadoEn));
}

// La única función de listado que el portal puede llamar (diseño §8):
// siempre filtrada por cliente_id, nunca por un parámetro de URL. El
// caller le pasa el clienteId que salió de obtenerSesionPortal(), no
// uno leído de la ruta.
export async function listarSolicitudesDeCliente(clienteId: number) {
  return db
    .select()
    .from(solicitudesSolicitud)
    .where(eq(solicitudesSolicitud.clienteId, clienteId))
    .orderBy(desc(solicitudesSolicitud.creadoEn));
}

// La única función para pedir UNA solicitud por id que el portal puede
// llamar: si existe pero es de otro cliente, tira el mismo NoEncontrado
// que si no existiera — un id que no es de tu cliente no puede
// distinguirse de un id que no existe (mismo criterio que "404, no
// 403" entre /app y /portal, pero acá aplicado adentro de un mismo
// módulo). La ficha de /portal/solicitudes/[id] llama a esta función,
// nunca a obtenerSolicitud directo.
export async function obtenerSolicitudDeCliente(clienteId: number, id: number) {
  const solicitud = await obtenerSolicitud(id);
  if (solicitud.clienteId !== clienteId) {
    throw new NoEncontrado(`No existe la solicitud ${id}`);
  }
  return solicitud;
}

const ESTADOS_EVALUABLES: readonly EstadoSolicitud[] = [
  "recibida",
  "en_evaluacion",
];

function requireEvaluable(solicitud: { id: number; estado: EstadoSolicitud }) {
  if (!ESTADOS_EVALUABLES.includes(solicitud.estado)) {
    throw new Conflicto(
      `La solicitud ${solicitud.id} ya está "${solicitud.estado}" — no se puede volver a evaluar`,
    );
  }
}

export async function marcarEnEvaluacion(id: number) {
  const solicitud = await obtenerSolicitud(id);
  if (solicitud.estado !== "recibida") {
    throw new Conflicto(
      `La solicitud ${id} está "${solicitud.estado}", no "recibida"`,
    );
  }

  const [actualizada] = await db
    .update(solicitudesSolicitud)
    .set({ estado: "en_evaluacion" })
    .where(eq(solicitudesSolicitud.id, id))
    .returning();
  return actualizada!;
}

// Acepta y publica solicitud.aceptada — proyectos se suscribe a esto y
// crea el proyecto (modules/proyectos/events.ts), y este mismo módulo
// completa proyecto_id cuando llega el proyecto.creado resultante (ver
// vincularProyectoPendiente más abajo). aceptarSolicitud no crea el
// proyecto directamente ni conoce a proyectos.api — eso violaría la
// frontera entre módulos (diseño: un módulo solo llama al api.ts
// ajeno o publica eventos, y aquí el evento ya alcanza).
export async function aceptarSolicitud(id: number) {
  const solicitud = await obtenerSolicitud(id);
  requireEvaluable(solicitud);

  const [actualizada] = await db
    .update(solicitudesSolicitud)
    .set({ estado: "aceptada", resueltoEn: new Date() })
    .where(eq(solicitudesSolicitud.id, id))
    .returning();

  await publicar("solicitud.aceptada", {
    solicitudId: id,
    clienteId: solicitud.clienteId,
    nodoResponsableId: solicitud.nodoResponsableId,
    titulo: solicitud.titulo,
    descripcion: solicitud.descripcion,
    destinatarioPersonaId: solicitud.creadaPorPersonaId,
  });
  return actualizada!;
}

export async function rechazarSolicitud(id: number) {
  const solicitud = await obtenerSolicitud(id);
  requireEvaluable(solicitud);

  const [actualizada] = await db
    .update(solicitudesSolicitud)
    .set({ estado: "rechazada", resueltoEn: new Date() })
    .where(eq(solicitudesSolicitud.id, id))
    .returning();

  await publicar("solicitud.rechazada", {
    solicitudId: id,
    clienteId: solicitud.clienteId,
    titulo: solicitud.titulo,
    destinatarioPersonaId: solicitud.creadaPorPersonaId,
  });
  return actualizada!;
}

// La contraparte de aceptarSolicitud/publicar("solicitud.aceptada"):
// se llama desde modules/solicitudes/events.ts, suscripto a
// proyecto.creado. Empareja por clienteId + estado aceptada +
// proyecto_id todavía null, tomando la más reciente resuelta —
// suficiente porque aceptar-y-crear-proyecto es una sola cadena
// síncrona de await dentro de la misma Server Action (el bus no
// vuelve hasta que todos los suscriptores de solicitud.aceptada
// terminaron), así que a esta altura solo puede haber una candidata
// real. El borde no cubierto (aceptado, explícito, no un bug latente):
// si una solicitud vieja se quedó con proyecto_id null porque su
// propio suscriptor falló (el bus traga errores de suscriptor, diseño
// §4.5), y después se acepta OTRA solicitud del mismo cliente, esta
// función linkearía el proyecto nuevo a la más reciente de las dos
// candidatas — la vieja se queda huérfana. Eso es exactamente la señal
// que diseño §4.5 dice que hay que escuchar para reconsiderar
// evento-vs-llamada-directa, no algo para parchear acá con más
// heurística.
export async function vincularProyectoPendiente(
  clienteId: number,
  proyectoId: number,
): Promise<void> {
  const [pendiente] = await db
    .select({ id: solicitudesSolicitud.id })
    .from(solicitudesSolicitud)
    .where(
      and(
        eq(solicitudesSolicitud.clienteId, clienteId),
        eq(solicitudesSolicitud.estado, "aceptada"),
        isNull(solicitudesSolicitud.proyectoId),
      ),
    )
    .orderBy(desc(solicitudesSolicitud.resueltoEn))
    .limit(1);
  if (!pendiente) return;

  await db
    .update(solicitudesSolicitud)
    .set({ proyectoId })
    .where(eq(solicitudesSolicitud.id, pendiente.id));
}

// El hilo de mensajes (diseño §6.4): un mismo hilo sirve para
// discusión interna y de cara al cliente, distinguidos por
// visible_para_cliente — nunca dos hilos separados, para no perder
// contexto (comentario en schema.ts).
export async function agregarMensaje(
  solicitudId: number,
  personaId: number,
  cuerpo: string,
  visibleParaCliente: boolean,
) {
  const solicitud = await obtenerSolicitud(solicitudId);
  await obtenerPersona(personaId);

  const [creado] = await db
    .insert(solicitudesMensaje)
    .values({ solicitudId, personaId, cuerpo, visibleParaCliente })
    .returning();

  // Mensaje interno (no visible para el cliente): en v1 no dispara
  // notificación — el destinatario natural sería "otro empleado", y
  // resolver cuál no tiene una única respuesta correcta todavía (no
  // hay asignación de solicitudes a una persona puntual). Se ve en la
  // bandeja interna igual, solo no hay un mail de por medio.
  const destinatarioPersonaId = visibleParaCliente
    ? personaId === solicitud.creadaPorPersonaId
      ? await obtenerTitularDeNodo(solicitud.nodoResponsableId)
      : solicitud.creadaPorPersonaId
    : null;

  await publicar("solicitud.mensaje_agregado", {
    solicitudId,
    clienteId: solicitud.clienteId,
    personaId,
    visibleParaCliente,
    destinatarioPersonaId,
  });
  return creado!;
}

// Bandeja interna: el hilo completo, mensajes internos incluidos.
export async function listarMensajesDeSolicitud(solicitudId: number) {
  return db
    .select()
    .from(solicitudesMensaje)
    .where(eq(solicitudesMensaje.solicitudId, solicitudId))
    .orderBy(asc(solicitudesMensaje.creadoEn));
}

// La única función de mensajes que el portal puede llamar (mismo
// principio que listarSolicitudesDeCliente): el filtro está acá, no en
// el componente — así una pantalla de /portal que se arma mal nunca
// puede terminar renderizando un mensaje interno, porque el dato ni
// sale de la base.
export async function listarMensajesVisiblesParaCliente(solicitudId: number) {
  return db
    .select()
    .from(solicitudesMensaje)
    .where(
      and(
        eq(solicitudesMensaje.solicitudId, solicitudId),
        eq(solicitudesMensaje.visibleParaCliente, true),
      ),
    )
    .orderBy(asc(solicitudesMensaje.creadoEn));
}
