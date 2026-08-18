import { ContenidoMarkdown } from "@/components/contenido-markdown";
import { obtenerPaginaPorSlug } from "@/modules/contenido/api";

export const revalidate = 3600;

export default async function PaginaInicio() {
  // Tolera que la base no esté disponible en build (las migraciones
  // corren recién al arrancar el contenedor, no en el build de Docker —
  // ver PR 0.4): el build no debe romperse por eso, la página se
  // regenera sola en el primer request después del deploy (ISR).
  const pagina = await obtenerPaginaPorSlug("inicio").catch(() => undefined);

  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-16">
      {pagina ? (
        <ContenidoMarkdown>{pagina.cuerpo}</ContenidoMarkdown>
      ) : (
        <h1 className="text-3xl font-bold tracking-tight">Mirage</h1>
      )}
    </main>
  );
}
