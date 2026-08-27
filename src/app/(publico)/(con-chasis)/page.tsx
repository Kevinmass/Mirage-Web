import { EspejismoHero } from "@/components/espejismo-hero/espejismo-hero";
import { FondoHero } from "@/components/espejismo-hero/fondo-hero";
import { FondoContinuo } from "@/components/fondo-continuo";
import { FondoSeccionAurora } from "@/components/fondo-seccion-aurora";
import { PageBreak } from "@/components/page-break";
import { Revelado } from "@/components/revelado";
import { Capacidades } from "./_inicio/capacidades";
import { CierreIndice } from "./_inicio/cierre-indice";
import { ComoTrabajamos } from "./_inicio/como-trabajamos";
import { PruebaSocial } from "./_inicio/prueba-social";
import { ServiciosDestacados } from "./_inicio/servicios-destacados";

export const revalidate = 3600;

// La portada — §8.1 del sistema visual, ocho bandas. Reemplaza a la
// página genérica servida desde contenido_pagina("inicio"): esa era la
// placeholder de antes del rediseño, no algo que este PR conserve.
export default function PaginaInicio() {
  return (
    <main>
      {/* El hero y "Qué hacemos" comparten el fondo Prism, sin corte entre
          ambos: el scrim de "Qué hacemos" funde el prisma a --background
          hacia abajo, así el primer break real de la página es el
          <PageBreak>. */}
      <div className="relative isolate overflow-hidden">
        <FondoHero />

        <EspejismoHero />

        <section className="relative z-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, var(--background) 88%)",
            }}
          />
          <div className="relative mx-auto max-w-4xl px-6 py-16 sm:py-24">
            <Revelado>
              <h2 className="mb-10 text-center text-h2 font-heading font-semibold tracking-[-0.02em] drop-shadow-sm">
                Qué hacemos
              </h2>
            </Revelado>
            <Capacidades />
          </div>
        </section>
      </div>

      <PageBreak tono="turquesa">
        Un sistema propio, no una plantilla más.
      </PageBreak>

      {/* Todo lo que sigue al PageBreak comparte un solo fondo continuo, sin
          recuadros por sección (pedido de Kevin: "un flujo casi
          ininterrumpido de los fondos"). Las dos auroras van posicionadas
          para solaparse en el medio y no dejar costura. */}
      <div className="relative isolate overflow-hidden">
        <FondoContinuo />
        <FondoSeccionAurora
          tono="turquesa"
          className="absolute inset-x-0 top-0 h-[62%]"
        />
        <FondoSeccionAurora
          tono="ambar"
          className="absolute inset-x-0 bottom-0 h-[62%]"
        />

        <section className="relative z-10">
          <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
            <Revelado>
              <h2 className="mb-12 text-center text-h2 font-heading font-semibold tracking-[-0.02em] drop-shadow-sm">
                Cómo trabajamos
              </h2>
            </Revelado>
            <ComoTrabajamos />
          </div>
        </section>

        <section className="relative z-10">
          <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
            <Revelado>
              <h2 className="mb-10 text-center text-h2 font-heading font-semibold tracking-[-0.02em] drop-shadow-sm">
                Servicios destacados
              </h2>
            </Revelado>
            <ServiciosDestacados />
          </div>
        </section>

        <section className="relative z-10">
          <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
            <Revelado>
              <h2 className="mb-10 text-center text-h2 font-heading font-semibold tracking-[-0.02em] drop-shadow-sm">
                Casos
              </h2>
            </Revelado>
            <PruebaSocial />
          </div>
        </section>

        <section className="relative z-10">
          <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
            <CierreIndice />
          </div>
        </section>
      </div>
    </main>
  );
}
