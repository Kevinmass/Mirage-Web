import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { registrarEvento } from "@/kernel/auditoria/registro";
import { esViolacionDeUnicidad } from "@/kernel/db-utils";
import { publicar } from "@/kernel/eventos/bus";
import {
  Conflicto,
  NoAutorizado,
  NoEncontrado,
  Validacion,
} from "@/kernel/errores";
import { obtenerPersona } from "@/kernel/identidad/personas";
import { persona } from "@/kernel/identidad/schema";
import { obtenerNodo, obtenerTitularDeNodo } from "@/kernel/organigrama/arbol";
import { requiere } from "@/kernel/permisos/evaluar";
import { obtenerCliente } from "@/modules/clientes/api";
import { obtenerDatosDeRepositorio } from "./internal/github";
import {
  proyectosHito,
  proyectosInscripcion,
  proyectosProyecto,
  proyectosRepositorio,
  proyectosRepositorioSnapshot,
  proyectosTarea,
} from "./schema";

export type EstadoProyecto =
  "propuesto" | "activo" | "pausado" | "terminado" | "cancelado";

export interface DatosProyecto {
  // null = proyecto interno (R&D, tooling propio) — diseño §8.10: es
  // normal, no un dato faltante.
  clienteId: number | null;
  nombre: string;
  descripcion?: string;
  nodoResponsableId: number;
  fechaInicio?: Date;
  fechaFinEstimada?: Date;
  cupo?: number | null;
  color?: string;
  imagenUrl?: string;
}

export async function listarProyectos() {
  return db
    .select()
    .from(proyectosProyecto)
    .orderBy(asc(proyectosProyecto.nombre));
}

export async function obtenerProyecto(id: number) {
  const [fila] = await db
    .select()
    .from(proyectosProyecto)
    .where(eq(proyectosProyecto.id, id));
  if (!fila) {
    throw new NoEncontrado(`No existe el proyecto ${id}`);
  }
  return fila;
}

export async function crearProyecto(datos: DatosProyecto) {
  if (datos.clienteId !== null) {
    await obtenerCliente(datos.clienteId);
  }
  await obtenerNodo(datos.nodoResponsableId);

  const [creado] = await db.insert(proyectosProyecto).values(datos).returning();
  const destinatarioPersonaId = await obtenerTitularDeNodo(
    datos.nodoResponsableId,
  );
  await publicar("proyecto.creado", {
    proyectoId: creado!.id,
    clienteId: creado!.clienteId,
    nombre: creado!.nombre,
    destinatarioPersonaId,
  });
  return creado!;
}

export async function actualizarProyecto(
  id: number,
  datos: Partial<
    Pick<
      DatosProyecto,
      | "nombre"
      | "descripcion"
      | "nodoResponsableId"
      | "fechaInicio"
      | "fechaFinEstimada"
      | "color"
      | "imagenUrl"
    >
  >,
) {
  await obtenerProyecto(id);
  if (datos.nodoResponsableId !== undefined) {
    await obtenerNodo(datos.nodoResponsableId);
  }

  const [actualizado] = await db
    .update(proyectosProyecto)
    .set(datos)
    .where(eq(proyectosProyecto.id, id))
    .returning();
  return actualizado!;
}

// Cambio de estado aparte de actualizarProyecto: es el único caso que
// publica proyecto.estado_cambiado, y solo cuando el estado realmente
// cambia.
export async function cambiarEstadoProyecto(
  id: number,
  nuevoEstado: EstadoProyecto,
) {
  const proyecto = await obtenerProyecto(id);
  if (proyecto.estado === nuevoEstado) {
    return proyecto;
  }

  const [actualizado] = await db
    .update(proyectosProyecto)
    .set({ estado: nuevoEstado })
    .where(eq(proyectosProyecto.id, id))
    .returning();
  const destinatarioPersonaId = await obtenerTitularDeNodo(
    proyecto.nodoResponsableId,
  );
  await publicar("proyecto.estado_cambiado", {
    proyectoId: id,
    nombre: proyecto.nombre,
    estadoAnterior: proyecto.estado,
    estadoNuevo: nuevoEstado,
    destinatarioPersonaId,
  });
  return actualizado!;
}

export type EstadoTarea = "pendiente" | "en_curso" | "bloqueada" | "hecha";
export type PrioridadTarea = "baja" | "media" | "alta";

