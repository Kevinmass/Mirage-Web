import { cn } from "@/lib/utils";

// El fondo por defecto de toda página que no es el hero. Reemplaza al
// cónico giratorio del viejo campo-arena.tsx (plan de fixes §1.3/§1.4):
// se leía siempre como una hélice de ventilador, en modo claro ni se
// veía, y seguía gastando GPU. Esto es una banda quieta — un degradé lineal
// vertical de --background al tinte de la sección y de vuelta a
// --background — sin animación ni JS. La capa de grano global
// (<CapaGrano> en el layout raíz) le da la textura de material.
const TINTES = {
  turquesa: "var(--tinte-turquesa)",
  ambar: "var(--tinte-ambar)",
  neutro: "var(--tinte-neutro)",
} as const;

export type TinteFondoSeccion = keyof typeof TINTES;

export function FondoSeccion({
  tinte = "neutro",
  className,
}: {
  tinte?: TinteFondoSeccion;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("absolute inset-0 -z-10", className)}
      style={{
        backgroundImage: `linear-gradient(180deg, var(--background) 0%, ${TINTES[tinte]} 50%, var(--background) 100%)`,
      }}
    />
  );
}
