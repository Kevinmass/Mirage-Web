"use client";

import { useSyncExternalStore } from "react";

function suscribir(notificar: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", notificar);
  return () => media.removeEventListener("change", notificar);
}

function leerValor() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Se usa donde una animación es JS (rAF, física de resorte) y no puede
// resolverse con la media query de CSS sola (organigrama, PR 8). El
// prefijo queda en inglés a propósito — es lo que
// eslint-plugin-react-hooks exige para reconocer un Hook (mismo criterio
// que las tablas de better-auth: traducir acá es superficie para un
// error sin beneficio real).
export function useMovimientoReducido(): boolean {
  return useSyncExternalStore(suscribir, leerValor, () => false);
}
