import { ArrowDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// La portada de /  — §8.1 punto 1. El <h1> y la bajada son HTML del
// servidor: no dependen de que el fondo WebGL exista ni cargue, así que
// nunca participan del LCP del fondo.
//
// El fondo (Prism) ya no vive acá: lo monta page.tsx para que el hero y la
// sección "Qué hacemos" lo compartan sin un corte brusco entre ambas (PR 2
// de la ronda de fixes, pedido de Kevin).
export function EspejismoHero() {
  return (
    <section className="relative flex min-h-[calc(100vh-5rem)] items-center">
      {/* Scrim solo detrás del copy: el prisma en modo claro es pálido y el
          título crema-100 se perdía contra él (pedido de Kevin). Un óvalo
          oscuro muy tenue (noche-900, fijo en los dos temas), apenas lo
          justo para despegar el texto del fondo sin tapar el resto del
          hero. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-0 w-full max-w-3xl"
        style={{
          background:
            "radial-gradient(65% 60% at 30% 50%, color-mix(in oklch, var(--noche-900), transparent 58%), transparent 78%)",
        }}
      />
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-start gap-6 px-6 py-32">
        <h1 className="text-hero font-heading font-extrabold tracking-[-0.03em] text-crema-100 [text-shadow:0_2px_16px_color-mix(in_oklch,var(--noche-900),transparent_35%)]">
          Mirage
        </h1>
        <p className="max-w-xl text-lead text-crema-100/95 [text-shadow:0_1px_10px_color-mix(in_oklch,var(--noche-900),transparent_40%)]">
          Desarrollamos software a medida: sistemas específicos para las
          necesidades de cada cliente, no productos estándar.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            render={<Link href="/servicios">Ver servicios</Link>}
            size="lg"
          />
          <Button
            render={<Link href="/contacto">Contactanos</Link>}
            variant="secondary"
            size="lg"
          />
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-crema-100/80">
        <ArrowDown className="size-6 animate-bounce motion-reduce:animate-none" />
      </div>
    </section>
  );
}
