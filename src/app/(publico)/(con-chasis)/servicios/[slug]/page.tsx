import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ContenidoMarkdown } from "@/components/contenido-markdown";
import { Button } from "@/components/ui/button";
import {
  listarServiciosActivos,
  obtenerServicioPorSlug,
} from "@/modules/contenido/api";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const servicio = await obtenerServicioPorSlug(slug).catch(() => undefined);
  return { title: servicio?.nombre ?? "Servicio" };
}

export async function generateStaticParams() {
  const servicios = await listarServiciosActivos().catch(() => []);
  return servicios.map((servicio) => ({ slug: servicio.slug }));
}

// §8.2: imagen o campo de color, cuerpo en Markdown, y un CTA de
// contacto con el asunto precargado. "Tecnologías como chips" y "caso
// relacionado" quedan afuera de este PR — la migración de §1.3 no
// agrega ni una columna de tecnologías ni un vínculo servicio↔caso, y
// inventar uno acá sería un campo nuevo no pedido por el plan.
export default async function PaginaServicio({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const servicio = await obtenerServicioPorSlug(slug).catch(() => undefined);
  if (!servicio) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
      {servicio.imagenUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL de contenido cargada por el ABM, no un asset del build
        <img
          src={servicio.imagenUrl}
          alt=""
          className="mb-8 h-48 w-full rounded-2xl object-cover"
        />
      ) : (
        <div
          className="mb-8 h-24 w-full rounded-2xl"
          style={{ backgroundColor: servicio.color ?? "var(--muted)" }}
          aria-hidden
        />
      )}

      <h1 className="text-display font-heading font-bold tracking-[-0.025em]">
        {servicio.nombre}
      </h1>

      <div className="mt-6">
        {servicio.cuerpo ? (
          <ContenidoMarkdown>{servicio.cuerpo}</ContenidoMarkdown>
        ) : (
          <p className="max-w-[68ch] text-body text-muted-foreground">
            {servicio.descripcion}
          </p>
        )}
      </div>

      <div className="mt-10">
        <Button
          render={
            <Link
              href={`/contacto?asunto=${encodeURIComponent(servicio.nombre)}`}
            >
              Consultar por {servicio.nombre}
            </Link>
          }
        />
      </div>
    </main>
  );
}
