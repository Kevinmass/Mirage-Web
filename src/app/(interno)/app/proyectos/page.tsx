import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { obtenerSesionActual } from "@/kernel/identidad/sesion";
import { listarClientes } from "@/modules/clientes/api";
import { listarProyectosConDetalle } from "@/modules/proyectos/api";
import { ProyectosGrid, type FilaProyecto } from "./proyectos-grid";

export default async function PaginaProyectos() {
  const [proyectos, clientes, sesion] = await Promise.all([
    listarProyectosConDetalle(),
    listarClientes(),
    obtenerSesionActual(),
  ]);
  const nombreDeCliente = new Map(clientes.map((c) => [c.id, c.nombre]));

  const filas: FilaProyecto[] = proyectos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion,
    estado: p.estado,
    color: p.color,
    imagenUrl: p.imagenUrl,
    cupo: p.cupo,
    inscriptos: p.inscriptos,
    inscriptoPropio: sesion
      ? p.inscriptos.some((i) => i.personaId === sesion.personaId)
      : false,
    clienteId: p.clienteId,
    clienteNombre:
      p.clienteId !== null ? (nombreDeCliente.get(p.clienteId) ?? null) : null,
  }));

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Proyectos</h1>
        <Button
          render={<Link href="/app/proyectos/nuevo">Nuevo proyecto</Link>}
        />
      </div>

      <div className="mt-6">
        {filas.length === 0 ? (
          <EstadoVacio
            titulo="Todavía no hay proyectos cargados."
            accion={
              <Button
                size="sm"
                render={<Link href="/app/proyectos/nuevo">Nuevo proyecto</Link>}
              />
            }
          />
        ) : (
          <ProyectosGrid
            filas={filas}
            clientes={clientes}
            haySesion={sesion !== null}
          />
        )}
      </div>
    </main>
  );
}
