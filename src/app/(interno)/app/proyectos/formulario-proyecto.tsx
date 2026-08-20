"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { EstadoFormulario } from "./actions";
import { crearProyectoAction } from "./actions";

interface OpcionCliente {
  id: number;
  nombre: string;
}

interface OpcionNodo {
  id: number;
  nombre: string;
}

export function FormularioProyecto({
  clientes,
  nodos,
}: {
  clientes: OpcionCliente[];
  nodos: OpcionNodo[];
}) {
  const [estado, accion, enviando] = useActionState<EstadoFormulario, FormData>(
    crearProyectoAction,
    {},
  );

  return (
    <form action={accion} className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Nombre
        <input
          name="nombre"
          required
          className="rounded-md border px-3 py-1.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Descripción
        <textarea
          name="descripcion"
          className="rounded-md border px-3 py-1.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Cliente
        <select
          name="clienteId"
          required
          defaultValue=""
          className="rounded-md border px-3 py-1.5"
        >
          <option value="" disabled>
            Elegir cliente…
          </option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Nodo responsable
        <select
          name="nodoResponsableId"
          required
          defaultValue=""
          className="rounded-md border px-3 py-1.5"
        >
          <option value="" disabled>
            Elegir nodo…
          </option>
          {nodos.map((n) => (
            <option key={n.id} value={n.id}>
              {n.nombre}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Fecha de inicio
        <input
          type="date"
          name="fechaInicio"
          className="rounded-md border px-3 py-1.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Fecha de fin estimada
        <input
          type="date"
          name="fechaFinEstimada"
          className="rounded-md border px-3 py-1.5"
        />
      </label>

      {estado.error && (
        <p className="text-sm text-destructive">{estado.error}</p>
      )}

      <Button type="submit" disabled={enviando}>
        Crear
      </Button>
    </form>
  );
}
