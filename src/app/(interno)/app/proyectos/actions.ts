"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  Conflicto,
  NoAutorizado,
  NoEncontrado,
  Validacion,
} from "@/kernel/errores";
import { obtenerSesionActual } from "@/kernel/identidad/sesion";
import { idElegido } from "@/lib/form";
import * as proyectos from "@/modules/proyectos/api";

export interface EstadoFormulario {
  error?: string;
}

function manejarError(error: unknown): EstadoFormulario {
  if (
    error instanceof Validacion ||
    error instanceof Conflicto ||
    error instanceof NoEncontrado ||
    error instanceof NoAutorizado
  ) {
    return { error: error.message };
  }
  throw error;
}

export async function crearProyectoAction(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const fechaInicio = String(formData.get("fechaInicio") ?? "").trim();
  const fechaFinEstimada = String(
    formData.get("fechaFinEstimada") ?? "",
  ).trim();
  const cupo = String(formData.get("cupo") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  const clienteId = String(formData.get("clienteId") ?? "").trim();
  const nodoResponsableId = idElegido(formData.get("nodoResponsableId"));

  if (nodoResponsableId === null) {
    return { error: "Elegí un nodo responsable." };
  }

  let creado: Awaited<ReturnType<typeof proyectos.crearProyecto>>;
  try {
    creado = await proyectos.crearProyecto({
      clienteId: clienteId ? Number(clienteId) : null,
      nombre: String(formData.get("nombre") ?? "").trim(),
      descripcion:
        String(formData.get("descripcion") ?? "").trim() || undefined,
      nodoResponsableId,
      fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
      fechaFinEstimada: fechaFinEstimada
        ? new Date(fechaFinEstimada)
        : undefined,
      cupo: cupo ? Number(cupo) : null,
      color: color || undefined,
    });
  } catch (error) {
    return manejarError(error);
  }

  revalidatePath("/app/proyectos");
  redirect(`/app/proyectos/${creado.id}`);
}

// Anotarme/desanotarme: la persona que ejecuta la acción sale de la
// sesión, nunca de un campo del formulario — no tendría sentido
// anotar a otro por vos.
export async function inscribirmeAction(
  proyectoId: number,
  _previo: EstadoFormulario,
): Promise<EstadoFormulario> {
  const sesion = await obtenerSesionActual();
  if (!sesion) return { error: "Sin sesión" };

  try {
    await proyectos.inscribirPersona(proyectoId, sesion.personaId);
  } catch (error) {
    return manejarError(error);
  }

  revalidatePath("/app/proyectos");
  revalidatePath(`/app/proyectos/${proyectoId}`);
  return {};
}

export async function desinscribirmeAction(proyectoId: number) {
  const sesion = await obtenerSesionActual();
  if (!sesion) return;

  await proyectos.desinscribirPersona(proyectoId, sesion.personaId);
  revalidatePath("/app/proyectos");
  revalidatePath(`/app/proyectos/${proyectoId}`);
}

export async function cambiarCupoAction(
  proyectoId: number,
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const sesion = await obtenerSesionActual();
  if (!sesion) return { error: "Sin sesión" };

  const valor = String(formData.get("cupo") ?? "").trim();
  try {
    await proyectos.cambiarCupo(
      proyectoId,
      sesion.personaId,
      valor ? Number(valor) : null,
    );
  } catch (error) {
    return manejarError(error);
  }

  revalidatePath(`/app/proyectos/${proyectoId}`);
  return {};
}

// A diferencia de inscribirmeAction/desinscribirmeAction, estas dos
// reciben la persona del formulario — son la gestión del equipo desde
// la ficha (cualquiera con acceso a /app/proyectos puede armar el
// equipo hoy, igual que agregar un contacto de cliente; no hay todavía
// un permiso de kernel/permisos que lo distinga — nota vigente del
// repo, ver CLAUDE.md).
export async function agregarAlEquipoAction(
  proyectoId: number,
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const rol = String(
    formData.get("rol") ?? "miembro",
  ) as proyectos.RolInscripcion;
  const personaId = idElegido(formData.get("personaId"));
  if (personaId === null) return { error: "Elegí una persona." };
  try {
    await proyectos.inscribirPersona(proyectoId, personaId, rol);
  } catch (error) {
    return manejarError(error);
  }

  revalidatePath(`/app/proyectos/${proyectoId}`);
  return {};
}

export async function quitarDelEquipoAction(
  proyectoId: number,
  personaId: number,
) {
  await proyectos.desinscribirPersona(proyectoId, personaId);
  revalidatePath(`/app/proyectos/${proyectoId}`);
}

export async function cambiarEstadoProyectoAction(
  id: number,
  formData: FormData,
) {
  const nuevoEstado = String(
    formData.get("estado"),
  ) as proyectos.EstadoProyecto;
  await proyectos.cambiarEstadoProyecto(id, nuevoEstado);
  revalidatePath("/app/proyectos");
  revalidatePath(`/app/proyectos/${id}`);
}

export async function crearTareaAction(
  proyectoId: number,
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const sesion = await obtenerSesionActual();
  if (!sesion) return { error: "Sin sesión" };

  const titulo = String(formData.get("titulo") ?? "").trim();
  const nodoResponsableId = idElegido(formData.get("nodoResponsableId"));
  const venceEn = String(formData.get("venceEn") ?? "").trim();
  const empiezaEn = String(formData.get("empiezaEn") ?? "").trim();
  const prioridad = String(
    formData.get("prioridad") ?? "media",
  ) as proyectos.PrioridadTarea;

  if (!titulo) return { error: "El título es obligatorio." };
  if (nodoResponsableId === null) {
    return { error: "Elegí un nodo responsable." };
  }

  try {
    await proyectos.crearTarea(sesion.personaId, proyectoId, {
      titulo,
      nodoResponsableId,
      prioridad,
      empiezaEn: empiezaEn ? new Date(empiezaEn) : undefined,
      venceEn: venceEn ? new Date(venceEn) : undefined,
    });
  } catch (error) {
    return manejarError(error);
  }

  revalidatePath(`/app/proyectos/${proyectoId}`);
  revalidatePath("/app/tareas");
  return {};
}

// El compositor inline al pie de cada columna del Kanban (diseño §8.11,
// PR 11) — a diferencia de crearTareaAction, el proyecto lo elige el
// formulario, no la URL: el Kanban no está parado en un proyecto. Si la
// columna no es "pendiente" (el default de crearTarea), la tarea nace
// directamente en esa columna en vez de aparecer en Pendiente y saltar
// después.
export async function crearTareaEnColumnaAction(
  estadoColumna: proyectos.EstadoTarea,
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const sesion = await obtenerSesionActual();
  if (!sesion) return { error: "Sin sesión" };

  const proyectoId = idElegido(formData.get("proyectoId"));
  const nodoResponsableId = idElegido(formData.get("nodoResponsableId"));
  const titulo = String(formData.get("titulo") ?? "").trim();
  const prioridad = String(
    formData.get("prioridad") ?? "media",
  ) as proyectos.PrioridadTarea;

  if (!titulo) return { error: "El título es obligatorio." };
  if (proyectoId === null) return { error: "Elegí un proyecto." };
  if (nodoResponsableId === null) {
    return { error: "Elegí un nodo responsable." };
  }

  try {
    const creada = await proyectos.crearTarea(sesion.personaId, proyectoId, {
      titulo,
      nodoResponsableId,
      prioridad,
    });
    if (estadoColumna !== "pendiente") {
      await proyectos.cambiarEstadoTarea(
        sesion.personaId,
        creada.id,
        estadoColumna,
      );
    }
  } catch (error) {
    return manejarError(error);
  }

  revalidatePath("/app/tareas");
  return {};
}

export async function cambiarEstadoTareaAction(
  proyectoId: number,
  tareaId: number,
  formData: FormData,
) {
  const sesion = await obtenerSesionActual();
  if (!sesion) return;

  const nuevoEstado = String(formData.get("estado")) as proyectos.EstadoTarea;
  await proyectos.cambiarEstadoTarea(sesion.personaId, tareaId, nuevoEstado);
  revalidatePath(`/app/proyectos/${proyectoId}`);
  revalidatePath("/app/tareas");
}

export interface ResultadoMover {
  ok: boolean;
  error?: string;
}

// Llamada directamente desde el handler de drag del Kanban (no un
// <form>): devuelve ok/error en vez de tirar, para que el cliente
// pueda revertir la tarjeta visiblemente si el servidor rechaza
// (diseño §8.11, criterio de aceptación del PR 11 — "arrastrar es
// optimista y revierte si el servidor rechaza").
export async function moverTareaAction(
  proyectoId: number,
  tareaId: number,
  nuevoEstado: proyectos.EstadoTarea,
): Promise<ResultadoMover> {
  const sesion = await obtenerSesionActual();
  if (!sesion) return { ok: false, error: "Sin sesión" };

  try {
    await proyectos.cambiarEstadoTarea(sesion.personaId, tareaId, nuevoEstado);
  } catch (error) {
    const { error: mensaje } = manejarError(error);
    return { ok: false, error: mensaje };
  }

  revalidatePath(`/app/proyectos/${proyectoId}`);
  revalidatePath("/app/tareas");
  return { ok: true };
}

// Llamada directamente desde el handler de arrastre/teclado de la barra
// del Gantt (mismo patrón que moverTareaAction) — mover el centro
// desplaza ambas fechas, arrastrar un extremo cambia solo esa (diseño
// §8.11, PR 11 parte 2).
export async function cambiarFechasTareaAction(
  proyectoId: number,
  tareaId: number,
  empiezaEn: Date | null,
  venceEn: Date | null,
): Promise<ResultadoMover> {
  const sesion = await obtenerSesionActual();
  if (!sesion) return { ok: false, error: "Sin sesión" };

  try {
    await proyectos.cambiarFechasTarea(sesion.personaId, tareaId, {
      empiezaEn,
      venceEn,
    });
  } catch (error) {
    const { error: mensaje } = manejarError(error);
    return { ok: false, error: mensaje };
  }

  revalidatePath(`/app/proyectos/${proyectoId}`);
  revalidatePath("/app/tareas");
  return { ok: true };
}

export async function asignarPersonaATareaAction(
  proyectoId: number,
  tareaId: number,
  formData: FormData,
) {
  // El <Select> manda "sin-asignar" cuando no hay nadie (no puede tener un
  // value vacío), o el id como string.
  const personaId = idElegido(formData.get("personaId"));
  await proyectos.asignarPersonaATarea(tareaId, personaId);
  revalidatePath(`/app/proyectos/${proyectoId}`);
}

export async function agregarRepositorioAction(
  proyectoId: number,
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    await proyectos.agregarRepositorio(
      proyectoId,
      String(formData.get("owner") ?? "").trim(),
      String(formData.get("repo") ?? "").trim(),
    );
  } catch (error) {
    return manejarError(error);
  }

  revalidatePath(`/app/proyectos/${proyectoId}`);
  return {};
}

