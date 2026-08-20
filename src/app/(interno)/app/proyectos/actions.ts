"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Conflicto, NoEncontrado, Validacion } from "@/kernel/errores";
import * as proyectos from "@/modules/proyectos/api";

export interface EstadoFormulario {
  error?: string;
}

function manejarError(error: unknown): EstadoFormulario {
  if (
    error instanceof Validacion ||
    error instanceof Conflicto ||
    error instanceof NoEncontrado
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

  let creado: Awaited<ReturnType<typeof proyectos.crearProyecto>>;
  try {
    creado = await proyectos.crearProyecto({
      clienteId: Number(formData.get("clienteId")),
      nombre: String(formData.get("nombre") ?? "").trim(),
      descripcion:
        String(formData.get("descripcion") ?? "").trim() || undefined,
      nodoResponsableId: Number(formData.get("nodoResponsableId")),
      fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
      fechaFinEstimada: fechaFinEstimada
        ? new Date(fechaFinEstimada)
        : undefined,
    });
  } catch (error) {
    return manejarError(error);
  }

  revalidatePath("/app/proyectos");
  redirect(`/app/proyectos/${creado.id}`);
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
