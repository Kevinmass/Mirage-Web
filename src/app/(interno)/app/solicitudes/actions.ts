"use server";

import { revalidatePath } from "next/cache";
import { obtenerSesionActual } from "@/kernel/identidad/sesion";
import { Conflicto, NoEncontrado, Validacion } from "@/kernel/errores";
import * as solicitudes from "@/modules/solicitudes/api";

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

export async function marcarEnEvaluacionAction(id: number) {
  await solicitudes.marcarEnEvaluacion(id);
  revalidatePath("/app/solicitudes");
  revalidatePath(`/app/solicitudes/${id}`);
}

export async function aceptarSolicitudAction(id: number) {
  await solicitudes.aceptarSolicitud(id);
  revalidatePath("/app/solicitudes");
  revalidatePath(`/app/solicitudes/${id}`);
}

export async function rechazarSolicitudAction(id: number) {
  await solicitudes.rechazarSolicitud(id);
  revalidatePath("/app/solicitudes");
  revalidatePath(`/app/solicitudes/${id}`);
}

// El interruptor de visibilidad es un checkbox HTML común (name
// "visibleParaCliente") — sin marcar, FormData ni siquiera manda la
// clave, por eso el default acá es false (mensaje interno) salvo que
// venga marcado explícitamente. Quien manda el mensaje es la persona
// de la sesión actual, nunca un campo del formulario — no hay forma de
// enviar "en nombre de otro empleado" desde acá.
export async function agregarMensajeAction(
  solicitudId: number,
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    return { error: "Iniciá sesión para responder." };
  }

  const cuerpo = String(formData.get("cuerpo") ?? "").trim();
  if (!cuerpo) {
    return { error: "El mensaje no puede estar vacío." };
  }
  const visibleParaCliente = formData.get("visibleParaCliente") === "on";

  try {
    await solicitudes.agregarMensaje(
      solicitudId,
      sesion.personaId,
      cuerpo,
      visibleParaCliente,
    );
  } catch (error) {
    return manejarError(error);
  }

  revalidatePath(`/app/solicitudes/${solicitudId}`);
  return {};
}