export interface DatosTarea {
  titulo: string;
  descripcion?: string;
  nodoResponsableId: number;
  prioridad?: PrioridadTarea;
  empiezaEn?: Date;
  venceEn?: Date;
}

export async function listarTareasDeProyecto(proyectoId: number) {
  return db
    .select()
    .from(proyectosTarea)
    .where(eq(proyectosTarea.proyectoId, proyectoId));
}

export async function obtenerTarea(id: number) {
  const [fila] = await db
    .select()
    .from(proyectosTarea)
    .where(eq(proyectosTarea.id, id));
  if (!fila) {
    throw new NoEncontrado(`No existe la tarea ${id}`);
  }
  return fila;
}

// Quién puede crear una tarea sale del sistema de roles que ya existe
// (diseño §8.11, PR 11) — no se decide en el componente del Kanban.
// Segundo uso real de kernel/permisos/evaluar.requiere() en todo el
// repo, después de contenido.editar (PR 4/5).
export async function crearTarea(
  personaId: number,
  proyectoId: number,
  datos: DatosTarea,
) {
  await requiere(personaId, "proyectos.editar");
  await obtenerProyecto(proyectoId);
  await obtenerNodo(datos.nodoResponsableId);

  const [creada] = await db
    .insert(proyectosTarea)
    .values({ proyectoId, ...datos })
    .returning();
  return creada!;
}

export async function actualizarTarea(id: number, datos: Partial<DatosTarea>) {
  await obtenerTarea(id);
  if (datos.nodoResponsableId !== undefined) {
    await obtenerNodo(datos.nodoResponsableId);
  }

  const [actualizada] = await db
    .update(proyectosTarea)
    .set(datos)
    .where(eq(proyectosTarea.id, id))
    .returning();
  return actualizada!;
}

// completadaEn se deriva del estado, no se pide aparte: 'hecha' la
// marca con la fecha, cualquier otro estado la limpia (p.ej. si una
// tarea marcada hecha por error vuelve a en_curso). Quién puede mover
// una tarjeta entre columnas del Kanban pasa por el mismo permiso que
// crearla (diseño §8.11).
export async function cambiarEstadoTarea(
  personaId: number,
  id: number,
  nuevoEstado: EstadoTarea,
) {
  await requiere(personaId, "proyectos.editar");
  await obtenerTarea(id);

  const [actualizada] = await db
    .update(proyectosTarea)
    .set({
      estado: nuevoEstado,
      completadaEn: nuevoEstado === "hecha" ? new Date() : null,
    })
    .where(eq(proyectosTarea.id, id))
    .returning();
  return actualizada!;
}

export interface DatosFechasTarea {
  empiezaEn: Date | null;
  venceEn: Date | null;
}

// Mover o alargar/acortar una barra en el Gantt pasa por acá (diseño
// §8.11, PR 11 parte 2) — mismo permiso que crear o mover en el Kanban,
// y deja el mismo rastro de auditoría que cualquier otro cambio real
// sobre la tarea (criterio de aceptación: "cambiar fechas desde el
// Gantt queda auditado igual que hacerlo desde el formulario").
export async function cambiarFechasTarea(
  personaId: number,
  id: number,
  datos: DatosFechasTarea,
) {
  await requiere(personaId, "proyectos.editar");
  await obtenerTarea(id);

  const [actualizada] = await db
    .update(proyectosTarea)
    .set(datos)
    .where(eq(proyectosTarea.id, id))
    .returning();
  await registrarEvento({
    personaId,
    accion: "proyectos.tarea.fechas_cambiadas",
    entidad: "proyectos_tarea",
    entidadId: id,
    datos,
  });
  return actualizada!;
}

export async function asignarPersonaATarea(
  id: number,
  personaId: number | null,
) {
  const tarea = await obtenerTarea(id);
  if (personaId !== null) {
    await obtenerPersona(personaId);
  }

  const [actualizada] = await db
    .update(proyectosTarea)
    .set({ personaAsignadaId: personaId })
    .where(eq(proyectosTarea.id, id))
    .returning();

  if (personaId !== null) {
    await publicar("tarea.asignada", {
      tareaId: id,
      personaId,
      titulo: tarea.titulo,
    });
  }
  return actualizada!;
}

