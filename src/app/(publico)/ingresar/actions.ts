"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { auth } from "@/kernel/identidad/auth";
import { persona } from "@/kernel/identidad/schema";

export interface EstadoIngreso {
  error?: string;
}

export async function iniciarSesionAction(
  _previo: EstadoIngreso,
  formData: FormData,
): Promise<EstadoIngreso> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  let usuarioId: string;
  try {
    const resultado = await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    });
    usuarioId = resultado.user.id;
  } catch {
    // better-auth no distingue "no existe" de "contraseña mal" en el
    // error — y está bien que no lo haga: decírselo aparte es
    // información gratis para alguien probando emails al azar.
    return { error: "Email o contraseña incorrectos." };
  }

  // A dónde entra depende de quién es, no de un parámetro — mismo
  // criterio que decidirAcceso (kernel/identidad/reglas-acceso.ts).
  // No se usa obtenerSesionActual() acá a propósito: esa función lee
  // la cookie de la request ENTRANTE (next/headers, de solo lectura) —
  // la cookie que signInEmail acaba de fijar es de la respuesta que
  // todavía no volvió al navegador, así que leerla ahora resuelve la
  // sesión VIEJA (la de quien estaba logueado antes en este mismo
  // navegador, si había alguien), no la nueva. Encontrado en vivo: un
  // segundo login en la misma sesión de navegador redirigía según la
  // cuenta anterior. El dato correcto ya está a mano — el usuarioId
  // que devuelve signInEmail — así que se resuelve el tipo con eso
  // directo, sin pasar por la cookie.
  const [personaVinculada] = await db
    .select({ tipo: persona.tipo })
    .from(persona)
    .where(eq(persona.usuarioId, usuarioId));

  if (personaVinculada?.tipo === "empleado") {
    redirect("/app");
  }
  if (personaVinculada?.tipo === "contacto_cliente") {
    redirect("/portal");
  }
  redirect("/");
}

export interface EstadoOlvide {
  enviado?: boolean;
}

export async function olvidePasswordAction(
  _previo: EstadoOlvide,
  formData: FormData,
): Promise<EstadoOlvide> {
  const email = String(formData.get("email") ?? "").trim();

  if (email) {
    // No se revela si el email existe o no — la respuesta es la misma
    // en los dos casos, adentro y afuera de la UI.
    await auth.api
      .requestPasswordReset({
        body: { email, redirectTo: "/restablecer-password" },
      })
      .catch(() => {});
  }

  return { enviado: true };
}
