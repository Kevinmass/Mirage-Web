"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Conflicto, Validacion } from "@/kernel/errores";
import * as personas from "@/kernel/identidad/personas";

export interface EstadoFormulario {
  error?: string;
}

function leerDatosPersona(formData: FormData): personas.DatosPersona {
  const telefono = String(formData.get("telefono") ?? "").trim();
  return {
    nombre: String(formData.get("nombre") ?? "").trim(),
    apellido: String(formData.get("apellido") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    telefono: telefono || undefined,
    tipo:
      formData.get("tipo") === "contacto_cliente"
        ? "contacto_cliente"
        : "empleado",
  };
}

export async function crearPersonaAction(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    await personas.crearPersona(leerDatosPersona(formData));
  } catch (error) {
    if (error instanceof Validacion || error instanceof Conflicto) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath("/app/personas");
  redirect("/app/personas");
}

export async function actualizarPersonaAction(
  id: number,
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    await personas.actualizarPersona(id, leerDatosPersona(formData));
  } catch (error) {
    if (error instanceof Validacion || error instanceof Conflicto) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath("/app/personas");
  revalidatePath(`/app/personas/${id}`);
  redirect("/app/personas");
}

export async function archivarPersonaAction(id: number) {
  await personas.archivarPersona(id);
  revalidatePath("/app/personas");
  revalidatePath(`/app/personas/${id}`);
}

export async function invitarPersonaAction(id: number) {
  await personas.invitarPersona(id);
  revalidatePath(`/app/personas/${id}`);
}
