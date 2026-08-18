import { listarCasosPublicados } from "@/modules/contenido/api";

export const revalidate = 3600;

export default async function PaginaCasos() {
  const casos = await listarCasosPublicados().catch(() => []);

  return (
    <main className="flex-1 mx-auto max-w-2xl px-6 py-16">
      <h1>Casos</h1>
      {casos.length === 0 ? (
        <p>Todavía no hay casos publicados.</p>
      ) : (
        <ul>
          {casos.map((caso) => (
            <li key={caso.id}>
              <h2>{caso.titulo}</h2>
              <p>{caso.resumen}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
