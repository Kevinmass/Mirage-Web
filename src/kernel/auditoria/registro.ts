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