// Progreso = tareas hechas / tareas totales (diseño §6.3) — nunca se
// mezcla con actividad de GitHub (eso llega en 5.4/5.5, en otra
// función aparte que lee repositorio_snapshot).
export async function obtenerProgresoDeProyecto(proyectoId: number) {
  const tareas = await listarTareasDeProyecto(proyectoId);
  const hechas = tareas.filter((t) => t.estado === "hecha").length;
  return { hechas, totales: tareas.length };
}

async function contarInscriptos(proyectoId: number): Promise<number> {
  const filas = await db
    .select({ id: proyectosInscripcion.id })
    .from(proyectosInscripcion)
    .where(eq(proyectosInscripcion.proyectoId, proyectoId));
  return filas.length;
}

async function obtenerLiderDeProyecto(proyectoId: number) {
  const [fila] = await db
    .select()
    .from(proyectosInscripcion)
    .where(
      and(
        eq(proyectosInscripcion.proyectoId, proyectoId),
        eq(proyectosInscripcion.rol, "lider"),
      ),
    );
  return fila ?? null;
}

export type RolInscripcion = "lider" | "miembro";

// Anotarse (diseño §1.1/§8.10, PR 10). El cupo se valida acá, no en la
// UI — la card solo deshabilita el botón para no ofrecer una acción que
// va a fallar, pero la invariante real vive en la única puerta de
// entrada al dato.
export async function inscribirPersona(
  proyectoId: number,
  personaId: number,
  rol: RolInscripcion = "miembro",
) {
  const proyecto = await obtenerProyecto(proyectoId);
  await obtenerPersona(personaId);

  if (proyecto.cupo !== null) {
    const cantidad = await contarInscriptos(proyectoId);
    if (cantidad >= proyecto.cupo) {
      throw new Conflicto(
        `El proyecto ${proyectoId} ya alcanzó su cupo de ${proyecto.cupo}`,
      );
    }
  }
  if (rol === "lider" && (await obtenerLiderDeProyecto(proyectoId))) {
    throw new Conflicto(`El proyecto ${proyectoId} ya tiene un líder`);
  }

  try {
    const [creada] = await db
      .insert(proyectosInscripcion)
      .values({ proyectoId, personaId, rol })
      .returning();
    return creada!;
  } catch (error) {
    if (esViolacionDeUnicidad(error)) {
      throw new Conflicto(`Ya está inscripto en el proyecto ${proyectoId}`);
    }
    throw error;
  }
}

export async function desinscribirPersona(
  proyectoId: number,
  personaId: number,
) {
  await db
    .delete(proyectosInscripcion)
    .where(
      and(
        eq(proyectosInscripcion.proyectoId, proyectoId),
        eq(proyectosInscripcion.personaId, personaId),
      ),
    );
}

// Solo el líder cambia el cupo (diseño §1.1) — no es una capacidad de
// kernel/permisos, es una pregunta sobre ESTE proyecto puntual: ¿la
// persona que pide el cambio es su líder inscripto?
export async function cambiarCupo(
  proyectoId: number,
  personaIdQueCambia: number,
  nuevoCupo: number | null,
) {
  await obtenerProyecto(proyectoId);
  const lider = await obtenerLiderDeProyecto(proyectoId);
  if (!lider || lider.personaId !== personaIdQueCambia) {
    throw new NoAutorizado(
      `Solo el líder del proyecto ${proyectoId} puede cambiar el cupo`,
    );
  }

  if (nuevoCupo !== null) {
    const cantidad = await contarInscriptos(proyectoId);
    if (nuevoCupo < cantidad) {
      throw new Validacion(
        `El cupo no puede ser menor a los ${cantidad} ya inscriptos`,
      );
    }
  }

  const [actualizado] = await db
    .update(proyectosProyecto)
    .set({ cupo: nuevoCupo })
    .where(eq(proyectosProyecto.id, proyectoId))
    .returning();
  return actualizado!;
}

export interface InscriptoDeProyecto {
  id: number;
  personaId: number;
  nombre: string;
  apellido: string;
  rol: RolInscripcion;
  inscriptoEn: Date;
}

