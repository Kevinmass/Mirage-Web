import Markdown from "react-markdown";
import { obtenerPaginaPorSlug } from "@/modules/contenido/api";

export const revalidate = 3600;

export default async function PaginaContacto() {
  const pagina = await obtenerPaginaPorSlug("contacto").catch(() => undefined);

  return (
    <main className="flex-1 mx-auto max-w-2xl px-6 py-16">
      {pagina ? <Markdown>{pagina.cuerpo}</Markdown> : <h1>Contacto</h1>}
    </main>
  );
}
