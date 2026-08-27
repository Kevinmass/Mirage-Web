"use server";

import { revalidatePath } from "next/cache";
import { Conflicto, NoAutorizado, Validacion } from "@/kernel/errores";
import { obtenerSesionActual } from "@/kernel/identidad/sesion";
import * as arbol from "@/kernel/organigrama/arbol";

export interface EstadoAccion {
  error?: string;
}

function mensajeDeError(error: unknown): string {
  if (
    error instanceof Validacion ||
    error instanceof Conflicto ||
    error instanceof NoAutorizado
  ) {
    return error.message;
  }
  throw error;
}

// Chequeo server-side de que la sesión puede administrar (asignar /
// desasignar) en un nodo. El gateo de la UI (nodosControladosIds /
// administraTodo) es solo cosmético; esto es la barrera real.
async function exigirAdministrarNodo(nodoId: number) {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    throw new NoAutorizado("Iniciá sesión.");
  }
  if (!(await arbol.puedeAdministrarNodo(sesion.personaId, nodoId))) {
    throw new NoAutorizado(
      "Para asignar acá hace falta ocupar este nodo o uno superior, " +
        'o tener la capacidad "organigrama.administrar".',
    );
  }
}

export async function crearNodoAction(
  padreId: number,
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) {
    return { error: "El nombre es obligatorio" };
  }

  try {
    await arbol.crearNodo({ nombre, padreId });
  } catch (error) {
    return { error: mensajeDeError(error) };
  }

  revalidatePath("/app/organigrama");
  return {};
}

export async function actualizarNodoAction(
  id: number,
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  if (!nombre) {
    return { error: "El nombre es obligatorio" };
  }

  try {
    await arbol.actualizarNodo(id, {
      nombre,
      descripcion: descripcion || undefined,
    });
  } catch (error) {
    return { error: mensajeDeError(error) };
  }

  revalidatePath("/app/organigrama");
  return {};
}

export async function moverNodoAction(
  id: number,
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const nuevoPadreId = Number(formData.get("nuevoPadreId"));
  // Number("") es 0 y Number.isInteger(0) es true — el guardia tiene que
  // exigir > 0, no solo "es entero" (§1.12).
  if (!Number.isInteger(nuevoPadreId) || nuevoPadreId <= 0) {
    return { error: "Elegí un nuevo padre" };
  }

  try {
    await arbol.moverNodo(id, nuevoPadreId);
  } catch (error) {
    return { error: mensajeDeError(error) };
  }

  revalidatePath("/app/organigrama");
  return {};
}

export async function archivarNodoAction(
  id: number,
  _previo: EstadoAccion,
): Promise<EstadoAccion> {
  try {
    await arbol.archivarNodo(id);
  } catch (error) {
    return { error: mensajeDeError(error) };
  }

  revalidatePath("/app/organigrama");
  return {};
}

export async function asignarPersonaAction(
  nodoId: number,
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const personaId = Number(formData.get("personaId"));
  const esTitular = formData.get("esTitular") === "on";
  // Number("") es 0 y Number.isInteger(0) es true — el guardia "Elegí una
  // persona" no atrapaba el <select> vacío (§1.12). Exigir > 0.
  if (!Number.isInteger(personaId) || personaId <= 0) {
    return { error: "Elegí una persona" };
  }

  try {
    await exigirAdministrarNodo(nodoId);
    await arbol.asignarPersona(personaId, nodoId, esTitular);
  } catch (error) {
    return { error: mensajeDeError(error) };
  }

  revalidatePath("/app/organigrama");
  return {};
}

export async function finalizarAsignacionAction(asignacionId: number) {
  const nodoId = await arbol.nodoIdDeAsignacion(asignacionId);
  if (nodoId === null) return;
  await exigirAdministrarNodo(nodoId);
  await arbol.finalizarAsignacion(asignacionId);
  revalidatePath("/app/organigrama");
}
