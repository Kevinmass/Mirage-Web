import Link from "next/link";
import { Inbox } from "lucide-react";
import { TableroVacio } from "@/components/ui/tablero-vacio";
import { listarClientes } from "@/modules/clientes/api";
import { listarSolicitudes } from "@/modules/solicitudes/api";

// "Que me esperan" hoy es "recibidas, sin evaluar todavía" para
// cualquier empleado — la bandeja interna no filtra por proyecto
// todavía (§1.2 del plan de frontend: eso es el PR 12, depende de las
// inscripciones del PR 10). Cuando ese filtro exista, esto pasa a
// filtrar por los proyectos de la persona sin tocar el resto del
// bloque.
export async function SolicitudesQueMeEsperan() {
  const [solicitudes, clientes] = await Promise.all([
    listarSolicitudes({ estado: "recibida" }).catch(() => []),
    listarClientes().catch(() => []),
  ]);
  const nombreDeCliente = new Map(clientes.map((c) => [c.id, c.nombre]));
  const primeras = solicitudes.slice(0, 6);

  if (primeras.length === 0) {
    return <TableroVacio icono={Inbox} texto="No hay solicitudes esperando." />;
  }

  return (
    <ul className="flex flex-col gap-1">
      {primeras.map((solicitud) => (
        <li key={solicitud.id}>
          <Link
            href={`/app/solicitudes/${solicitud.id}`}
            className="flex items-center justify-between gap-2 rounded-md px-2 py-2 text-sm hover:bg-secondary"
          >
            <span className="truncate">{solicitud.titulo}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {nombreDeCliente.get(solicitud.clienteId) ?? "cliente"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
