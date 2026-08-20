import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NoEncontrado } from "@/kernel/errores";
import { listarPersonas } from "@/kernel/identidad/personas";
import { obtenerArbolCompleto, obtenerNodo } from "@/kernel/organigrama/arbol";
import { obtenerCliente } from "@/modules/clientes/api";
import {
  listarRepositoriosDeProyecto,
  listarTareasDeProyecto,
  obtenerProgresoDeProyecto,
  obtenerProyecto,
  type EstadoProyecto,
} from "@/modules/proyectos/api";
import {
  cambiarEstadoProyectoAction,
  sincronizarRepositorioAction,
} from "../actions";
import { FormularioAgregarRepositorio } from "../repositorios-formulario";
import { FilaTarea, FormularioCrearTarea } from "../tareas-formularios";

const ORDEN_ESTADOS: { value: EstadoProyecto; etiqueta: string }[] = [
  { value: "propuesto", etiqueta: "Propuesto" },
  { value: "activo", etiqueta: "Activo" },
  { value: "pausado", etiqueta: "Pausado" },
  { value: "terminado", etiqueta: "Terminado" },
  { value: "cancelado", etiqueta: "Cancelado" },
];

export default async function PaginaProyecto({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idNumerico = Number(id);
  if (!Number.isInteger(idNumerico)) {
    notFound();
  }

  const proyecto = await obtenerProyecto(idNumerico).catch((error) => {
    if (error instanceof NoEncontrado) {
      notFound();
    }
    throw error;
  });

  const [
    cliente,
    nodoResponsable,
    tareas,
    progreso,
    nodos,
    personas,
    repositorios,
  ] = await Promise.all([
    obtenerCliente(proyecto.clienteId),
    obtenerNodo(proyecto.nodoResponsableId),
    listarTareasDeProyecto(proyecto.id),
    obtenerProgresoDeProyecto(proyecto.id),
    obtenerArbolCompleto(),
    listarPersonas(),
    listarRepositoriosDeProyecto(proyecto.id),
  ]);
  const empleados = personas.filter((p) => p.tipo === "empleado" && p.activo);
  const porcentaje =
    progreso.totales === 0
      ? 0
      : Math.round((progreso.hechas / progreso.totales) * 100);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{proyecto.nombre}</h1>
        <form action={cambiarEstadoProyectoAction.bind(null, proyecto.id)}>
          <select
            name="estado"
            defaultValue={proyecto.estado}
            className="rounded-md border px-2 py-1 text-sm"
          >
            {ORDEN_ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.etiqueta}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" variant="secondary" className="ml-2">
            Guardar estado
          </Button>
        </form>
      </div>

      <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
        <p>Cliente: {cliente.nombre}</p>
        <p>Nodo responsable: {nodoResponsable.nombre}</p>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-medium">
          Progreso: {progreso.hechas} / {progreso.totales} tareas ({porcentaje}
          %)
        </h2>
        <div className="mt-1 h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Tareas</h2>
        <ul className="mt-2">
          {tareas.map((t) => (
            <FilaTarea
              key={t.id}
              proyectoId={proyecto.id}
              tarea={t}
              personas={empleados}
            />
          ))}
          {tareas.length === 0 && (
            <p className="py-2 text-sm text-muted-foreground">
              Todavía no hay tareas cargadas.
            </p>
          )}
        </ul>
        <div className="mt-4">
          <FormularioCrearTarea proyectoId={proyecto.id} nodos={nodos} />
        </div>
      </div>

      {/* Actividad, no progreso — diseño §6.3: nunca se mezcla con la
          barra de arriba, ni visual ni en el cálculo (eso lo hace
          obtenerProgresoDeProyecto, que ni sabe que esto existe). */}
      <div className="mt-10 border-t pt-6">
        <h2 className="text-lg font-semibold">Actividad (GitHub)</h2>
        <p className="text-xs text-muted-foreground">
          Se sincroniza sola cada 30 minutos. Nunca se usa para calcular
          progreso.
        </p>

        <ul className="mt-3 flex flex-col gap-3">
          {repositorios.map((r) => (
            <li key={r.id} className="rounded-md border p-3 text-sm">
              <p className="font-medium">
                {r.owner}/{r.repo}
              </p>
              {r.error ? (
                <p className="text-destructive">Error: {r.error}</p>
              ) : (
                <p className="text-muted-foreground">
                  {r.commitsTotal ?? "—"} commits · {r.prsAbiertas ?? "—"} PRs
                  abiertas · {r.prsCerradas ?? "—"} cerradas ·{" "}
                  {r.contribuyentes ?? "—"} contribuyentes
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Actualizado:{" "}
                {r.actualizadoEn
                  ? new Date(r.actualizadoEn).toLocaleString("es-AR")
                  : "todavía no"}
              </p>
              <form
                action={sincronizarRepositorioAction.bind(
                  null,
                  proyecto.id,
                  r.id,
                )}
                className="mt-1"
              >
                <Button type="submit" size="sm" variant="ghost">
                  Sincronizar ahora
                </Button>
              </form>
            </li>
          ))}
          {repositorios.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Todavía no hay repositorios agregados.
            </p>
          )}
        </ul>

        <div className="mt-4">
          <FormularioAgregarRepositorio proyectoId={proyecto.id} />
        </div>
      </div>
    </main>
  );
}
