"use server";

import { revalidatePath } from "next/cache";
import * as notificaciones from "@/modules/notificaciones/api";

export async function reintentarNotificacionAction(id: number) {
  await notificaciones.reintentarNotificacion(id);
  revalidatePath("/app/ajustes/notificaciones");
}