export async function listarInscriptos(
  proyectoId: number,
): Promise<InscriptoDeProyecto[]> {
  return db
    .select({
      id: proyectosInscripcion.id,
      personaId: persona.id,
      nombre: persona.nombre,
      apellido: persona.apellido,
      rol: proyectosInscripcion.rol,
      inscriptoEn: proyectosInscripcion.inscriptoEn,
    })
    .from(proyectosInscripcion)
    .innerJoin(persona, eq(persona.id, proyectosInscripcion.personaId))
    .where(eq(proyectosInscripcion.proyectoId, proyectoId));
}

// "Mis proyectos" sale de la inscripción, nunca de los nodos del
// organigrama (diseño §1.1 y criterio de aceptación del PR 10).
export async function listarProyectosDePersona(
  personaId: number,
): Promise<number[]> {
  const filas = await db
    .select({ proyectoId: proyectosInscripcion.proyectoId })
    .from(proyectosInscripcion)
    .where(eq(proyectosInscripcion.personaId, personaId));
  return filas.map((f) => f.proyectoId);
}

export interface ProyectoConDetalle {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: EstadoProyecto;
  clienteId: number | null;
  cupo: number | null;
  color: string | null;
  imagenUrl: string | null;
  hechas: number;
  totales: number;
  inscriptos: {
    personaId: number;
    nombre: string;
    apellido: string;
    rol: RolInscripcion;
  }[];
}

// La grilla de /app/proyectos (diseño §8.10) necesita todo junto: la
// tarjeta muestra progreso, cupo y avatares apilados a la vez. N+1
// deliberado — mismo patrón que listarProyectosDeCliente en el módulo
// clientes — no vale la pena optimizar antes de que la cantidad real de
// proyectos lo justifique.
export async function listarProyectosConDetalle(): Promise<
  ProyectoConDetalle[]
> {
  const proyectos = await listarProyectos();
  return Promise.all(
    proyectos.map(async (p) => {
      const [progreso, inscriptos] = await Promise.all([
        obtenerProgresoDeProyecto(p.id),
        listarInscriptos(p.id),
      ]);
      return {
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        estado: p.estado,
        clienteId: p.clienteId,
        cupo: p.cupo,
        color: p.color,
        imagenUrl: p.imagenUrl,
        ...progreso,
        inscriptos: inscriptos.map((i) => ({
          personaId: i.personaId,
          nombre: i.nombre,
          apellido: i.apellido,
          rol: i.rol,
        })),
      };
    }),
  );
}

export interface ProyectoDeCliente {
  id: number;
  nombre: string;
  estado: EstadoProyecto;
  hechas: number;
  totales: number;
}

// Las únicas dos funciones que el portal puede llamar para ver
// proyectos (diseño §8, PR 7.7): el shape que devuelven es
// deliberadamente angosto — id, nombre, estado y progreso, nada más.
// Nunca nodoResponsableId, descripcion, fechaInicio/fechaFinEstimada,
// tareas individuales ni actividad de GitHub — el filtrado de campos
// pasa por acá, no por lo que el componente decide renderizar.
export async function listarProyectosDeCliente(
  clienteId: number,
): Promise<ProyectoDeCliente[]> {
  const proyectos = await db
    .select({
      id: proyectosProyecto.id,
      nombre: proyectosProyecto.nombre,
      estado: proyectosProyecto.estado,
    })
    .from(proyectosProyecto)
    .where(eq(proyectosProyecto.clienteId, clienteId));

  return Promise.all(
    proyectos.map(async (p) => ({
      ...p,
      ...(await obtenerProgresoDeProyecto(p.id)),
    })),
  );
}

// Mismo criterio que solicitudes.obtenerSolicitudDeCliente: si el
// proyecto existe pero es de otro cliente, tira el mismo NoEncontrado
// que si no existiera — la ficha de /portal/proyectos/[id] nunca
// puede distinguir uno de otro.
export async function obtenerProyectoDeCliente(
  clienteId: number,
  id: number,
): Promise<ProyectoDeCliente> {
  const proyecto = await obtenerProyecto(id);
  if (proyecto.clienteId !== clienteId) {
    throw new NoEncontrado(`No existe el proyecto ${id}`);
  }
  const progreso = await obtenerProgresoDeProyecto(id);
  return {
    id: proyecto.id,
    nombre: proyecto.nombre,
    estado: proyecto.estado,
    ...progreso,
  };
}

