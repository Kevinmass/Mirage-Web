import { NoAutorizado } from "@/kernel/errores";
import { obtenerSesionActual } from "@/kernel/identidad/sesion";
import { requiere } from "@/kernel/permisos/evaluar";

// Helpers de permisos para las Server Actions de /app. No es un archivo
// "use server" a propósito: así se pueden exportar funciones normales
// (todo export en un módulo "use server" se vuelve una Server Action).

export async function personaActualOTira(): Promise<number> {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    throw new NoAutorizado("Iniciá sesión.");
  }
  return sesion.personaId;
}

// La sesión actual tiene que tener la capacidad, o tira NoAutorizado con
// el nombre de la capacidad que falta (§6 del plan de fixes).
export async function exigirCapacidadActual(clave: string): Promise<number> {
  const personaId = await personaActualOTira();
  await requiere(personaId, clave);
  return personaId;
}
