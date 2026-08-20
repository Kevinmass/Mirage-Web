"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { EstadoTarea } from "@/modules/proyectos/api";
import {
  asignarPersonaATareaAction,
  cambiarEstadoTareaAction,
  crearTareaAction,
} from "./actions";
import type { EstadoFormulario } from "./actions";

const ESTADOS_TAREA: { value: EstadoTarea; etiqueta: string }[] = [
  { value: "pendiente", etiqueta: "Pendiente" },
  { value: "en_curso", etiqueta: "En curso" },
  { value: "bloqueada", etiqueta: "Bloqueada" },
  { value: "hecha", etiqueta: "Hecha" },
];

interface OpcionNodo {
  id: number;
  nombre: string;
}

export function FormularioCrearTarea({
  proyectoId,
  nodos,
}: {
  proyectoId: number;
  nodos: OpcionNodo[];
}) {
  const [estado, accion, enviando] = useActionState<EstadoFormulario, FormData>(
    crearTareaAction.bind(null, proyectoId),
    {},
  );

  return (
    <form action={accion} className="flex max-w-sm flex-col gap-2 text-sm">
      <input
        name="titulo"
        placeholder="Título de la tarea"
        required
        className="rounded-md border px-2 py-1"
      />
      <select
        name="nodoResponsableId"
        required
        defaultValue=""
        className="rounded-md border px-2 py-1"
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
      <input
        type="date"
        name="venceEn"
        className="rounded-md border px-2 py-1"
      />
      {estado.error && (
        <p className="text-sm text-destructive">{estado.error}</p>
      )}
      <Button type="submit" size="sm" variant="secondary" disabled={enviando}>
        Agregar tarea
      </Button>
    </form>
  );
}

interface OpcionPersona {
  id: number;
  nombre: string;
  apellido: string;
}

export function FilaTarea({
  proyectoId,
  tarea,
  personas,
}: {
  proyectoId: number;
  tarea: {
    id: number;
    titulo: string;
    estado: EstadoTarea;
    personaAsignadaId: number | null;
  };
  personas: OpcionPersona[];
}) {
  return (
    <li className="flex flex-wrap items-center gap-2 border-b py-2 text-sm">
      <span className="flex-1">{tarea.titulo}</span>

      <form
        action={cambiarEstadoTareaAction.bind(null, proyectoId, tarea.id)}
        className="flex items-center gap-1"
      >
        <select
          name="estado"
          defaultValue={tarea.estado}
          className="rounded-md border px-2 py-1 text-xs"
        >
          {ESTADOS_TAREA.map((e) => (
            <option key={e.value} value={e.value}>
              {e.etiqueta}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" variant="ghost">
          Guardar
        </Button>
      </form>

      <form
        action={asignarPersonaATareaAction.bind(null, proyectoId, tarea.id)}
        className="flex items-center gap-1"
      >
        <select
          name="personaId"
          defaultValue={tarea.personaAsignadaId ?? ""}
          className="rounded-md border px-2 py-1 text-xs"
        >
          <option value="">Sin asignar</option>
          {personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} {p.apellido}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" variant="ghost">
          Asignar
        </Button>
      </form>
    </li>
  );
}
