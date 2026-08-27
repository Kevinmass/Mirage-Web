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
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-start gap-6 px-6 py-32">
        <h1 className="text-hero font-heading font-extrabold tracking-[-0.03em] text-crema-100 drop-shadow-sm">
          Mirage
        </h1>
        <p className="max-w-xl text-lead text-crema-100/90 drop-shadow-sm">
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
