import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// El fondo por defecto de toda página que no es el hero. Reemplaza al
// cónico giratorio del viejo campo-arena.tsx (plan de fixes §1.3/§1.4):
// se leía siempre como una hélice de ventilador, en modo claro ni se
// veía, y seguía gastando GPU.
//
// La base es una banda quieta — sin animación ni JS: un degradé lineal
// vertical (--background → tinte → --background) más dos resplandores
// radiales suaves en las esquinas, del mismo color de tinte. Los radiales
// se agregaron en el PR 2 para que una sección sin capa WebGL no se lea
// vacía al lado de las que sí tienen (feedback de Kevin). La capa de grano
// global (<CapaGrano> en el layout raíz) le da textura.
//
// PR 2: acepta un fondo animado opcional (`children`, p. ej. un componente
// de React Bits) que se monta encima. La banda quieta queda de fallback y
// como fondo real bajo `prefers-reduced-motion`, donde la capa animada se
// oculta.
const TINTES = {
  turquesa: "var(--tinte-turquesa)",
  ambar: "var(--tinte-ambar)",
  neutro: "var(--tinte-neutro)",
} as const;

export type TinteFondoSeccion = keyof typeof TINTES;

export function FondoSeccion({
  tinte = "neutro",
  className,
  children,
}: {
  tinte?: TinteFondoSeccion;
  className?: string;
  children?: ReactNode;
}) {
  const color = TINTES[tinte];
  return (
    <div
      aria-hidden
      className={cn("absolute inset-0 -z-10 overflow-hidden", className)}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            `radial-gradient(75% 55% at 10% -15%, color-mix(in oklch, ${color}, transparent 25%), transparent 68%)`,
            `radial-gradient(65% 50% at 95% 115%, color-mix(in oklch, ${color}, transparent 45%), transparent 64%)`,
            `linear-gradient(180deg, var(--background) 0%, ${color} 50%, var(--background) 100%)`,
          ].join(", "),
        }}
      />
      {children ? (
        <div className="absolute inset-0 motion-reduce:hidden">{children}</div>
      ) : null}
    </div>
  );
}
