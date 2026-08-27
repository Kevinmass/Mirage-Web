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
import { listarCasos, listarServicios } from "@/modules/contenido/api";

export default async function PaginaContenido() {
  const [servicios, casos, sesion] = await Promise.all([
    listarServicios(),
    listarCasos(),
    obtenerSesionActual(),
  ]);
  const puedeEditar =
    !!sesion && (await tienePermiso(sesion.personaId, "contenido.editar"));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-h3 font-heading font-semibold">Contenido</h1>
      <p className="text-sm text-muted-foreground">
        Servicios y casos que se muestran en /servicios y /casos.
      </p>

      {!puedeEditar && (
        <p className="mt-4 text-sm text-muted-foreground">
          Podés ver el contenido, pero no tenés el permiso{" "}
          <code className="font-mono text-xs">contenido.editar</code> para crear
          o modificar nada acá.
        </p>
      )}

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading font-semibold">Servicios</h2>
          {puedeEditar && (
            <Button
              size="sm"
              render={<Link href="/app/contenido/nuevo">Nuevo servicio</Link>}
            />
          )}
        </div>

        <div className="mt-3 overflow-hidden rounded-lg border border-border">
          {servicios.length === 0 ? (
            <EstadoVacio
              titulo="Todavía no hay servicios cargados."
              accion={
                puedeEditar ? (
                  <Button
                    size="sm"
                    render={
                      <Link href="/app/contenido/nuevo">Nuevo servicio</Link>
                    }
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
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading font-semibold">Casos</h2>
          {puedeEditar && (
            <Button
              size="sm"
              render={<Link href="/app/contenido/casos/nuevo">Nuevo caso</Link>}
            />
          )}
        </div>

        <div className="mt-3 overflow-hidden rounded-lg border border-border">
          {casos.length === 0 ? (
            <EstadoVacio
              titulo="Todavía no hay casos cargados."
              accion={
                puedeEditar ? (
                  <Button
                    size="sm"
                    render={
                      <Link href="/app/contenido/casos/nuevo">Nuevo caso</Link>
                    }
                  />
                ) : undefined
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Testimonio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {casos.map((caso) => (
                  <TableRow key={caso.id}>
                    <TableCell>
                      {puedeEditar ? (
                        <Link
                          href={`/app/contenido/casos/${caso.id}`}
                          className="hover:underline"
                        >
                          {caso.titulo}
                        </Link>
                      ) : (
                        caso.titulo
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={caso.publicado ? "primary" : "outline"}>
                        {caso.publicado ? "Publicado" : "Sin publicar"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {caso.testimonio ? "Sí" : "Sin cargar"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </section>
    </main>
  );
}
