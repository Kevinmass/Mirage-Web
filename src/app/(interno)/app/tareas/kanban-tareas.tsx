"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useActionState, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  EstadoTarea,
  PrioridadTarea,
  TareaConProyecto,
} from "@/modules/proyectos/api";
import { cn } from "@/lib/utils";
import type { EstadoFormulario } from "../proyectos/actions";
import {
  crearTareaEnColumnaAction,
  moverTareaAction,
} from "../proyectos/actions";

const COLUMNAS: { estado: EstadoTarea; etiqueta: string }[] = [
  { estado: "pendiente", etiqueta: "Pendiente" },
  { estado: "en_curso", etiqueta: "En curso" },
  { estado: "bloqueada", etiqueta: "Bloqueada" },
  { estado: "hecha", etiqueta: "Hecha" },
];

const ETIQUETA_PRIORIDAD: Record<PrioridadTarea, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
};

function varianteDePrioridad(
  p: PrioridadTarea,
): "outline" | "accent" | "destructive" {
  if (p === "alta") return "destructive";
  if (p === "media") return "accent";
  return "outline";
}

interface OpcionProyecto {
  id: number;
  nombre: string;
  color: string | null;
}

interface OpcionNodo {
  id: number;
  nombre: string;
}

export type ActualizadorTareas = (
  updater: (prev: TareaConProyecto[]) => TareaConProyecto[],
) => void;

interface Props {
  tareas: TareaConProyecto[];
  onTareasChange: ActualizadorTareas;
  proyectos: OpcionProyecto[];
  nodos: OpcionNodo[];
  puedeEditar: boolean;
}

// El estado de las tareas vive en el padre (TareasBoard), no acá: el
// Gantt necesita leer y mutar el mismo array — "mover una tarjeta en
// el Kanban se refleja en el Gantt sin recargar" (diseño §8.11) exige
// que las dos vistas compartan una sola fuente de verdad en el cliente,
// no cada una la suya sincronizada por separado.
export function KanbanTareas({
  tareas,
  onTareasChange,
  proyectos,
  nodos,
  puedeEditar,
}: Props) {
  const [activaId, setActivaId] = useState<number | null>(null);
  const [errores, setErrores] = useState<Record<number, string>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const porEstado = useMemo(() => {
    const mapa: Record<EstadoTarea, TareaConProyecto[]> = {
      pendiente: [],
      en_curso: [],
      bloqueada: [],
      hecha: [],
    };
    for (const t of tareas) mapa[t.estado].push(t);
    return mapa;
  }, [tareas]);

  const tareaActiva = activaId
    ? tareas.find((t) => t.id === activaId)
    : undefined;

  function alIniciarArrastre(e: DragStartEvent) {
    setActivaId(Number(e.active.id));
  }

  function alTerminarArrastre(e: DragEndEvent) {
    setActivaId(null);
    const { active, over } = e;
    if (!over) return;

    const tareaId = Number(active.id);
    const nuevoEstado = String(over.id) as EstadoTarea;
    const tarea = tareas.find((t) => t.id === tareaId);
    if (!tarea || tarea.estado === nuevoEstado) return;

    const estadoAnterior = tarea.estado;
    onTareasChange((prev) =>
      prev.map((t) => (t.id === tareaId ? { ...t, estado: nuevoEstado } : t)),
    );
    setErrores((prev) => {
      const { [tareaId]: _quitado, ...resto } = prev;
      return resto;
    });

    moverTareaAction(tarea.proyectoId, tareaId, nuevoEstado).then((res) => {
      if (!res.ok) {
        // Optimista con reversión visible (criterio de aceptación del
        // PR 11): si el servidor rechaza, la tarjeta vuelve a su
        // columna y el motivo queda a la vista, no se pierde.
        onTareasChange((prev) =>
          prev.map((t) =>
            t.id === tareaId ? { ...t, estado: estadoAnterior } : t,
          ),
        );
        setErrores((prev) => ({
          ...prev,
          [tareaId]: res.error ?? "No se pudo mover la tarea",
        }));
      }
    });
  }

  return (
    <DndContext
      // Sin un id explícito, dnd-kit arma sus ids de accesibilidad
      // (aria-describedby) con un contador interno que no coincide
      // entre el render de servidor y el de cliente bajo SSR — produce
      // un mismatch de hidratación real (visto en consola al probar
      // esto en el navegador). Un id fijo lo evita.
      id="kanban-tareas"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={alIniciarArrastre}
      onDragEnd={alTerminarArrastre}
    >
      <div className="flex gap-4 overflow-x-auto pb-2">
        {COLUMNAS.map((col) => (
          <ColumnaKanban
            key={col.estado}
            estado={col.estado}
            etiqueta={col.etiqueta}
            tareas={porEstado[col.estado]}
            errores={errores}
            puedeEditar={puedeEditar}
            proyectos={proyectos}
            nodos={nodos}
          />
        ))}
      </div>
      <DragOverlay>
        {tareaActiva ? <TarjetaTarea tarea={tareaActiva} enOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function ColumnaKanban({
  estado,
  etiqueta,
  tareas,
  errores,
  puedeEditar,
  proyectos,
  nodos,
}: {
  estado: EstadoTarea;
  etiqueta: string;
  tareas: TareaConProyecto[];
  errores: Record<number, string>;
  puedeEditar: boolean;
  proyectos: OpcionProyecto[];
  nodos: OpcionNodo[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: estado });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3 transition-colors",
        isOver && "border-primary bg-primary/5",
      )}
    >
      <h2 className="text-sm font-medium text-muted-foreground">
        {etiqueta} ({tareas.length})
      </h2>

      <div className="flex flex-col gap-2">
        {tareas.map((t) => (
          <TarjetaTarea
            key={t.id}
            tarea={t}
            error={errores[t.id]}
            draggable={puedeEditar}
          />
        ))}
        {tareas.length === 0 && (
          <p className="rounded-md border border-dashed border-border px-2 py-4 text-center text-xs text-muted-foreground">
            Sin tareas
          </p>
        )}
      </div>

      {puedeEditar ? (
        <ComposerColumna estado={estado} proyectos={proyectos} nodos={nodos} />
      ) : (
        <p className="text-xs text-muted-foreground">
          Sin permiso para crear o mover tareas acá.
        </p>
      )}
    </section>
  );
}

