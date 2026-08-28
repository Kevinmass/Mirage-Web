import Link from "next/link";
import { ListChecks } from "lucide-react";
import { TableroVacio } from "@/components/ui/tablero-vacio";
import { listarTareas } from "@/modules/proyectos/api";

// "Hoy" = vencidas o que vencen hoy — la lectura habitual de una lista
// de tareas del día, no todas las tareas abiertas de la persona (esa
// vista completa es /app/tareas/mias, del PR 11).
export async function MisTareasHoy({ personaId }: { personaId: number }) {
  const finDeHoy = new Date();
  finDeHoy.setHours(23, 59, 59, 999);

  const tareas = (
    await listarTareas({
      personaAsignadaId: personaId,
      excluirHechas: true,
    }).catch(() => [])
  )
    .filter((t) => !t.venceEn || t.venceEn <= finDeHoy)
    .slice(0, 6);

  if (tareas.length === 0) {
    return (
      <TableroVacio icono={ListChecks} texto="No tenés tareas para hoy." />
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {tareas.map((tarea) => (
        <li key={tarea.id}>
          <Link
            href={`/app/proyectos/${tarea.proyectoId}`}
            className="flex items-center justify-between gap-2 rounded-md px-2 py-2 text-sm hover:bg-secondary"
          >
            <span className="truncate">{tarea.titulo}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {tarea.proyectoNombre}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
