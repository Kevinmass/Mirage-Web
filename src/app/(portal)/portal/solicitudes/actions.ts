"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Conflicto, NoEncontrado, Validacion } from "@/kernel/errores";
import { obtenerSesionPortal } from "@/lib/sesion-portal";
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

// clienteId y creadaPorPersonaId salen siempre de la sesión, nunca de
// un campo del formulario (diseño §8, el mismo principio que
// sesion-portal.ts): no hay forma de que este formulario cree una
// solicitud para un cliente distinto del que inició sesión.
export async function crearSolicitudAction(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const sesion = await obtenerSesionPortal();
  if (!sesion) {
    return { error: "Iniciá sesión para continuar." };
  }

  const titulo = String(formData.get("titulo") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "") as solicitudes.TipoSolicitud;
  if (!titulo || !descripcion) {
    return { error: "Completá el título y la descripción." };
  }

  let creada: Awaited<ReturnType<typeof solicitudes.crearSolicitud>>;
  try {
    creada = await solicitudes.crearSolicitud(
      sesion.clienteId,
      sesion.personaId,
      { titulo, descripcion, tipo },
    );
  } catch (error) {
    return manejarError(error);
  }

  revalidatePath("/portal/solicitudes");
  redirect(`/portal/solicitudes/${creada.id}`);
}

// Un contacto de cliente nunca escribe un mensaje interno — acá no
// hay campo "visible para el cliente" como en /app: para el portal
// ese concepto no existe, todo lo que el cliente escribe es, por
// definición, visible para el cliente. obtenerSolicitudDeCliente
// valida la pertenencia antes de escribir: adivinar un id de otro
// cliente en el formulario no alcanza para mandarle un mensaje a su
// hilo.
export async function agregarMensajeAction(
  solicitudId: number,
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const sesion = await obtenerSesionPortal();
  if (!sesion) {
    return { error: "Iniciá sesión para continuar." };
  }

  const cuerpo = String(formData.get("cuerpo") ?? "").trim();
  if (!cuerpo) {
    return { error: "El mensaje no puede estar vacío." };
  }

  try {
    await solicitudes.obtenerSolicitudDeCliente(sesion.clienteId, solicitudId);
    await solicitudes.agregarMensaje(
      solicitudId,
      sesion.personaId,
      cuerpo,
      true,
    );
  } catch (error) {
    return manejarError(error);
  }

  revalidatePath(`/portal/solicitudes/${solicitudId}`);
  return {};
}
