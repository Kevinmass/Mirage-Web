"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Conflicto, NoEncontrado, Validacion } from "@/kernel/errores";
import * as clientes from "@/modules/clientes/api";

export interface EstadoFormulario {
  error?: string;
}

function leerDatosCliente(formData: FormData): clientes.DatosCliente {
  return {
    nombre: String(formData.get("nombre") ?? "").trim(),
    cuit: String(formData.get("cuit") ?? "").trim(),
    nodoResponsableId: Number(formData.get("nodoResponsableId")),
    contactoDirectoId: Number(formData.get("contactoDirectoId")),
  };
}

export async function crearClienteAction(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  let creado: Awaited<ReturnType<typeof clientes.crearCliente>>;
  try {
    creado = await clientes.crearCliente(leerDatosCliente(formData));
  } catch (error) {
    if (
      error instanceof Validacion ||
      error instanceof Conflicto ||
      error instanceof NoEncontrado
    ) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath("/app/clientes");
  redirect(`/app/clientes/${creado.id}`);
}

export async function actualizarClienteAction(
  id: number,
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    await clientes.actualizarCliente(id, leerDatosCliente(formData));
  } catch (error) {
    if (
      error instanceof Validacion ||
      error instanceof Conflicto ||
      error instanceof NoEncontrado
    ) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath("/app/clientes");
  revalidatePath(`/app/clientes/${id}`);
  redirect(`/app/clientes/${id}`);
}

export async function archivarClienteAction(id: number) {
  await clientes.archivarCliente(id);
  revalidatePath("/app/clientes");
  revalidatePath(`/app/clientes/${id}`);
}
