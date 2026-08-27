"use server";

import { revalidatePath } from "next/cache";
import { Conflicto, NoAutorizado, Validacion } from "@/kernel/errores";
import * as roles from "@/kernel/permisos/roles";
import { exigirCapacidadActual } from "../_guardas";

export interface EstadoRoles {
  error?: string;
}

function mensaje(error: unknown): string {
  if (
    error instanceof Validacion ||
    error instanceof Conflicto ||
    error instanceof NoAutorizado
  ) {
    return error.message;
  }
  throw error;
}

export async function crearRolAction(
  _previo: EstadoRoles,
  formData: FormData,
): Promise<EstadoRoles> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();

  try {
    await exigirCapacidadActual("identidad.administrar");
    await roles.crearRol(nombre, descripcion || undefined);
  } catch (error) {
    return { error: mensaje(error) };
  }

  revalidatePath("/app/roles");
  return {};
}

export async function fijarCapacidadesDeRolAction(
  rolId: number,
  _previo: EstadoRoles,
  formData: FormData,
): Promise<EstadoRoles> {
  const claves = formData.getAll("capacidad").map((v) => String(v));

  try {
    await exigirCapacidadActual("identidad.administrar");
    await roles.fijarCapacidadesDeRol(rolId, claves);
  } catch (error) {
    return { error: mensaje(error) };
  }

  revalidatePath("/app/roles");
  return {};
}
