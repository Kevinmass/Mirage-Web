import Script from "next/script";

// Se ejecuta antes del primer pintado (beforeInteractive: Next lo inyecta
// en <head> y lo corre antes de hidratar) para que la clase .dark ya esté
// puesta cuando el navegador pinta el primer frame — sin esto hay flash
// de tema equivocado en cada carga (§6.2). Plain JS a propósito: no puede
// importar src/lib/tema.ts porque corre antes de que exista cualquier
// bundle de la app. La clave "mirage-tema" tiene que coincidir con
// CLAVE_TEMA de ese archivo.
const SCRIPT = `
(function () {
  try {
    var guardado = window.localStorage.getItem("mirage-tema");
    var oscuro = guardado
      ? guardado === "oscuro"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", oscuro);
  } catch (e) {}
})();
`;

export function ScriptTema() {
  return (
    <Script
      id="script-tema"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: SCRIPT }}
    />
  );
}
