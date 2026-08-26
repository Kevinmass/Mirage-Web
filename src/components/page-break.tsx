import { cn } from "@/lib/utils";

const TONOS = {
  turquesa: "bg-turquesa-700 text-crema-100",
  ambar: "bg-ambar-500 text-tinta-900",
  coral: "bg-coral-700 text-crema-100",
} as const;

// Franja de color contundente que corta la página (§5.3). La regla es
// dura: después de un break fuerte se vuelve al fondo que había antes, y
// como mucho dos por página — por eso es un componente que la impone
// (siempre 40vh, siempre esta tipografía) y no una clase suelta que haya
// que recordar reproducir igual cada vez.
export function PageBreak({
  children,
  tono = "turquesa",
}: {
  children: React.ReactNode;
  tono?: keyof typeof TONOS;
}) {
  return (
    <div
      className={cn(
        "flex h-[40vh] items-center justify-center px-6 text-center",
        TONOS[tono],
      )}
    >
      <p className="text-display font-heading font-bold tracking-[-0.02em] text-balance">
        {children}
      </p>
    </div>
  );
}
