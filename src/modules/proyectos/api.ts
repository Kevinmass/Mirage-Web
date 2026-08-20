import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { publicar } from "@/kernel/eventos/bus";
import { NoEncontrado } from "@/kernel/errores";
import { obtenerPersona } from "@/kernel/identidad/personas";
import { obtenerNodo, obtenerTitularDeNodo } from "@/kernel/organigrama/arbol";
import { obtenerCliente } from "@/modules/clientes/api";
import { obtenerDatosDeRepositorio } from "./internal/github";
import {
  proyectosProyecto,
  proyectosRepositorio,
  proyectosRepositorioSnapshot,
  proyectosTarea,
} from "./schema";

export type EstadoProyecto =
  "propuesto" | "activo" | "pausado" | "terminado" | "cancelado";

export interface DatosProyecto {
  clienteId: number;
  nombre: string;
  descripcion?: string;
  nodoResponsableId: number;
  fechaInicio?: Date;
  fechaFinEstimada?: Date;
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
  await obtenerCliente(datos.clienteId);
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

export interface DatosTarea {
  titulo: string;
  descripcion?: string;
  nodoResponsableId: number;
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

export async function crearTarea(proyectoId: number, datos: DatosTarea) {
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
// tarea marcada hecha por error vuelve a en_curso).
export async function cambiarEstadoTarea(id: number, nuevoEstado: EstadoTarea) {
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
  nodoResponsableId: number;
  personaAsignadaId: number | null;
  venceEn: Date | null;
  proyectoId: number;
  proyectoNombre: string;
}

export interface FiltroTareas {
  nodoResponsableId?: number;
  personaAsignadaId?: number;
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
      nodoResponsableId: proyectosTarea.nodoResponsableId,
      personaAsignadaId: proyectosTarea.personaAsignadaId,
      venceEn: proyectosTarea.venceEn,
      proyectoId: proyectosTarea.proyectoId,
      proyectoNombre: proyectosProyecto.nombre,
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
