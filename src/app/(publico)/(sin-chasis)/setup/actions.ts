"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/kernel/identidad/auth";
import {
  crearPrimerEmpleado,
  existeAlgunaPersona,
} from "@/kernel/identidad/arranque";
import { Validacion } from "@/kernel/errores";

export interface EstadoSetup {
  error?: string;
}

export async function crearPrimerEmpleadoAction(
  _previo: EstadoSetup,
  formData: FormData,
): Promise<EstadoSetup> {
  // Las Server Actions son endpoints: el guardia de la página no alcanza,
  // hay que revalidar las dos condiciones acá también.
  const token = String(formData.get("token") ?? "");
  const tokenEsperado = process.env.SETUP_TOKEN;
  if (!token || !tokenEsperado || token !== tokenEsperado) {
    return { error: "No autorizado." };
  }
  if (await existeAlgunaPersona()) {
    return { error: "Ya existe una persona. Esta pantalla ya no aplica." };
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const apellido = String(formData.get("apellido") ?? "").trim();

  if (!nombre || !apellido) {
    return { error: "Nombre y apellido son obligatorios." };
  }

  try {
    await crearPrimerEmpleado({ email, password, nombre, apellido });
  } catch (error) {
    if (error instanceof Validacion) {
      return { error: error.message };
    }
    throw error;
  }

  // Nace verificado, así que el login entra directo.
  await auth.api.signInEmail({
    body: { email, password },
    headers: await headers(),
  });
  redirect("/app");
}
