import type { Metadata } from "next";
import Link from "next/link";
import { FondoContinuo } from "@/components/fondo-continuo";
import { FondoSeccionAurora } from "@/components/fondo-seccion-aurora";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { listarServiciosActivos } from "@/modules/contenido/api";

export const revalidate = 3600;
export const metadata: Metadata = { title: "Servicios" };

// Cards alargadas y apiladas, no lado a lado (§8.2 del sistema visual):
// cada card es sticky con un top creciente de 24px, así la siguiente se
// monta encima de la anterior dejando ver su borde superior. Puro CSS,
// sin JS. En móvil (`static` hasta `sm:`) colapsa a lista vertical.
export default async function PaginaServicios() {
  const servicios = await listarServiciosActivos().catch(() => []);

  return (
    <div className="relative isolate overflow-hidden">
      <FondoContinuo />
      <FondoSeccionAurora
        tono="turquesa"
        className="absolute inset-x-0 top-0 h-[60%]"
      />
      <main className="relative z-10 mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <h1 className="text-display font-heading font-bold tracking-[-0.025em]">
          Servicios
        </h1>

        {servicios.length === 0 ? (
          <EstadoVacio
            className="mt-8"
            titulo="Todavía no hay servicios publicados."
          />
        ) : (
          <div className="mt-10 flex flex-col gap-6 sm:mt-16 sm:gap-8">
            {servicios.map((servicio, indice) => (
              <Link
                key={servicio.id}
                href={`/servicios/${servicio.slug}`}
                style={{ top: `${indice * 24}px` }}
                className="static block min-h-56 rounded-2xl border border-border bg-card p-8 shadow-lg outline-none transition-[transform,box-shadow,border-color] duration-(--dur-rapida) ease-(--ease-suave) hover:-translate-y-0.5 hover:border-primary hover:shadow-xl focus-visible:-translate-y-0.5 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-turquesa-200 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:sticky"
              >
                <div
                  className="flex h-full flex-col justify-between gap-4"
                  style={
                    servicio.color
                      ? { borderTop: `4px solid ${servicio.color}` }
                      : undefined
                  }
                >
                  <div>
                    <h2 className="font-heading text-h2 font-semibold tracking-[-0.02em]">
                      {servicio.nombre}
                    </h2>
                    <p className="mt-3 max-w-2xl text-body text-muted-foreground">
                      {servicio.descripcion}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-primary">
                    Ver más →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
