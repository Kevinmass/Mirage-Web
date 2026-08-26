import { cn } from "@/lib/utils";

// El fondo por defecto de toda página que no es el hero (§5.3 del
// sistema visual). Gradiente cónico animado por CSS puro — cero JS — que
// gira despacio (--dur-ambiente, nunca menos de 8s) y se detiene con
// prefers-reduced-motion. La prop `tinte` da variedad de sección sin
// cambiar de técnica; los stops usan color-mix sobre --background para
// que el mismo componente sirva en claro y oscuro sin condicionales.
const GRADIENTES = {
  arena: "var(--background), var(--muted), var(--background)",
  "arena-turquesa":
    "var(--background), color-mix(in oklch, var(--turquesa-500) 12%, var(--background)), var(--muted), var(--background)",
  "arena-ambar":
    "var(--background), color-mix(in oklch, var(--ambar-500) 12%, var(--background)), var(--muted), var(--background)",
} as const;

export type TinteCampoArena = keyof typeof GRADIENTES;

export function CampoArena({
  tinte = "arena",
  className,
}: {
  tinte?: TinteCampoArena;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "absolute inset-0 -z-10 animate-[campo-arena-girar_var(--dur-ambiente)_linear_infinite] motion-reduce:animate-none",
        className,
      )}
      style={{
        backgroundImage: `conic-gradient(from var(--campo-angulo) at 50% 50%, ${GRADIENTES[tinte]})`,
      }}
    />
  );
}
