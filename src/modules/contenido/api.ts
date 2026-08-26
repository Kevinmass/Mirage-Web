import { asc, eq } from "drizzle-orm";
import { registrarEvento } from "@/kernel/auditoria/registro";
import { db } from "@/db/client";
import { esViolacionDeUnicidad } from "@/kernel/db-utils";
import { Conflicto, NoEncontrado } from "@/kernel/errores";
import { requiere } from "@/kernel/permisos/evaluar";
import { contenidoCaso, contenidoPagina, contenidoServicio } from "./schema";

// Lectura: sin restricción (diseño §6.1, la web pública no tiene
// sesión). Escritura: requiere "contenido.editar" y queda auditada —
// el panel de administración es el PR 4.

export async function obtenerPaginaPorSlug(slug: string) {
  const [pagina] = await db
    .select()
    .from(contenidoPagina)
    .where(eq(contenidoPagina.slug, slug))
    .limit(1);

  return pagina && pagina.publicada ? pagina : undefined;
}

export async function listarServiciosActivos() {
  return db
    .select()
    .from(contenidoServicio)
    .where(eq(contenidoServicio.activo, true))
    .orderBy(asc(contenidoServicio.orden));
}

export async function obtenerServicioPorSlug(slug: string) {
  const [fila] = await db
    .select()
    .from(contenidoServicio)
    .where(eq(contenidoServicio.slug, slug))
    .limit(1);

  return fila && fila.activo ? fila : undefined;
}

// Para el ABM de /app/contenido: todos, publicados o no.
export async function listarServicios() {
  return db
    .select()
    .from(contenidoServicio)
    .orderBy(asc(contenidoServicio.orden));
}

export async function obtenerServicio(id: number) {
  const [fila] = await db
    .select()
    .from(contenidoServicio)
    .where(eq(contenidoServicio.id, id));
  if (!fila) {
    throw new NoEncontrado(`No existe el servicio ${id}`);
  }
  return fila;
}

// El ABM no pide un campo de slug (§1.3 y §8.2 del plan de frontend no
// lo listan entre los campos del formulario) — se deriva de "nombre",
// mismo criterio que el backfill de la migración 0014. Ante colisión
// (dos servicios con nombres que slugifican igual, como ya pasa con el
// seed) se suma -2, -3... hasta encontrar uno libre.
export async function generarSlugDisponible(base: string): Promise<string> {
  let candidato = base;
  let sufijo = 1;
  while (true) {
    const [existente] = await db
      .select({ id: contenidoServicio.id })
      .from(contenidoServicio)
      .where(eq(contenidoServicio.slug, candidato))
      .limit(1);
    if (!existente) return candidato;
    sufijo += 1;
    candidato = `${base}-${sufijo}`;
  }
}

export interface DatosServicio {
  nombre: string;
  descripcion: string;
  slug: string;
  cuerpo?: string;
  imagenUrl?: string;
  color?: string;
  proyectoOrigenId?: number;
  orden: number;
  activo: boolean;
}

export async function crearServicio(personaId: number, datos: DatosServicio) {
  await requiere(personaId, "contenido.editar");

  try {
    const [creado] = await db
      .insert(contenidoServicio)
      .values(datos)
      .returning();
    await registrarEvento({
      personaId,
      accion: "contenido.servicio.creado",
      entidad: "contenido_servicio",
      entidadId: creado!.id,
    });
    return creado!;
  } catch (error) {
    if (esViolacionDeUnicidad(error)) {
      throw new Conflicto(`Ya existe un servicio con el slug "${datos.slug}"`);
    }
    throw error;
  }
}

export async function actualizarServicio(
  personaId: number,
  id: number,
  datos: Partial<DatosServicio>,
) {
  await requiere(personaId, "contenido.editar");
  await obtenerServicio(id);

  try {
    const [actualizado] = await db
      .update(contenidoServicio)
      .set(datos)
      .where(eq(contenidoServicio.id, id))
      .returning();
    await registrarEvento({
      personaId,
      accion: "contenido.servicio.actualizado",
      entidad: "contenido_servicio",
      entidadId: id,
      datos,
    });
    return actualizado!;
  } catch (error) {
    if (esViolacionDeUnicidad(error)) {
      throw new Conflicto(`Ya existe un servicio con ese slug`);
    }
    throw error;
  }
}

export async function listarCasosPublicados() {
  return db
    .select()
    .from(contenidoCaso)
    .where(eq(contenidoCaso.publicado, true));
}

// Para el ABM de /app/contenido: todos, publicados o no.
export async function listarCasos() {
  return db.select().from(contenidoCaso);
}

export async function obtenerCaso(id: number) {
  const [fila] = await db
    .select()
    .from(contenidoCaso)
    .where(eq(contenidoCaso.id, id));
  if (!fila) {
    throw new NoEncontrado(`No existe el caso ${id}`);
  }
  return fila;
}

export interface DatosCaso {
  titulo: string;
  resumen: string;
  clienteId?: number;
  testimonio?: string;
  autor?: string;
  cargoAutor?: string;
  imagenUrl?: string;
  publicado: boolean;
}

export async function crearCaso(personaId: number, datos: DatosCaso) {
  await requiere(personaId, "contenido.editar");

  const [creado] = await db.insert(contenidoCaso).values(datos).returning();
  await registrarEvento({
    personaId,
    accion: "contenido.caso.creado",
    entidad: "contenido_caso",
    entidadId: creado!.id,
  });
  return creado!;
}

export async function actualizarCaso(
  personaId: number,
  id: number,
  datos: Partial<DatosCaso>,
) {
  await requiere(personaId, "contenido.editar");
  await obtenerCaso(id);

  const [actualizado] = await db
    .update(contenidoCaso)
    .set(datos)
    .where(eq(contenidoCaso.id, id))
    .returning();
  await registrarEvento({
    personaId,
    accion: "contenido.caso.actualizado",
    entidad: "contenido_caso",
    entidadId: id,
    datos,
  });
  return actualizado!;
}