function TarjetaTarea({
  tarea,
  error,
  draggable = false,
  enOverlay = false,
}: {
  tarea: TareaConProyecto;
  error?: string;
  draggable?: boolean;
  enOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: tarea.id, disabled: !draggable });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(draggable ? attributes : {})}
      {...(draggable ? listeners : {})}
      className={cn(
        "flex flex-col gap-1.5 rounded-md border border-border bg-card p-2.5 text-sm shadow-xs",
        draggable &&
          "cursor-grab touch-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:cursor-grabbing",
        isDragging && !enOverlay && "opacity-40",
        error && "border-destructive",
      )}
    >
      <p className="font-medium">{tarea.titulo}</p>
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <span
          aria-hidden
          className="size-2 rounded-full"
          style={{
            backgroundColor:
              tarea.proyectoColor ?? "var(--color-muted-foreground)",
          }}
        />
        <span className="truncate">{tarea.proyectoNombre}</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge
          variant={varianteDePrioridad(tarea.prioridad)}
          className="text-[0.65rem]"
        >
          {ETIQUETA_PRIORIDAD[tarea.prioridad]}
        </Badge>
        {tarea.venceEn && (
          <span className="font-mono text-[0.7rem] text-muted-foreground">
            {/* venceEn es una fecha de calendario (medianoche UTC), no
                un instante — sin timeZone: "UTC" se corre un día para
                atrás en Buenos Aires (-03:00). */}
            {new Date(tarea.venceEn).toLocaleDateString("es-AR", {
              timeZone: "UTC",
            })}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ComposerColumna({
  estado,
  proyectos,
  nodos,
}: {
  estado: EstadoTarea;
  proyectos: OpcionProyecto[];
  nodos: OpcionNodo[];
}) {
  const [formEstado, accion, enviando] = useActionState<
    EstadoFormulario,
    FormData
  >(crearTareaEnColumnaAction.bind(null, estado), {});

  return (
    <form
      action={accion}
      className="flex flex-col gap-1.5 border-t border-border pt-2"
    >
      <input
        name="titulo"
        placeholder="Nueva tarea…"
        required
        className="rounded-md border border-input bg-card px-2 py-1 text-xs"
      />
      <select
        name="proyectoId"
        required
        defaultValue=""
        className="rounded-md border border-input bg-card px-2 py-1 text-xs"
      >
        <option value="" disabled>
          Proyecto…
        </option>
        {proyectos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre}
          </option>
        ))}
      </select>
      <select
        name="nodoResponsableId"
        required
        defaultValue=""
        className="rounded-md border border-input bg-card px-2 py-1 text-xs"
      >
        <option value="" disabled>
          Nodo responsable…
        </option>
        {nodos.map((n) => (
          <option key={n.id} value={n.id}>
            {n.nombre}
          </option>
        ))}
      </select>
      <select
        name="prioridad"
        defaultValue="media"
        className="rounded-md border border-input bg-card px-2 py-1 text-xs"
      >
        <option value="baja">Prioridad baja</option>
        <option value="media">Prioridad media</option>
        <option value="alta">Prioridad alta</option>
      </select>
      {formEstado.error && (
        <p className="text-xs text-destructive">{formEstado.error}</p>
      )}
      <Button type="submit" size="xs" variant="secondary" disabled={enviando}>
        Agregar
      </Button>
    </form>
  );
}
