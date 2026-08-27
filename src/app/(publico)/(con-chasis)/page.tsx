import { EspejismoHero } from "@/components/espejismo-hero/espejismo-hero";
import { FondoSeccion } from "@/components/fondo-seccion";
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
      <EspejismoHero />

      <section className="relative">
        <FondoSeccion tinte="turquesa" />
        <div className="relative mx-auto max-w-4xl px-6 py-16 sm:py-24">
          <Revelado>
            <h2 className="mb-10 text-center text-h2 font-heading font-semibold tracking-[-0.02em]">
              Qué hacemos
            </h2>
          </Revelado>
          <Capacidades />
        </div>
      </section>

      <PageBreak tono="turquesa">
        Un sistema propio, no una plantilla más.
      </PageBreak>

      <section className="relative">
        <FondoSeccion tinte="turquesa" />
        <div className="relative mx-auto max-w-4xl px-6 py-16 sm:py-24">
          <Revelado>
            <h2 className="mb-12 text-center text-h2 font-heading font-semibold tracking-[-0.02em]">
              Cómo trabajamos
            </h2>
          </Revelado>
          <ComoTrabajamos />
        </div>
      </section>

      <section className="relative">
        <FondoSeccion tinte="neutro" />
        <div className="relative mx-auto max-w-5xl px-6 py-16 sm:py-24">
          <Revelado>
            <h2 className="mb-10 text-center text-h2 font-heading font-semibold tracking-[-0.02em]">
              Servicios destacados
            </h2>
          </Revelado>
          <ServiciosDestacados />
        </div>
      </section>

      <section className="relative">
        <FondoSeccion tinte="ambar" />
        <div className="relative mx-auto max-w-4xl px-6 py-16 sm:py-24">
          <Revelado>
            <h2 className="mb-10 text-center text-h2 font-heading font-semibold tracking-[-0.02em]">
              Casos
            </h2>
          </Revelado>
          <PruebaSocial />
        </div>
      </section>

      <section className="relative">
        <FondoSeccion tinte="neutro" />
        <div className="relative mx-auto max-w-3xl px-6 py-16 sm:py-24">
          <CierreIndice />
        </div>
      </section>
    </main>
  );
}
