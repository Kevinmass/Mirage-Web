// Helpers para leer FormData en Server Actions sin los pies de barro
// típicos (§1.10 / §1.12 del plan de fixes).

// El id que sale de un <select> / <Select>: un entero positivo, o null si
// no se eligió nada. Number("") es 0, Number(null) es 0 y Number("x") es
// NaN — sin este filtro, 0 llega al kernel como "no existe el nodo 0" y
// NaN revienta la query de Postgres como error crudo (500).
export function idElegido(valor: FormDataEntryValue | null): number | null {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
}
