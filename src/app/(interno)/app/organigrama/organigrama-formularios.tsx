"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
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

function ErrorAccion({ estado }: { estado: EstadoAccion }) {
  if (!estado.error) return null;
  return <p className="text-sm text-destructive">{estado.error}</p>;
}

export function FormularioCrearNodo({ padreId }: { padreId: number }) {
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
        className="rounded-md border px-2 py-1 text-sm"
      />
      <ErrorAccion estado={estado} />
      <Button type="submit" size="sm" disabled={enviando}>
        Agregar hijo
      </Button>
    </form>
  );
}

export function FormularioEditarNodo({ nodo }: { nodo: NodoConDetalle }) {
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
        className="rounded-md border px-2 py-1 text-sm"
      />
      <textarea
        name="descripcion"
        defaultValue={nodo.descripcion ?? ""}
        placeholder="Descripción"
        className="rounded-md border px-2 py-1 text-sm"
      />
      <ErrorAccion estado={estado} />
      <Button type="submit" size="sm" variant="secondary" disabled={enviando}>
        Guardar
      </Button>
    </form>
  );
}

export function FormularioMoverNodo({
  nodo,
  candidatos,
}: {
  nodo: NodoConDetalle;
  candidatos: NodoConDetalle[];
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
        className="rounded-md border px-2 py-1 text-sm"
      >
        {opciones.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </select>
      <ErrorAccion estado={estado} />
      <Button type="submit" size="sm" variant="secondary" disabled={enviando}>
        Mover acá
      </Button>
    </form>
  );
}

export function BotonArchivarNodo({ nodoId }: { nodoId: number }) {
  const [estado, accion, enviando] = useActionState<EstadoAccion, FormData>(
    async (previo: EstadoAccion) => archivarNodoAction(nodoId, previo),
    {},
  );

  return (
    <form action={accion} className="flex flex-col gap-2">
      <ErrorAccion estado={estado} />
      <Button type="submit" size="sm" variant="destructive" disabled={enviando}>
        Archivar
      </Button>
    </form>
  );
}

export function FormularioAsignarPersona({
  nodoId,
  personas,
}: {
  nodoId: number;
  personas: { id: number; nombre: string; apellido: string }[];
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
        className="rounded-md border px-2 py-1 text-sm"
      >
        <option value="">Elegir persona…</option>
        {personas.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre} {p.apellido}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="esTitular" />
        Es titular
      </label>
      <ErrorAccion estado={estado} />
      <Button type="submit" size="sm" variant="secondary" disabled={enviando}>
        Asignar
      </Button>
    </form>
  );
}

export function BotonFinalizarAsignacion({
  asignacionId,
}: {
  asignacionId: number;
}) {
  return (
    <form action={finalizarAsignacionAction.bind(null, asignacionId)}>
      <Button type="submit" size="sm" variant="ghost">
        Finalizar
      </Button>
    </form>
  );
}
