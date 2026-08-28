"use server";

import { redirect } from "next/navigation";
import { auth } from "@/kernel/identidad/auth";

export interface EstadoRestablecer {
  error?: string;
}

export async function restablecerPasswordAction(
  _previo: EstadoRestablecer,
  formData: FormData,
): Promise<EstadoRestablecer> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");

  if (password.length < 8) {
    return { error: "La contraseña tiene que tener al menos 8 caracteres." };
  }
  if (!token) {
    return {
      error:
        "El link no es válido. Pedí uno nuevo desde 'Olvidé mi contraseña'.",
    };
  }

  try {
    await auth.api.resetPassword({ body: { newPassword: password, token } });
  } catch {
    return {
      error:
        "El link venció o ya se usó. Pedí uno nuevo desde 'Olvidé mi contraseña'.",
    };
  }

  redirect("/ingresar");
}
