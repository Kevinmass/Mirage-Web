import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { eventoAuditoria } from "./schema";

export interface RegistrarEventoInput {
  personaId?: number;
  accion: string;
  entidad: string;
  entidadId?: number;
  datos?: unknown;
}

// Helper que usan los módulos para dejar rastro en la auditoría. No hay
// forma de editar ni borrar lo que se registra acá — ver schema.ts.
export async function registrarEvento(
  input: RegistrarEventoInput,
): Promise<void> {
  await db.insert(eventoAuditoria).values({
    personaId: input.personaId,
    accion: input.accion,
    entidad: input.entidad,
    entidadId: input.entidadId,
    datos: input.datos,
  });
}

// Para "actividad reciente" del tablero de /app (PR 7). Se llena con lo
// que cada módulo registre vía registrarEvento — hoy solo contenido lo
// hace (PR 4/5); el resto de los módulos todavía no llama a esta
// función, así que este historial va a verse chico hasta que la
// llamen también, no porque el tablero esté mal.
export async function listarEventosRecientes(limite = 10) {
  return db
    .select()
    .from(eventoAuditoria)
    .orderBy(desc(eventoAuditoria.creadoEn))
    .limit(limite);
}
