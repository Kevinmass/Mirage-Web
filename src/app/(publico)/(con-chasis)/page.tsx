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
      {/* El hero, "Qué hacemos" y el break comparten el fondo Prism. El
          break es un panel de vidrio: deja pasar el prisma desenfocado en
          vez de cortar con un bloque de color. Un fade en el borde inferior
          lleva el prisma a --background para empalmar con el fondo continuo
          de abajo sin costura. */}
      <div className="relative isolate overflow-hidden">
        <FondoHero />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[45vh]"
          style={{
            background:
              "linear-gradient(180deg, transparent, var(--background))",
          }}
        />

        <EspejismoHero />

        <section className="relative z-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, color-mix(in oklch, var(--background), transparent 42%) 65%, transparent 100%)",
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

        <PageBreak tono="turquesa" variante="vidrio">
          Un sistema propio, no una plantilla más.
        </PageBreak>
      </div>

      {/* Todo lo que sigue al break comparte un solo fondo continuo, sin
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
