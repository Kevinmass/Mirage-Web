"use server";

import { revalidatePath } from "next/cache";
import { obtenerSesionActual } from "@/kernel/identidad/sesion";
import * as notificaciones from "@/modules/notificaciones/api";

export async function marcarTodasLeidasAction() {
  const sesion = await obtenerSesionActual();
  if (!sesion) return;
  await notificaciones.marcarTodasLeidasDePersona(sesion.personaId);
  revalidatePath("/app/notificaciones");
}
