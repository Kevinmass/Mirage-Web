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
import { listarPersonas } from "@/kernel/identidad/personas";

export default async function PaginaPersonas() {
  const filas = await listarPersonas();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Personas</h1>
        <Button
          render={<Link href="/app/personas/nueva">Nueva persona</Link>}
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-border">
        {filas.length === 0 ? (
          <EstadoVacio
            titulo="Todavía no hay personas cargadas."
            accion={
              <Button
                size="sm"
                render={<Link href="/app/personas/nueva">Nueva persona</Link>}
              />
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                <TableHead className="hidden sm:table-cell">Acceso</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="max-w-32 truncate">
                    <Link
                      href={`/app/personas/${p.id}`}
                      className="hover:underline"
                    >
                      {p.nombre} {p.apellido}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-32 truncate text-muted-foreground">
                    {p.email}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {p.tipo}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {p.usuarioId ? "Sí" : "No"}
                  </TableCell>
                  <TableCell>{p.activo ? "Activa" : "Archivada"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </main>
  );
}
