// Persistencia del tema (§6.2 del sistema visual). La clave y los
// valores acá tienen que coincidir exactamente con el script inline de
// app/layout.tsx, que aplica la clase antes del primer pintado — ese
// script no puede importar este módulo (corre antes de que exista
// cualquier bundle), así que si esto cambia, el script se actualiza a mano.
export const CLAVE_TEMA = "mirage-tema";

export type Tema = "claro" | "oscuro";

export function leerTema(): Tema {
  if (typeof window === "undefined") return "claro";
  const guardado = window.localStorage.getItem(CLAVE_TEMA);
  if (guardado === "oscuro" || guardado === "claro") return guardado;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "oscuro"
    : "claro";
}

export function aplicarTema(tema: Tema) {
  document.documentElement.classList.toggle("dark", tema === "oscuro");
  window.localStorage.setItem(CLAVE_TEMA, tema);
}
