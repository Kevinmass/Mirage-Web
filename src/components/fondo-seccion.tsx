import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// El fondo por defecto de toda página que no es el hero. Reemplaza al
// cónico giratorio del viejo campo-arena.tsx (plan de fixes §1.3/§1.4):
// se leía siempre como una hélice de ventilador, en modo claro ni se
// veía, y seguía gastando GPU.
//
// La base es una banda quieta — un degradé lineal vertical de --background
// al tinte de la sección y de vuelta a --background — sin animación ni JS.
// La capa de grano global (<CapaGrano> en el layout raíz) le da textura.
//
// PR 2 de la ronda de fixes: acepta un fondo animado opcional (`children`,
// p. ej. un componente de React Bits) que se monta encima de la banda
// quieta. La banda queda de fallback y como fondo real bajo
// `prefers-reduced-motion`, donde la capa animada se oculta.
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
  return (
    <div
      aria-hidden
      className={cn("absolute inset-0 -z-10 overflow-hidden", className)}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(180deg, var(--background) 0%, ${TINTES[tinte]} 50%, var(--background) 100%)`,
        }}
      />
      {children ? (
        <div className="absolute inset-0 motion-reduce:hidden">{children}</div>
      ) : null}
    </div>
  );
}
