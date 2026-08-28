"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { EstadoFormulario } from "./actions";

interface OpcionNodo {
  id: number;
  nombre: string;
}

interface OpcionPersona {
  id: number;
  nombre: string;
  apellido: string;
}

interface Props {
  action: (
    previo: EstadoFormulario,
    formData: FormData,
  ) => Promise<EstadoFormulario>;
  nodos: OpcionNodo[];
  personas: OpcionPersona[];
  valoresIniciales?: {
    nombre: string;
    cuit: string;
    nodoResponsableId: number;
    contactoDirectoId: number;
  };
  textoBoton: string;
}

export function FormularioCliente({
  action,
  nodos,
  personas,
  valoresIniciales,
  textoBoton,
}: Props) {
  const [estado, formAction, enviando] = useActionState<
    EstadoFormulario,
    FormData
  >(action, {});

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Nombre
        <input
          name="nombre"
          required
          defaultValue={valoresIniciales?.nombre}
          className="rounded-md border px-3 py-1.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        CUIT
        <input
          name="cuit"
          required
          placeholder="30-11111111-1"
          defaultValue={valoresIniciales?.cuit}
          className="rounded-md border px-3 py-1.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Nodo responsable
        <select
          name="nodoResponsableId"
          required
          defaultValue={valoresIniciales?.nodoResponsableId ?? ""}
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
        Contacto directo (empleado)
        <select
          name="contactoDirectoId"
          required
          defaultValue={valoresIniciales?.contactoDirectoId ?? ""}
          className="rounded-md border px-3 py-1.5"
        >
          <option value="" disabled>
            Elegir persona…
          </option>
          {personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} {p.apellido}
            </option>
          ))}
        </select>
      </label>

      {estado.error && (
        <p className="text-sm text-destructive">{estado.error}</p>
      )}

      <Button type="submit" disabled={enviando}>
        {textoBoton}
      </Button>
    </form>
  );
}
