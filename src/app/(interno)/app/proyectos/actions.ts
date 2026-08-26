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

  let creado: Awaited<ReturnType<typeof proyectos.crearProyecto>>;
  try {
    creado = await proyectos.crearProyecto({
      clienteId: clienteId ? Number(clienteId) : null,
      nombre: String(formData.get("nombre") ?? "").trim(),
      descripcion:
        String(formData.get("descripcion") ?? "").trim() || undefined,
      nodoResponsableId: Number(formData.get("nodoResponsableId")),
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
  try {
    await proyectos.inscribirPersona(
      proyectoId,
      Number(formData.get("personaId")),
      rol,
    );
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
  const venceEn = String(formData.get("venceEn") ?? "").trim();
  try {
    await proyectos.crearTarea(proyectoId, {
      titulo: String(formData.get("titulo") ?? "").trim(),
      nodoResponsableId: Number(formData.get("nodoResponsableId")),
      venceEn: venceEn ? new Date(venceEn) : undefined,
    });
  } catch (error) {
    return manejarError(error);
  }

  revalidatePath(`/app/proyectos/${proyectoId}`);
  return {};
}

export async function cambiarEstadoTareaAction(
  proyectoId: number,
  tareaId: number,
  formData: FormData,
) {
  const nuevoEstado = String(formData.get("estado")) as proyectos.EstadoTarea;
  await proyectos.cambiarEstadoTarea(tareaId, nuevoEstado);
  revalidatePath(`/app/proyectos/${proyectoId}`);
}

export async function asignarPersonaATareaAction(
  proyectoId: number,
  tareaId: number,
  formData: FormData,
) {
  const valor = String(formData.get("personaId") ?? "");
  await proyectos.asignarPersonaATarea(tareaId, valor ? Number(valor) : null);
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
