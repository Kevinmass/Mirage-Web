const RTF = new Intl.RelativeTimeFormat("es-AR", { numeric: "auto" });
const UNIDADES: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

// "hace 2 h" — la fecha exacta va en el title de quien lo use, esto
// nunca es la única forma de leer cuándo pasó algo.
export function tiempoRelativo(fecha: Date): string {
  const segundos = (fecha.getTime() - Date.now()) / 1000;
  for (const [unidad, segundosPorUnidad] of UNIDADES) {
    if (Math.abs(segundos) >= segundosPorUnidad) {
      return RTF.format(Math.round(segundos / segundosPorUnidad), unidad);
    }
  }
  return RTF.format(Math.round(segundos), "second");
}
