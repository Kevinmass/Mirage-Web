import { cn } from "@/lib/utils";

// Fondo continuo para todo el tramo de la landing que va después del
// <PageBreak> "Un sistema propio…" (PR 2 de la ronda de fixes, pedido de
// Kevin: "un flujo casi ininterrumpido de los fondos", sin que cada
// sección quede recuadrada).
//
// Es UNA sola capa que abarca las cuatro secciones (Cómo trabajamos /
// Servicios / Casos / cierre): un degradé vertical largo que fluye del
// tinte turquesa al neutro y al ámbar sin volver a --background en el
// medio, más dos resplandores de esquina. Empieza y termina en
// --background para que el <PageBreak> de arriba y el footer de abajo
// tengan un corte limpio. Las auroras animadas van aparte, montadas para
// sangrar entre secciones.
export function FondoContinuo({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("absolute inset-0 -z-10 overflow-hidden", className)}
    >
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(65% 35% at 8% 6%, color-mix(in oklch, var(--tinte-turquesa), transparent 15%), transparent 62%)",
            "radial-gradient(65% 35% at 94% 96%, color-mix(in oklch, var(--tinte-ambar), transparent 25%), transparent 62%)",
            "linear-gradient(180deg, var(--background) 0%, var(--tinte-turquesa) 22%, var(--tinte-neutro) 50%, var(--tinte-ambar) 76%, var(--background) 100%)",
          ].join(", "),
        }}
      />
    </div>
  );
}
