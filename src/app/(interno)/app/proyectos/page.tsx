import Link from "next/link";
import { Button } from "@/components/ui/button";
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
import { listarProyectos, type EstadoProyecto } from "@/modules/proyectos/api";

const ORDEN_ESTADOS: { estado: EstadoProyecto; etiqueta: string }[] = [
  { estado: "propuesto", etiqueta: "Propuesto" },
  { estado: "activo", etiqueta: "Activo" },
  { estado: "pausado", etiqueta: "Pausado" },
  { estado: "terminado", etiqueta: "Terminado" },
  { estado: "cancelado", etiqueta: "Cancelado" },
];

export default async function PaginaProyectos() {
  const [proyectos, clientes] = await Promise.all([
    listarProyectos(),
    listarClientes(),
  ]);
  const nombreDeCliente = new Map(clientes.map((c) => [c.id, c.nombre]));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Proyectos</h1>
        <Button
          render={<Link href="/app/proyectos/nuevo">Nuevo proyecto</Link>}
        />
      </div>

      <div className="mt-6 flex flex-col gap-8">
        {ORDEN_ESTADOS.map(({ estado, etiqueta }) => {
          const delEstado = proyectos.filter((p) => p.estado === estado);
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
                      <TableHead>Proyecto</TableHead>
                      <TableHead>Cliente</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {delEstado.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Link
                            href={`/app/proyectos/${p.id}`}
                            className="hover:underline"
                          >
                            {p.nombre}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {nombreDeCliente.get(p.clienteId) ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          );
        })}
        {proyectos.length === 0 && (
          <EstadoVacio
            titulo="Todavía no hay proyectos cargados."
            accion={
              <Button
                size="sm"
                render={<Link href="/app/proyectos/nuevo">Nuevo proyecto</Link>}
              />
            }
          />
        )}
      </div>
    </main>
  );
}
