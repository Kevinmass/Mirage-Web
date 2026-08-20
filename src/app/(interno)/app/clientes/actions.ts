"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Conflicto, NoEncontrado, Validacion } from "@/kernel/errores";
import { invitarPersona } from "@/kernel/identidad/personas";
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

export async function crearContactoAction(
  clienteId: number,
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const telefono = String(formData.get("telefono") ?? "").trim();
  const cargo = String(formData.get("cargo") ?? "").trim();
  try {
    await clientes.crearContacto(clienteId, {
      email: String(formData.get("email") ?? "").trim(),
      nombre: String(formData.get("nombre") ?? "").trim(),
      apellido: String(formData.get("apellido") ?? "").trim(),
      telefono: telefono || undefined,
      cargo: cargo || undefined,
      esPrincipal: formData.get("esPrincipal") === "on",
    });
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

  revalidatePath(`/app/clientes/${clienteId}`);
  return {};
}

// Invitar a un contacto a tener acceso al portal es el mismo mecanismo
// que invitar a un empleado a /app (kernel/identidad/personas —
// invitarPersona no distingue tipo de persona). Vive acá, no en
// clientes/api.ts, porque es una acción de UI (redirige la Server
// Action del lado de personas), no una operación del dominio de
// clientes.
export async function invitarContactoAction(clienteId: number, id: number) {
  await invitarPersona(id);
  revalidatePath(`/app/clientes/${clienteId}`);
}

export async function registrarInteraccionAction(
  clienteId: number,
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    await clientes.registrarInteraccion(clienteId, {
      personaId: Number(formData.get("personaId")),
      tipo: String(formData.get("tipo")) as clientes.DatosInteraccion["tipo"],
      resumen: String(formData.get("resumen") ?? "").trim(),
    });
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

  revalidatePath(`/app/clientes/${clienteId}`);
  return {};
}
