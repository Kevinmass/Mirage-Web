import { notInArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { capacidad } from "./schema";

export interface CapacidadDeclarada {
  clave: string;
  modulo: string;
  descripcion: string;
}

// Genérico a propósito: no conoce "contenido" ni ningún otro módulo en
// particular (diseño §4.3, "el kernel no las conoce de antemano"). Quién
// llama a esto sí conoce la lista completa — ver
// capacidades-declaradas.ts, que agrega las de cada módulo igual que
// db/schema.ts agrega sus tablas.
export async function registrarCapacidades(
  declaradas: readonly CapacidadDeclarada[],
): Promise<void> {
  if (declaradas.length > 0) {
    await db
      .insert(capacidad)
      .values(declaradas.map((c) => ({ ...c, huerfana: false })))
      .onConflictDoUpdate({
        target: capacidad.clave,
        set: {
          modulo: sql`excluded.modulo`,
          descripcion: sql`excluded.descripcion`,
          huerfana: false,
        },
      });
  }

  const claves = declaradas.map((c) => c.clave);
  // Lo que ya estaba en la base y ya no declara ningún módulo: huérfano,
  // no se borra (ver comentario en schema.ts).
  await db
    .update(capacidad)
    .set({ huerfana: true })
    .where(claves.length > 0 ? notInArray(capacidad.clave, claves) : undefined);
}
