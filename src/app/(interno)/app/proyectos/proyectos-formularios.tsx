"use client";

import { useActionState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import type { EstadoFormulario } from "./actions";
import {
  agregarAlEquipoAction,
  cambiarCupoAction,
  desinscribirmeAction,
  inscribirmeAction,
  quitarDelEquipoAction,
} from "./actions";

// Si está lleno, el botón se deshabilita con el motivo en un tooltip
// (mismo patrón que el organigrama, PR 8) — nunca se oculta.
export function BotonInscribirme({
  proyectoId,
  lleno,
}: {
  proyectoId: number;
  lleno: boolean;
}) {
  const [estado, accion, enviando] = useActionState<EstadoFormulario, FormData>(
    inscribirmeAction.bind(null, proyectoId),
    {},
  );

  const boton = (
    <Button
      type="submit"
      size="sm"
      variant="secondary"
      disabled={enviando || lleno}
    >
      Anotarme
    </Button>
  );

  return (
    <form action={accion} className="flex items-center gap-2">
      {lleno ? (
        <Tooltip>
          <TooltipTrigger
            render={<span className="inline-block">{boton}</span>}
          />
          <TooltipContent>Este proyecto ya alcanzó su cupo</TooltipContent>
        </Tooltip>
      ) : (
        boton
      )}
      {estado.error && (
        <p className="text-xs text-destructive">{estado.error}</p>
      )}
    </form>
  );
}

export function BotonDesinscribirme({ proyectoId }: { proyectoId: number }) {
  return (
    <form action={desinscribirmeAction.bind(null, proyectoId)}>
      <Button type="submit" size="sm" variant="ghost">
        Desanotarme
      </Button>
    </form>
  );
}

interface OpcionPersona {
  id: number;
  nombre: string;
  apellido: string;
}

export function FormularioEquipo({
  proyectoId,
  personas,
}: {
  proyectoId: number;
  personas: OpcionPersona[];
}) {
  const [estado, accion, enviando] = useActionState<EstadoFormulario, FormData>(
    agregarAlEquipoAction.bind(null, proyectoId),
    {},
  );

  return (
    <form action={accion} className="flex flex-col gap-2 sm:flex-row">
      <select
        name="personaId"
        required
        className="h-11 rounded-md border border-input bg-card px-3 text-sm"
      >
        <option value="">Elegir persona…</option>
        {personas.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre} {p.apellido}
          </option>
        ))}
      </select>
      <select
        name="rol"
        defaultValue="miembro"
        className="h-11 rounded-md border border-input bg-card px-3 text-sm"
      >
        <option value="miembro">Miembro</option>
        <option value="lider">Líder</option>
      </select>
      <Button type="submit" size="sm" variant="secondary" disabled={enviando}>
        Agregar al equipo
      </Button>
      {estado.error && (
        <p className="text-sm text-destructive">{estado.error}</p>
      )}
    </form>
  );
}

export function BotonQuitarDelEquipo({
  proyectoId,
  personaId,
}: {
  proyectoId: number;
  personaId: number;
}) {
  return (
    <form action={quitarDelEquipoAction.bind(null, proyectoId, personaId)}>
      <Button type="submit" size="sm" variant="ghost">
        Quitar
      </Button>
    </form>
  );
}

export function FormularioCupo({
  proyectoId,
  cupoActual,
}: {
  proyectoId: number;
  cupoActual: number | null;
}) {
  const [estado, accion, enviando] = useActionState<EstadoFormulario, FormData>(
    cambiarCupoAction.bind(null, proyectoId),
    {},
  );

  return (
    <form action={accion} className="flex items-end gap-2">
      <label className="flex flex-col gap-1 text-sm">
        Cupo (vacío = sin límite)
        <input
          type="number"
          name="cupo"
          min={1}
          defaultValue={cupoActual ?? ""}
          className="w-32 rounded-md border px-3 py-1.5"
        />
      </label>
      <Button type="submit" size="sm" variant="secondary" disabled={enviando}>
        Guardar cupo
      </Button>
      {estado.error && (
        <p className="text-sm text-destructive">{estado.error}</p>
      )}
    </form>
  );
}
