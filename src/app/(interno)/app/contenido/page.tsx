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
import { obtenerSesionActual } from "@/kernel/identidad/sesion";
import { tienePermiso } from "@/kernel/permisos/evaluar";
import { listarServicios } from "@/modules/contenido/api";

export default async function PaginaContenido() {
  const [servicios, sesion] = await Promise.all([
    listarServicios(),
    obtenerSesionActual(),
  ]);
  const puedeEditar =
    !!sesion && (await tienePermiso(sesion.personaId, "contenido.editar"));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Contenido</h1>
          <p className="text-sm text-muted-foreground">
            Servicios que se muestran en /servicios.
          </p>
        </div>
        {puedeEditar && (
          <Button render={<Link href="/app/contenido/nuevo">Nuevo servicio</Link>} />
        )}
      </div>

      {!puedeEditar && (
        <p className="mt-4 text-sm text-muted-foreground">
          Podés ver el contenido, pero no tenés el permiso{" "}
          <code className="font-mono text-xs">contenido.editar</code> para
          crear o modificar servicios.
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-lg border border-border">
        {servicios.length === 0 ? (
          <EstadoVacio
            titulo="Todavía no hay servicios cargados."
            accion={
              puedeEditar ? (
                <Button
                  size="sm"
                  render={<Link href="/app/contenido/nuevo">Nuevo servicio</Link>}
                />
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Orden</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicios.map((servicio) => (
                <TableRow key={servicio.id}>
                  <TableCell>
                    {puedeEditar ? (
                      <Link
                        href={`/app/contenido/${servicio.id}`}
                        className="hover:underline"
                      >
                        {servicio.nombre}
                      </Link>
                    ) : (
                      servicio.nombre
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={servicio.activo ? "primary" : "outline"}>
                      {servicio.activo ? "Publicado" : "Sin publicar"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {servicio.orden}
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
