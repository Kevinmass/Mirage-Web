"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/kernel/identidad/auth";

// Compartida entre /app y /portal — cerrar sesión no depende de cuál
// de las dos es.
export async function cerrarSesionAction() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/ingresar");
}
