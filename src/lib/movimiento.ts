// Tiempos y curvas del sistema visual (§5.4 de
// docs/specs/2026-08-21-sistema-visual-mirage.md), en la forma que
// necesita código JS (spring físico, IntersectionObserver) en vez de CSS.
// Los mismos nombres existen como custom properties en globals.css para
// transiciones puramente CSS — mantenerlos en sincronía si cambian.

export const DURACION_MS = {
  micro: 120,
  rapida: 200,
  media: 320,
  entrada: 400,
  ambiente: 12_000,
} as const;

export const EASE = {
  salida: [0.22, 1, 0.36, 1],
  entrada: [0.55, 0, 1, 0.45],
  suave: [0.4, 0, 0.2, 1],
} as const;

// Rigidez y amortiguación del resorte del organigrama y del drag general.
export const RESORTE = {
  stiffness: 170,
  damping: 26,
} as const;
