"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { NodoConDetalle } from "@/kernel/organigrama/arbol";
import {
  archivarNodoAction,
  actualizarNodoAction,
  asignarPersonaAction,
  crearNodoAction,
  finalizarAsignacionAction,
  moverNodoAction,
  type EstadoAccion,
} from "./actions";

// Motivo por defecto de por qué un control está deshabilitado — entender
// la jerarquía es parte del punto (diseño §8.8), así que nunca se oculta
// el control, se explica.
const MOTIVO_SIN_PERMISO =
  "Solo quien ocupa este nodo o uno de sus superiores puede editarlo acá";

function ErrorAccion({ estado }: { estado: EstadoAccion }) {
  if (!estado.error) return null;
  return <p className="text-sm text-destructive">{estado.error}</p>;
}

// Envuelve cualquier control de este archivo en el tooltip del motivo
// cuando está deshabilitado — un solo lugar en vez de repetir el patrón
// Tooltip/Trigger en cada formulario.
function ConMotivoSiDeshabilitado({
  deshabilitado,
  motivo,
  children,
}: {
  deshabilitado: boolean;
  motivo: string;
  children: React.ReactNode;
}) {
  if (!deshabilitado) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span className="inline-block">{children}</span>}
      />
      <TooltipContent>{motivo}</TooltipContent>
    </Tooltip>
  );
}

export function FormularioCrearNodo({
  padreId,
  deshabilitado = false,
  motivo = MOTIVO_SIN_PERMISO,
}: {
  padreId: number;
  deshabilitado?: boolean;
  motivo?: string;
}) {
  const [estado, accion, enviando] = useActionState<EstadoAccion, FormData>(
    crearNodoAction.bind(null, padreId),
    {},
  );

  return (
    <form action={accion} className="flex flex-col gap-2">
      <input
        name="nombre"
        placeholder="Nombre del nuevo nodo hijo"
        required
        disabled={deshabilitado}
        className="rounded-md border px-2 py-1 text-sm disabled:opacity-50"
      />
      <ErrorAccion estado={estado} />
      <ConMotivoSiDeshabilitado deshabilitado={deshabilitado} motivo={motivo}>
        <Button
          type="submit"
          size="sm"
          disabled={enviando || deshabilitado}
          className="w-full"
        >
          Agregar hijo
        </Button>
      </ConMotivoSiDeshabilitado>
    </form>
  );
}

export function FormularioEditarNodo({
  nodo,
  deshabilitado = false,
  motivo = MOTIVO_SIN_PERMISO,
}: {
  nodo: NodoConDetalle;
  deshabilitado?: boolean;
  motivo?: string;
}) {
  const [estado, accion, enviando] = useActionState<EstadoAccion, FormData>(
    actualizarNodoAction.bind(null, nodo.id),
    {},
  );

  return (
    <form action={accion} className="flex flex-col gap-2">
      <input
        name="nombre"
        defaultValue={nodo.nombre}
        required
        disabled={deshabilitado}
        className="rounded-md border px-2 py-1 text-sm disabled:opacity-50"
      />
      <textarea
        name="descripcion"
        defaultValue={nodo.descripcion ?? ""}
        placeholder="Descripción"
        disabled={deshabilitado}
        className="rounded-md border px-2 py-1 text-sm disabled:opacity-50"
      />
      <ErrorAccion estado={estado} />
      <ConMotivoSiDeshabilitado deshabilitado={deshabilitado} motivo={motivo}>
        <Button
          type="submit"
          size="sm"
          variant="secondary"
          disabled={enviando || deshabilitado}
          className="w-full"
        >
          Guardar
        </Button>
      </ConMotivoSiDeshabilitado>
    </form>
  );
}

