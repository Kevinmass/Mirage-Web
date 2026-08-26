import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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

export default async function PaginaClientes() {
  const filas = await listarClientes();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <Button
          render={<Link href="/app/clientes/nuevo">Nuevo cliente</Link>}
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-border">
        {filas.length === 0 ? (
          <EstadoVacio
            titulo="Todavía no hay clientes cargados."
            accion={
              <Button
                size="sm"
                render={<Link href="/app/clientes/nuevo">Nuevo cliente</Link>}
              />
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>CUIT</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link
                      href={`/app/clientes/${c.id}`}
                      className="hover:underline"
                    >
                      {c.nombre}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">
                    {c.cuit}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={c.estado === "activo" ? "primary" : "outline"}
                    >
                      {c.estado === "activo" ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </main>
  );
}
