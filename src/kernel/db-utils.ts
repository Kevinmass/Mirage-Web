// drizzle-orm envuelve el error del driver en DrizzleQueryError; el
// código de Postgres (23505 = unique_violation) queda en `.cause`, no en
// el error de arriba. Compartido entre módulos que traducen violaciones
// de unique index a Conflicto (personas.ts, organigrama/arbol.ts).
export function esViolacionDeUnicidad(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const codigo = (error as { code?: string }).code;
  if (codigo === "23505") return true;
  const causa = (error as { cause?: unknown }).cause;
  return (
    typeof causa === "object" &&
    causa !== null &&
    (causa as { code?: string }).code === "23505"
  );
}
