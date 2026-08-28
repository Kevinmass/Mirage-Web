// Mismo criterio que el backfill de la migración 0014: minúsculas,
// separadores no alfanuméricos colapsados a un guion, sin guiones en
// las puntas. normalize("NFD") separa los acentos de su letra base
// (á -> a + ´) para poder sacarlos con el rango unicode de marcas
// combinantes, en vez de tener que enumerar cada vocal acentuada.
export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
