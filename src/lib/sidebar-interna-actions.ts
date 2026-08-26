"use server";

import { cookies } from "next/headers";

// La cookie es la única fuente de verdad del estado colapsado/expandido
// (§6.2 del sistema visual, PR 7): el layout la lee en el servidor y
// renderiza el ancho correcto desde el primer HTML — sin esto hay un
// salto visual en cada recarga mientras el cliente decide.
const CLAVE_COOKIE = "mirage-sidebar-colapsada";

export async function leerSidebarColapsada(): Promise<boolean> {
  const store = await cookies();
  return store.get(CLAVE_COOKIE)?.value === "1";
}

export async function alternarSidebarAction() {
  const store = await cookies();
  const actual = store.get(CLAVE_COOKIE)?.value === "1";
  store.set(CLAVE_COOKIE, actual ? "0" : "1", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
