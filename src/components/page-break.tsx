import { cn } from "@/lib/utils";

const TONOS = {
  turquesa: {
    solido: "bg-turquesa-700 text-crema-100",
    vidrio:
      "text-crema-100 [background:linear-gradient(180deg,transparent,color-mix(in_oklch,var(--turquesa-700),transparent_78%)_50%,transparent)]",
    borde: "border-turquesa-400/25",
  },
  ambar: {
    solido: "bg-ambar-500 text-tinta-900",
    vidrio:
      "text-crema-100 [background:linear-gradient(180deg,transparent,color-mix(in_oklch,var(--ambar-500),transparent_80%)_50%,transparent)]",
    borde: "border-ambar-300/25",
  },
  coral: {
    solido: "bg-coral-700 text-crema-100",
    vidrio:
      "text-crema-100 [background:linear-gradient(180deg,transparent,color-mix(in_oklch,var(--coral-700),transparent_78%)_50%,transparent)]",
    borde: "border-coral-300/25",
  },
} as const;

// Corte fuerte de la página (§5.3): como mucho dos por página, tipografía y
// alto fijos — por eso es un componente que lo impone, no una clase suelta.
//
// `variante`:
//  - "solido" (default): franja de color contundente. Se vuelve al fondo
//    anterior después.
//  - "vidrio": panel translúcido con desenfoque — deja pasar el fondo de
//    atrás (el prisma del hero) en vez de taparlo con un bloque de color.
//    Para cuando el break tiene que sentirse como una transición y no como
//    una pared (pedido de Kevin, PR 2 de la ronda de fixes).
export function PageBreak({
  children,
  tono = "turquesa",
  variante = "solido",
}: {
  children: React.ReactNode;
  tono?: keyof typeof TONOS;
  variante?: "solido" | "vidrio";
}) {
  const t = TONOS[tono];
  return (
    <div
      className={cn(
        "flex items-center justify-center px-6 text-center",
        variante === "vidrio"
          ? cn(
              "relative z-10 h-[32vh] border-y backdrop-blur-xl",
              t.vidrio,
              t.borde,
            )
          : cn("h-[40vh]", t.solido),
      )}
    >
      <p
        className={cn(
          "text-display font-heading font-bold tracking-[-0.02em] text-balance",
          variante === "vidrio" && "drop-shadow-md",
        )}
      >
        {children}
      </p>
    </div>
  );
}
