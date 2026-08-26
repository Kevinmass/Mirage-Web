import Link from "next/link";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listarClientes } from "@/modules/clientes/api";
import {
  listarSolicitudes,
  type EstadoSolicitud,
} from "@/modules/solicitudes/api";

const ORDEN_ESTADOS: { estado: EstadoSolicitud; etiqueta: string }[] = [
  { estado: "recibida", etiqueta: "Recibida" },
  { estado: "en_evaluacion", etiqueta: "En evaluación" },
  { estado: "aceptada", etiqueta: "Aceptada" },
  { estado: "rechazada", etiqueta: "Rechazada" },
];

export default async function PaginaSolicitudes() {
  const [solicitudes, clientes] = await Promise.all([
    listarSolicitudes(),
    listarClientes(),
  ]);
  const nombreDeCliente = new Map(clientes.map((c) => [c.id, c.nombre]));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Solicitudes</h1>
      <p className="text-sm text-muted-foreground">
        Bandeja por estado — lo que llega desde el portal de clientes.
      </p>

      <div className="mt-6 flex flex-col gap-8">
        {ORDEN_ESTADOS.map(({ estado, etiqueta }) => {
          const delEstado = solicitudes.filter((s) => s.estado === estado);
          if (delEstado.length === 0) return null;
          return (
            <section key={estado}>
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">
                {etiqueta} ({delEstado.length})
              </h2>
              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Solicitud</TableHead>
                      <TableHead>Cliente</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {delEstado.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <Link
                            href={`/app/solicitudes/${s.id}`}
                            className="hover:underline"
                          >
                            {s.titulo}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {nombreDeCliente.get(s.clienteId) ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          );
        })}
        {solicitudes.length === 0 && (
          <EstadoVacio titulo="Todavía no llegó ninguna solicitud." />
        )}
      </div>
    </main>
  );
}
