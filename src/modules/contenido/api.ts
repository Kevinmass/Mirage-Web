import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { contenidoCaso, contenidoPagina, contenidoServicio } from "./schema";

// Solo lectura en v1 (diseño §6.1). El panel para editar estas tablas
// llega recién con /app (fase 3); hasta entonces el contenido se carga
// por seed.

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

export async function listarCasosPublicados() {
  return db
    .select()
    .from(contenidoCaso)
    .where(eq(contenidoCaso.publicado, true));
}
