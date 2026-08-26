"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  Conflicto,
  NoAutorizado,
  NoEncontrado,
  Validacion,
} from "@/kernel/errores";
import { obtenerSesionActual } from "@/kernel/identidad/sesion";
import * as contenido from "@/modules/contenido/api";
import { slugify } from "@/lib/slugify";

export interface EstadoFormulario {
  error?: string;
}

function leerDatos(formData: FormData) {
  const imagenUrl = String(formData.get("imagenUrl") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  const proyectoOrigenId = String(formData.get("proyectoOrigenId") ?? "");
  const cuerpo = String(formData.get("cuerpo") ?? "").trim();

  return {
    nombre: String(formData.get("nombre") ?? "").trim(),
    descripcion: String(formData.get("descripcion") ?? "").trim(),
    cuerpo: cuerpo || undefined,
    imagenUrl: imagenUrl || undefined,
    color: color || undefined,
    proyectoOrigenId: proyectoOrigenId ? Number(proyectoOrigenId) : undefined,
    orden: Number(formData.get("orden") ?? 0),
    activo: formData.get("activo") === "on",
  };
}

async function personaActualOTira(): Promise<number> {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    throw new NoAutorizado("No hay sesión");
  }
  return sesion.personaId;
}

export async function crearServicioAction(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const personaId = await personaActualOTira();
  const datos = leerDatos(formData);

  try {
    const slug = await contenido.generarSlugDisponible(slugify(datos.nombre));
    await contenido.crearServicio(personaId, { ...datos, slug });
  } catch (error) {
    if (
      error instanceof Validacion ||
      error instanceof Conflicto ||
      error instanceof NoEncontrado ||
      error instanceof NoAutorizado
    ) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath("/app/contenido");
  revalidatePath("/servicios");
  redirect("/app/contenido");
}

export async function actualizarServicioAction(
  id: number,
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const personaId = await personaActualOTira();
  const datos = leerDatos(formData);

  try {
    await contenido.actualizarServicio(personaId, id, datos);
  } catch (error) {
    if (
      error instanceof Validacion ||
      error instanceof Conflicto ||
      error instanceof NoEncontrado ||
      error instanceof NoAutorizado
    ) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath("/app/contenido");
  revalidatePath("/servicios");
  revalidatePath(`/servicios/${(await contenido.obtenerServicio(id)).slug}`);
  redirect("/app/contenido");
}

function leerDatosCaso(formData: FormData): contenido.DatosCaso {
  const clienteId = String(formData.get("clienteId") ?? "");
  const testimonio = String(formData.get("testimonio") ?? "").trim();
  const autor = String(formData.get("autor") ?? "").trim();
  const cargoAutor = String(formData.get("cargoAutor") ?? "").trim();
  const imagenUrl = String(formData.get("imagenUrl") ?? "").trim();

  return {
    titulo: String(formData.get("titulo") ?? "").trim(),
    resumen: String(formData.get("resumen") ?? "").trim(),
    clienteId: clienteId ? Number(clienteId) : undefined,
    testimonio: testimonio || undefined,
    autor: autor || undefined,
    cargoAutor: cargoAutor || undefined,
    imagenUrl: imagenUrl || undefined,
    publicado: formData.get("publicado") === "on",
  };
}

export async function crearCasoAction(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const personaId = await personaActualOTira();

  try {
    await contenido.crearCaso(personaId, leerDatosCaso(formData));
  } catch (error) {
    if (
      error instanceof Validacion ||
      error instanceof Conflicto ||
      error instanceof NoEncontrado ||
      error instanceof NoAutorizado
    ) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath("/app/contenido");
  revalidatePath("/casos");
  redirect("/app/contenido");
}

export async function actualizarCasoAction(
  id: number,
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const personaId = await personaActualOTira();

  try {
    await contenido.actualizarCaso(personaId, id, leerDatosCaso(formData));
  } catch (error) {
    if (
      error instanceof Validacion ||
      error instanceof Conflicto ||
      error instanceof NoEncontrado ||
      error instanceof NoAutorizado
    ) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath("/app/contenido");
  revalidatePath("/casos");
  redirect("/app/contenido");
}
