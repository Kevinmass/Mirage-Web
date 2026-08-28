import Link from "next/link";
import { listarPersonas } from "@/kernel/identidad/personas";
import { obtenerSesionActual } from "@/kernel/identidad/sesion";
import { obtenerArbolCompleto } from "@/kernel/organigrama/arbol";
import { tienePermiso } from "@/kernel/permisos/evaluar";
import {
  listarHitosDeProyectos,
  listarProyectos,
  listarProyectosDePersona,
  listarTareas,
} from "@/modules/proyectos/api";
import { TareasBoard } from "./tareas-board";

export default async function PaginaTareas({
  searchParams,
}: {
  searchParams: Promise<{ proyectoId?: string; personaId?: string }>;
}) {
  const { proyectoId, personaId } = await searchParams;
  const [tareas, proyectos, nodos, personas, sesion] = await Promise.all([
    listarTareas({
      proyectoId: proyectoId ? Number(proyectoId) : undefined,
      personaAsignadaId: personaId ? Number(personaId) : undefined,
    }),
    listarProyectos(),
    obtenerArbolCompleto(),
    listarPersonas(),
    obtenerSesionActual(),
  ]);
  const empleados = personas.filter((p) => p.tipo === "empleado" && p.activo);
  const puedeEditar = sesion
    ? await tienePermiso(sesion.personaId, "proyectos.editar")
    : false;

  // El Gantt necesita, además de las tareas, las barras de los
  // proyectos donde el usuario está inscripto y los hitos de todo lo
  // que va a mostrar (esos proyectos + los proyectos de las tareas con
  // fecha) — diseño §8.11.
  const idsInscritos = sesion
    ? await listarProyectosDePersona(sesion.personaId)
    : [];
  const proyectoPorId = new Map(proyectos.map((p) => [p.id, p]));
  const proyectosInscritos = idsInscritos
    .map((id) => proyectoPorId.get(id))
    .filter((p) => p !== undefined);
  const idsConTareas = new Set(
    tareas
      .filter((t) => t.empiezaEn !== null || t.venceEn !== null)
      .map((t) => t.proyectoId),
  );
  const idsRelevantes = Array.from(new Set([...idsInscritos, ...idsConTareas]));
  const hitos = await listarHitosDeProyectos(idsRelevantes);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-h3 font-heading font-semibold">Tareas</h1>
        <Link href="/app/tareas/mias" className="text-sm hover:underline">
          Mis tareas
        </Link>
      </div>

      {!puedeEditar && (
        <p className="mt-2 text-sm text-muted-foreground">
          Podés ver el tablero, pero no tenés el permiso{" "}
          <code className="font-mono text-xs">proyectos.editar</code> para crear
          o mover tareas acá.
        </p>
      )}

      <form method="get" className="mt-4 flex flex-wrap gap-3 text-sm">
        <select
          name="proyectoId"
          defaultValue={proyectoId ?? ""}
          className="h-9 rounded-md border border-input bg-card px-2"
        >
          <option value="">Todos los proyectos</option>
          {proyectos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
        <select
          name="personaId"
          defaultValue={personaId ?? ""}
          className="h-9 rounded-md border border-input bg-card px-2"
        >
          <option value="">Todas las personas</option>
          {empleados.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} {p.apellido}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md border border-input px-3 py-1"
        >
          Filtrar
        </button>
        {(proyectoId ?? personaId) && (
          <Link href="/app/tareas" className="self-center hover:underline">
            Limpiar filtros
          </Link>
        )}
      </form>

      <div className="mt-6">
        <TareasBoard
          key={`${proyectoId ?? ""}-${personaId ?? ""}`}
          tareasIniciales={tareas}
          proyectos={proyectos.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            color: p.color,
          }))}
          nodos={nodos.map((n) => ({ id: n.id, nombre: n.nombre }))}
          proyectosInscritos={proyectosInscritos.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            color: p.color,
            fechaInicio: p.fechaInicio,
            fechaFinEstimada: p.fechaFinEstimada,
          }))}
          hitosIniciales={hitos}
          puedeEditar={puedeEditar}
        />
      </div>
    </main>
  );
}