export function FormularioMoverNodo({
  nodo,
  candidatos,
  deshabilitado = false,
  motivo = MOTIVO_SIN_PERMISO,
}: {
  nodo: NodoConDetalle;
  candidatos: NodoConDetalle[];
  deshabilitado?: boolean;
  motivo?: string;
}) {
  const [estado, accion, enviando] = useActionState<EstadoAccion, FormData>(
    moverNodoAction.bind(null, nodo.id),
    {},
  );

  // Una raíz sí puede ser destino (mover algo para que cuelgue
  // directamente de "Dirección" o "Clientes" es válido) — lo único que
  // no puede pasar es elegirse a sí mismo. Mover a un descendiente
  // propio (ciclo) lo rechaza el servidor con Validacion; no vale la
  // pena duplicar ese cálculo acá solo para no ofrecer la opción.
  const opciones = candidatos.filter((c) => c.id !== nodo.id);

  return (
    <form action={accion} className="flex flex-col gap-2">
      <select
        name="nuevoPadreId"
        defaultValue={nodo.padreId ?? ""}
        disabled={deshabilitado}
        className="rounded-md border px-2 py-1 text-sm disabled:opacity-50"
      >
        {opciones.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </select>
      <ErrorAccion estado={estado} />
      <ConMotivoSiDeshabilitado deshabilitado={deshabilitado} motivo={motivo}>
        <Button
          type="submit"
          size="sm"
          variant="secondary"
          disabled={enviando || deshabilitado}
          className="w-full"
        >
          Mover acá
        </Button>
      </ConMotivoSiDeshabilitado>
    </form>
  );
}

export function BotonArchivarNodo({
  nodoId,
  deshabilitado = false,
  motivo = MOTIVO_SIN_PERMISO,
}: {
  nodoId: number;
  deshabilitado?: boolean;
  motivo?: string;
}) {
  const [estado, accion, enviando] = useActionState<EstadoAccion, FormData>(
    async (previo: EstadoAccion) => archivarNodoAction(nodoId, previo),
    {},
  );

  return (
    <form action={accion} className="flex flex-col gap-2">
      <ErrorAccion estado={estado} />
      <ConMotivoSiDeshabilitado deshabilitado={deshabilitado} motivo={motivo}>
        <Button
          type="submit"
          size="sm"
          variant="destructive"
          disabled={enviando || deshabilitado}
        >
          Archivar
        </Button>
      </ConMotivoSiDeshabilitado>
    </form>
  );
}

export function FormularioAsignarPersona({
  nodoId,
  personas,
  deshabilitado = false,
  motivo = MOTIVO_SIN_PERMISO,
}: {
  nodoId: number;
  personas: { id: number; nombre: string; apellido: string }[];
  deshabilitado?: boolean;
  motivo?: string;
}) {
  const [estado, accion, enviando] = useActionState<EstadoAccion, FormData>(
    asignarPersonaAction.bind(null, nodoId),
    {},
  );

  return (
    <form action={accion} className="flex flex-col gap-2">
      <select
        name="personaId"
        required
        disabled={deshabilitado}
        className="rounded-md border px-2 py-1 text-sm disabled:opacity-50"
      >
        <option value="">Elegir persona…</option>
        {personas.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre} {p.apellido}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="esTitular" disabled={deshabilitado} />
        Es titular
      </label>
      <ErrorAccion estado={estado} />
      <ConMotivoSiDeshabilitado deshabilitado={deshabilitado} motivo={motivo}>
        <Button
          type="submit"
          size="sm"
          variant="secondary"
          disabled={enviando || deshabilitado}
          className="w-full"
        >
          Asignar
        </Button>
      </ConMotivoSiDeshabilitado>
    </form>
  );
}

export function BotonFinalizarAsignacion({
  asignacionId,
  deshabilitado = false,
  motivo = MOTIVO_SIN_PERMISO,
}: {
  asignacionId: number;
  deshabilitado?: boolean;
  motivo?: string;
}) {
  return (
    <form action={finalizarAsignacionAction.bind(null, asignacionId)}>
      <ConMotivoSiDeshabilitado deshabilitado={deshabilitado} motivo={motivo}>
        <Button
          type="submit"
          size="sm"
          variant="ghost"
          disabled={deshabilitado}
        >
          Finalizar
        </Button>
      </ConMotivoSiDeshabilitado>
    </form>
  );
}
