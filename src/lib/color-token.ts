// Resuelve una custom property CSS (`--turquesa-500`, …) al `#rrggbb` que
// esperan los props de color de los fondos de React Bits — que no pueden
// leer variables CSS desde el shader. Solo cliente. Así el harness de
// `/dev/hero` no tiene un solo color literal: todo sale de los tokens de
// `globals.css`.
//
// La conversión va por un canvas 2D: `getComputedStyle().color` puede
// devolver `lab(...)`, `oklch(...)` o `color(srgb ...)` según el navegador,
// y el 2D context normaliza cualquiera de esas a bytes sRGB.
export function tokenAHex(nombre: `--${string}`): string {
  if (typeof window === "undefined") return "#000000";

  const sonda = document.createElement("span");
  sonda.style.color = `var(${nombre})`;
  sonda.style.position = "absolute";
  sonda.style.opacity = "0";
  sonda.style.pointerEvents = "none";
  document.body.appendChild(sonda);
  const css = getComputedStyle(sonda).color;
  sonda.remove();

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "#000000";
  ctx.fillStyle = "#000000";
  ctx.fillStyle = css;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;

  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
