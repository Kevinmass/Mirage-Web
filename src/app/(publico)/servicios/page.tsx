import { listarServiciosActivos } from "@/modules/contenido/api";

export const revalidate = 3600;

export default async function PaginaServicios() {
  const servicios = await listarServiciosActivos().catch(() => []);

  return (
    <main className="flex-1 mx-auto max-w-2xl px-6 py-16">
      <h1>Servicios</h1>
      {servicios.length === 0 ? (
        <p>Todavía no hay servicios publicados.</p>
      ) : (
        <ul>
          {servicios.map((servicio) => (
            <li key={servicio.id}>
              <h2>{servicio.nombre}</h2>
              <p>{servicio.descripcion}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
