import type { Metadata } from "next";
import { ContenidoMarkdown } from "@/components/contenido-markdown";
import { obtenerPaginaPorSlug } from "@/modules/contenido/api";

export const revalidate = 3600;
export const metadata: Metadata = { title: "Contacto" };

export default async function PaginaContacto() {
  const pagina = await obtenerPaginaPorSlug("contacto").catch(() => undefined);

  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-16">
      {pagina ? (
        <ContenidoMarkdown>{pagina.cuerpo}</ContenidoMarkdown>
      ) : (
        <h1 className="text-3xl font-bold tracking-tight">Contacto</h1>
      )}
    </main>
  );
}
