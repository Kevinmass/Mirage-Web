"use server";

import { revalidatePath } from "next/cache";
import { Conflicto, Validacion } from "@/kernel/errores";
import * as arbol from "@/kernel/organigrama/arbol";

export interface EstadoAccion {
  error?: string;
}

function mensajeDeError(error: unknown): string {
  if (error instanceof Validacion || error instanceof Conflicto) {
    return error.message;
  }
  throw error;
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
  if (!Number.isInteger(nuevoPadreId)) {
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
  if (!Number.isInteger(personaId)) {
    return { error: "Elegí una persona" };
  }

  try {
    await arbol.asignarPersona(personaId, nodoId, esTitular);
  } catch (error) {
    return { error: mensajeDeError(error) };
  }

  revalidatePath("/app/organigrama");
  return {};
}

export async function finalizarAsignacionAction(asignacionId: number) {
  await arbol.finalizarAsignacion(asignacionId);
  revalidatePath("/app/organigrama");
}
