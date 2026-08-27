"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    <form action={accion} className="flex max-w-sm flex-col gap-2">
      <Input name="titulo" placeholder="Título de la tarea" required />
      <Select name="nodoResponsableId" required>
        <SelectTrigger>
          <SelectValue placeholder="Nodo responsable…" />
        </SelectTrigger>
        <SelectContent>
          {nodos.map((n) => (
            <SelectItem key={n.id} value={String(n.id)}>
              {n.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input type="date" name="venceEn" aria-label="Vence el" />
      {estado.error && (
        <p role="alert" className="text-sm text-destructive">
          {estado.error}
        </p>
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
        <Select name="estado" defaultValue={tarea.estado}>
          <SelectTrigger
            size="sm"
            className="w-36"
            aria-label="Estado de la tarea"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ESTADOS_TAREA.map((e) => (
              <SelectItem key={e.value} value={e.value}>
                {e.etiqueta}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" size="sm" variant="ghost">
          Guardar
        </Button>
      </form>

      <form
        action={asignarPersonaATareaAction.bind(null, proyectoId, tarea.id)}
        className="flex items-center gap-1"
      >
        <Select
          name="personaId"
          defaultValue={
            tarea.personaAsignadaId !== null
              ? String(tarea.personaAsignadaId)
              : "sin-asignar"
          }
        >
          <SelectTrigger
            size="sm"
            className="w-44"
            aria-label="Persona asignada"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sin-asignar">Sin asignar</SelectItem>
            {personas.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.nombre} {p.apellido}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" size="sm" variant="ghost">
          Asignar
        </Button>
      </form>
    </li>
  );
}
