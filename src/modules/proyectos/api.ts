import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { publicar } from "@/kernel/eventos/bus";
import { NoEncontrado } from "@/kernel/errores";
import { obtenerPersona } from "@/kernel/identidad/personas";
import { obtenerNodo } from "@/kernel/organigrama/arbol";
import { obtenerCliente } from "@/modules/clientes/api";
import { proyectosProyecto, proyectosTarea } from "./schema";

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
  await publicar("proyecto.creado", {
    proyectoId: creado!.id,
    clienteId: creado!.clienteId,
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
  await publicar("proyecto.estado_cambiado", {
    proyectoId: id,
    estadoAnterior: proyecto.estado,
    estadoNuevo: nuevoEstado,
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
  await obtenerTarea(id);
  if (personaId !== null) {
    await obtenerPersona(personaId);
  }

  const [actualizada] = await db
    .update(proyectosTarea)
    .set({ personaAsignadaId: personaId })
    .where(eq(proyectosTarea.id, id))
    .returning();

  if (personaId !== null) {
    await publicar("tarea.asignada", { tareaId: id, personaId });
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
