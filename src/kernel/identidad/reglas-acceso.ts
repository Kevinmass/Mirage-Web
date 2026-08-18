import type { Sesion } from "./sesion";

export type DecisionAcceso = "permitir" | "no-encontrado";

// Diseño §3: "/" sin sesión; "/app" sesión + tipo empleado; "/portal"
// sesión + tipo contacto_cliente. Función pura (sin fetch/DB) para que
// la regla se pueda probar directo, sin pasar por Next — el middleware
// solo la usa y traduce el resultado a una respuesta HTTP.
//
// Un contacto_cliente que pide /app (o viceversa) recibe "no-encontrado"
// (404), no un 403: un 403 confirma que la ruta existe.
export function decidirAcceso(
  pathname: string,
  sesion: Sesion | null,
): DecisionAcceso {
  if (pathname === "/app" || pathname.startsWith("/app/")) {
    return sesion?.tipo === "empleado" ? "permitir" : "no-encontrado";
  }

  if (pathname === "/portal" || pathname.startsWith("/portal/")) {
    return sesion?.tipo === "contacto_cliente" ? "permitir" : "no-encontrado";
  }

  return "permitir";
}
