import Link from "next/link";
import { obtenerSesionActual } from "@/kernel/identidad/sesion";
import {
  listarNodosDeLaPersona,
  obtenerArbolCompleto,
} from "@/kernel/organigrama/arbol";
import { listarTareas } from "@/modules/proyectos/api";

// Criterio de aceptación (PR 5.3): un empleado ve en una pantalla todo
// lo pendiente de los nodos que ocupa. "Pendiente" acá es "no hecha",
// no el estado 'pendiente' puntual — en_curso y bloqueada también son
// trabajo abierto.
export default async function PaginaMisTareas() {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-muted-foreground">Iniciá sesión para ver esto.</p>
      </main>
    );
  }

  const [nodosOcupados, nodos] = await Promise.all([
    listarNodosDeLaPersona(sesion.personaId),
    obtenerArbolCompleto(),
  ]);
  const nombreDeNodo = new Map(nodos.map((n) => [n.id, n.nombre]));

  const tareas = await listarTareas({
    nodoResponsableIdEntre: nodosOcupados,
    excluirHechas: true,
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Mis tareas</h1>
      <p className="text-sm text-muted-foreground">
        Todo lo pendiente de los nodos que ocupás.
      </p>

      <ul className="mt-6 flex flex-col gap-2">
        {tareas.map((t) => (
          <li key={t.id} className="rounded-md border p-3 text-sm">
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
          </li>
        ))}
        {tareas.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nada pendiente en los nodos que ocupás.
          </p>
        )}
      </ul>
    </main>
  );
}
