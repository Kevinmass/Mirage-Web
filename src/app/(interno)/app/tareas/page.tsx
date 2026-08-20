import Link from "next/link";
import { listarPersonas } from "@/kernel/identidad/personas";
import { obtenerArbolCompleto } from "@/kernel/organigrama/arbol";
import { listarTareas, type EstadoTarea } from "@/modules/proyectos/api";

const COLUMNAS: { estado: EstadoTarea; etiqueta: string }[] = [
  { estado: "pendiente", etiqueta: "Pendiente" },
  { estado: "en_curso", etiqueta: "En curso" },
  { estado: "bloqueada", etiqueta: "Bloqueada" },
  { estado: "hecha", etiqueta: "Hecha" },
];

export default async function PaginaTareas({
  searchParams,
}: {
  searchParams: Promise<{ nodoId?: string; personaId?: string }>;
}) {
  const { nodoId, personaId } = await searchParams;
  const [nodos, personas] = await Promise.all([
    obtenerArbolCompleto(),
    listarPersonas(),
  ]);
  const empleados = personas.filter((p) => p.tipo === "empleado" && p.activo);
  const nombreDeNodo = new Map(nodos.map((n) => [n.id, n.nombre]));
  const nombreDePersona = new Map(
    empleados.map((p) => [p.id, `${p.nombre} ${p.apellido}`]),
  );

  const tareas = await listarTareas({
    nodoResponsableId: nodoId ? Number(nodoId) : undefined,
    personaAsignadaId: personaId ? Number(personaId) : undefined,
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tareas</h1>
        <Link href="/app/tareas/mias" className="text-sm hover:underline">
          Mis tareas
        </Link>
      </div>

      <form method="get" className="mt-4 flex flex-wrap gap-3 text-sm">
        <select
          name="nodoId"
          defaultValue={nodoId ?? ""}
          className="rounded-md border px-2 py-1"
        >
          <option value="">Todos los nodos</option>
          {nodos.map((n) => (
            <option key={n.id} value={n.id}>
              {n.nombre}
            </option>
          ))}
        </select>
        <select
          name="personaId"
          defaultValue={personaId ?? ""}
          className="rounded-md border px-2 py-1"
        >
          <option value="">Todas las personas</option>
          {empleados.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} {p.apellido}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md border px-3 py-1">
          Filtrar
        </button>
        {(nodoId || personaId) && (
          <Link href="/app/tareas" className="self-center hover:underline">
            Limpiar filtros
          </Link>
        )}
      </form>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {COLUMNAS.map(({ estado, etiqueta }) => {
          const delEstado = tareas.filter((t) => t.estado === estado);
          return (
            <section key={estado} className="rounded-md border p-3">
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">
                {etiqueta} ({delEstado.length})
              </h2>
              <ul className="flex flex-col gap-2">
                {delEstado.map((t) => (
                  <li key={t.id} className="rounded-md border p-2 text-sm">
                    <Link
                      href={`/app/proyectos/${t.proyectoId}`}
                      className="font-medium hover:underline"
                    >
                      {t.titulo}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {t.proyectoNombre} ·{" "}
                      {nombreDeNodo.get(t.nodoResponsableId) ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.personaAsignadaId
                        ? nombreDePersona.get(t.personaAsignadaId)
                        : "Sin asignar"}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