export interface TareaConProyecto {
  id: number;
  titulo: string;
  estado: EstadoTarea;
  prioridad: PrioridadTarea;
  nodoResponsableId: number;
  personaAsignadaId: number | null;
  empiezaEn: Date | null;
  venceEn: Date | null;
  proyectoId: number;
  proyectoNombre: string;
  proyectoColor: string | null;
}

export interface FiltroTareas {
  nodoResponsableId?: number;
  personaAsignadaId?: number;
  proyectoId?: number;
  // Para "mis tareas" (PR 5.3): tareas cuyo nodo responsable es uno de
  // los que ocupa la persona que mira la pantalla.
  nodoResponsableIdEntre?: number[];
  excluirHechas?: boolean;
}

// Tablero de tareas (PR 5.3): todas las tareas de todos los proyectos,
// con el nombre del proyecto al lado — a diferencia de
// listarTareasDeProyecto, que ya sabe en qué proyecto está parada la
// pantalla.
export async function listarTareas(
  filtro: FiltroTareas = {},
): Promise<TareaConProyecto[]> {
  const condiciones = [];
  if (filtro.nodoResponsableId !== undefined) {
    condiciones.push(
      eq(proyectosTarea.nodoResponsableId, filtro.nodoResponsableId),
    );
  }
  if (filtro.personaAsignadaId !== undefined) {
    condiciones.push(
      eq(proyectosTarea.personaAsignadaId, filtro.personaAsignadaId),
    );
  }
  if (filtro.proyectoId !== undefined) {
    condiciones.push(eq(proyectosTarea.proyectoId, filtro.proyectoId));
  }
  if (filtro.nodoResponsableIdEntre !== undefined) {
    condiciones.push(
      filtro.nodoResponsableIdEntre.length > 0
        ? inArray(
            proyectosTarea.nodoResponsableId,
            filtro.nodoResponsableIdEntre,
          )
        : // Lista vacía = la persona no ocupa ningún nodo: ninguna
          // tarea puede matchear, no "todas" (inArray con [] no filtra
          // nada en drizzle).
          eq(proyectosTarea.id, -1),
    );
  }
  if (filtro.excluirHechas) {
    condiciones.push(ne(proyectosTarea.estado, "hecha"));
  }

  return db
    .select({
      id: proyectosTarea.id,
      titulo: proyectosTarea.titulo,
      estado: proyectosTarea.estado,
      prioridad: proyectosTarea.prioridad,
      nodoResponsableId: proyectosTarea.nodoResponsableId,
      personaAsignadaId: proyectosTarea.personaAsignadaId,
      empiezaEn: proyectosTarea.empiezaEn,
      venceEn: proyectosTarea.venceEn,
      proyectoId: proyectosTarea.proyectoId,
      proyectoNombre: proyectosProyecto.nombre,
      proyectoColor: proyectosProyecto.color,
    })
    .from(proyectosTarea)
    .innerJoin(
      proyectosProyecto,
      eq(proyectosProyecto.id, proyectosTarea.proyectoId),
    )
    .where(condiciones.length > 0 ? and(...condiciones) : undefined);
}

export async function agregarRepositorio(
  proyectoId: number,
  owner: string,
  repo: string,
) {
  await obtenerProyecto(proyectoId);

  const [creado] = await db
    .insert(proyectosRepositorio)
    .values({ proyectoId, owner, repo })
    .returning();
  return creado!;
}

export interface RepositorioConSnapshot {
  id: number;
  owner: string;
  repo: string;
  commitsTotal: number | null;
  prsAbiertas: number | null;
  prsCerradas: number | null;
  contribuyentes: number | null;
  ultimoCommitEn: Date | null;
  actualizadoEn: Date | null;
  error: string | null;
}

export async function listarRepositoriosDeProyecto(
  proyectoId: number,
): Promise<RepositorioConSnapshot[]> {
  return db
    .select({
      id: proyectosRepositorio.id,
      owner: proyectosRepositorio.owner,
      repo: proyectosRepositorio.repo,
      commitsTotal: proyectosRepositorioSnapshot.commitsTotal,
      prsAbiertas: proyectosRepositorioSnapshot.prsAbiertas,
      prsCerradas: proyectosRepositorioSnapshot.prsCerradas,
      contribuyentes: proyectosRepositorioSnapshot.contribuyentes,
      ultimoCommitEn: proyectosRepositorioSnapshot.ultimoCommitEn,
      actualizadoEn: proyectosRepositorioSnapshot.actualizadoEn,
      error: proyectosRepositorioSnapshot.error,
    })
    .from(proyectosRepositorio)
    .leftJoin(
      proyectosRepositorioSnapshot,
      eq(proyectosRepositorioSnapshot.repositorioId, proyectosRepositorio.id),
    )
    .where(eq(proyectosRepositorio.proyectoId, proyectoId));
}