// Sincronizar a demanda, sin esperar el job de 30 minutos — útil para
// verificar que un repo recién agregado anda antes de irse.
export async function sincronizarRepositorioAction(
  proyectoId: number,
  repositorioId: number,
) {
  await proyectos.sincronizarRepositorio(repositorioId);
  revalidatePath(`/app/proyectos/${proyectoId}`);
}

// El compositor de hitos del Gantt (diseño §8.11, PR 11 parte 2): el
// proyecto lo elige el formulario, igual que crearTareaEnColumnaAction.
export async function crearHitoAction(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const sesion = await obtenerSesionActual();
  if (!sesion) return { error: "Sin sesión" };

  const proyectoId = idElegido(formData.get("proyectoId"));
  const nombre = String(formData.get("nombre") ?? "").trim();
  const fecha = String(formData.get("fecha") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();

  if (proyectoId === null) return { error: "Elegí un proyecto." };
  if (!nombre) return { error: "El nombre del hito es obligatorio." };
  if (!fecha) return { error: "Elegí una fecha." };

  try {
    await proyectos.crearHito(sesion.personaId, proyectoId, {
      nombre,
      fecha: new Date(fecha),
      color: color || undefined,
    });
  } catch (error) {
    return manejarError(error);
  }

  revalidatePath("/app/tareas");
  return {};
}
