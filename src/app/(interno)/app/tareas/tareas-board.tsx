"use client";

import { useState } from "react";
import type { TareaConProyecto } from "@/modules/proyectos/api";
import { GanttTareas, type Hito, type ProyectoInscrito } from "./gantt-tareas";
import { KanbanTareas } from "./kanban-tareas";

interface OpcionProyecto {
  id: number;
  nombre: string;
  color: string | null;
}

interface OpcionNodo {
  id: number;
  nombre: string;
}

interface Props {
  tareasIniciales: TareaConProyecto[];
  proyectos: OpcionProyecto[];
  nodos: OpcionNodo[];
  proyectosInscritos: ProyectoInscrito[];
  hitosIniciales: Hito[];
  puedeEditar: boolean;
}

// Dueño único del estado de tareas: el Kanban y el Gantt lo leen y lo
// mutan sobre el mismo array (diseño §8.11 — "mover una tarjeta en el
// Kanban se refleja en el Gantt sin recargar"). Si cada vista tuviera
// su propia copia sincronizada por separado, un movimiento optimista
// en una no se vería en la otra hasta la próxima revalidación real.
export function TareasBoard({
  tareasIniciales,
  proyectos,
  nodos,
  proyectosInscritos,
  hitosIniciales,
  puedeEditar,
}: Props) {
  const [tareas, setTareas] = useState(tareasIniciales);

  // Mismo patrón que el Kanban usaba antes de este refactor: ajustar el
  // estado durante el render cuando cambian los datos del servidor
  // (compositor, revalidatePath) en vez de un efecto con setState.
  const [tareasPrevias, setTareasPrevias] = useState(tareasIniciales);
  if (tareasIniciales !== tareasPrevias) {
    setTareasPrevias(tareasIniciales);
    setTareas(tareasIniciales);
  }

  return (
    <div className="flex flex-col gap-8">
      <KanbanTareas
        tareas={tareas}
        onTareasChange={setTareas}
        proyectos={proyectos}
        nodos={nodos}
        puedeEditar={puedeEditar}
      />
      <GanttTareas
        tareas={tareas}
        onTareasChange={setTareas}
        proyectosInscritos={proyectosInscritos}
        hitosIniciales={hitosIniciales}
        proyectosParaHito={proyectos}
        puedeEditar={puedeEditar}
      />
    </div>
  );
}