// Nunca tira: si GitHub falla, el error queda en la fila y los números
// viejos se mantienen — la pantalla muestra eso más la fecha del
// intento, nunca una pantalla en blanco (criterio de aceptación,
// diseño §6.3). El caller (el job de 30 minutos) no necesita try/catch
// propio.
export async function sincronizarRepositorio(
  repositorioId: number,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const [repositorio] = await db
    .select()
    .from(proyectosRepositorio)
    .where(eq(proyectosRepositorio.id, repositorioId));
  if (!repositorio) {
    throw new NoEncontrado(`No existe el repositorio ${repositorioId}`);
  }

  try {
    const datos = await obtenerDatosDeRepositorio(
      repositorio.owner,
      repositorio.repo,
      fetchImpl,
    );
    await db
      .insert(proyectosRepositorioSnapshot)
      .values({
        repositorioId,
        commitsTotal: datos.commitsTotal,
        prsAbiertas: datos.prsAbiertas,
        prsCerradas: datos.prsCerradas,
        contribuyentes: datos.contribuyentes,
        ultimoCommitEn: datos.ultimoCommitEn,
        actualizadoEn: new Date(),
        error: null,
      })
      .onConflictDoUpdate({
        target: proyectosRepositorioSnapshot.repositorioId,
        set: {
          commitsTotal: datos.commitsTotal,
          prsAbiertas: datos.prsAbiertas,
          prsCerradas: datos.prsCerradas,
          contribuyentes: datos.contribuyentes,
          ultimoCommitEn: datos.ultimoCommitEn,
          actualizadoEn: new Date(),
          error: null,
        },
      });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    await db
      .insert(proyectosRepositorioSnapshot)
      .values({ repositorioId, actualizadoEn: new Date(), error: mensaje })
      .onConflictDoUpdate({
        target: proyectosRepositorioSnapshot.repositorioId,
        set: { actualizadoEn: new Date(), error: mensaje },
      });
  }
}

// El job cada 30 minutos (instrumentation.ts) llama esto — nunca
// dentro de un request (diseño §6.3).
export async function sincronizarTodosLosRepositorios(
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const repositorios = await db.select().from(proyectosRepositorio);
  for (const repositorio of repositorios) {
    await sincronizarRepositorio(repositorio.id, fetchImpl);
  }
}

export interface DatosHito {
  nombre: string;
  fecha: Date;
  color?: string;
}

// Marcadores del Gantt (diseño §8.11, PR 11 parte 2): mismo permiso que
// el resto de las mutaciones de este módulo.
export async function crearHito(
  personaId: number,
  proyectoId: number,
  datos: DatosHito,
) {
  await requiere(personaId, "proyectos.editar");
  await obtenerProyecto(proyectoId);

  const [creado] = await db
    .insert(proyectosHito)
    .values({ proyectoId, ...datos })
    .returning();
  await registrarEvento({
    personaId,
    accion: "proyectos.hito.creado",
    entidad: "proyectos_hito",
    entidadId: creado!.id,
    datos: { proyectoId, nombre: datos.nombre },
  });
  return creado!;
}

export async function eliminarHito(personaId: number, id: number) {
  await requiere(personaId, "proyectos.editar");
  await db.delete(proyectosHito).where(eq(proyectosHito.id, id));
}

// El Gantt necesita los hitos de todos los proyectos que está
// mostrando de una sola vez (tareas propias + proyectos inscriptos),
// no de a uno — a diferencia de listarTareasDeProyecto, que ya sabe en
// qué proyecto está parada la pantalla.
export async function listarHitosDeProyectos(proyectoIds: number[]) {
  if (proyectoIds.length === 0) return [];
  return db
    .select()
    .from(proyectosHito)
    .where(inArray(proyectosHito.proyectoId, proyectoIds));
}
