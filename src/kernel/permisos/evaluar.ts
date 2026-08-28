import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { NoAutorizado } from "@/kernel/errores";
import { personaRol, rolCapacidad } from "./schema";

export async function tienePermiso(
  personaId: number,
  capacidadClave: string,
): Promise<boolean> {
  const [fila] = await db
    .select({ clave: rolCapacidad.capacidadClave })
    .from(personaRol)
    .innerJoin(rolCapacidad, eq(personaRol.rolId, rolCapacidad.rolId))
    .where(
      and(
        eq(personaRol.personaId, personaId),
        eq(rolCapacidad.capacidadClave, capacidadClave),
      ),
    )
    .limit(1);

  return fila !== undefined;
}

// Helper para usar en api.ts: `await requiere(personaId, "clientes.ver")`
// antes de la operación que esa capacidad protege.
export async function requiere(
  personaId: number,
  capacidadClave: string,
): Promise<void> {
  if (!(await tienePermiso(personaId, capacidadClave))) {
    throw new NoAutorizado(`Falta la capacidad "${capacidadClave}"`);
  }
}
