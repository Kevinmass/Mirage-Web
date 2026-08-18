import Markdown from "react-markdown";
import { obtenerPaginaPorSlug } from "@/modules/contenido/api";

export const revalidate = 3600;

export default async function PaginaInicio() {
  // Tolera que la base no esté disponible en build (las migraciones
  // corren recién al arrancar el contenedor, no en el build de Docker —
  // ver PR 0.4): el build no debe romperse por eso, la página se
  // regenera sola en el primer request después del deploy (ISR).
  const pagina = await obtenerPaginaPorSlug("inicio").catch(() => undefined);

  return (
    <main className="flex-1 mx-auto max-w-2xl px-6 py-16">
      {pagina ? <Markdown>{pagina.cuerpo}</Markdown> : <h1>Mirage</h1>}
    </main>
  );
}
