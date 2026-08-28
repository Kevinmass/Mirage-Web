import { notFound } from "next/navigation";
import { ComparadorHero } from "./comparador-hero";

// Comparación en vivo de los fondos candidatos para el hero (PR 2 de la
// ronda de fixes, paso 2). Bloqueada en producción igual que /dev/ui.
export default function PaginaDevHero() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <ComparadorHero />;
}
