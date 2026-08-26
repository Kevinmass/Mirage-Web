"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EstadoFormulario } from "./actions";

interface OpcionCliente {
  id: number;
  nombre: string;
}

interface Props {
  action: (
    previo: EstadoFormulario,
    formData: FormData,
  ) => Promise<EstadoFormulario>;
  clientes: OpcionCliente[];
  valoresIniciales?: {
    titulo: string;
    resumen: string;
    clienteId: number | null;
    testimonio: string | null;
    autor: string | null;
    cargoAutor: string | null;
    imagenUrl: string | null;
    publicado: boolean;
  };
  textoBoton: string;
}

// Formulario del caso: testimonio y autor son opcionales a propósito
// (§1.3 del plan de frontend) — un caso publicado sin testimonio sigue
// siendo válido, es lo que hay hoy hasta que el cliente autorice la cita.
export function FormularioCaso({
  action,
  clientes,
  valoresIniciales,
  textoBoton,
}: Props) {
  const [estado, formAction, enviando] = useActionState<
    EstadoFormulario,
    FormData
  >(action, {});

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="caso-titulo">Título</Label>
        <Input
          id="caso-titulo"
          name="titulo"
          required
          defaultValue={valoresIniciales?.titulo}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="caso-resumen">Resumen</Label>
        <textarea
          id="caso-resumen"
          name="resumen"
          required
          rows={3}
          defaultValue={valoresIniciales?.resumen}
          className="rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-turquesa-200"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="caso-cliente">
          Cliente (solo si autorizó que se lo nombre)
        </Label>
        <select
          id="caso-cliente"
          name="clienteId"
          defaultValue={valoresIniciales?.clienteId ?? ""}
          className="h-11 rounded-md border border-input bg-card px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-turquesa-200"
        >
          <option value="">Sin nombrar</option>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="caso-testimonio">Testimonio (cita textual)</Label>
        <textarea
          id="caso-testimonio"
          name="testimonio"
          rows={3}
          defaultValue={valoresIniciales?.testimonio ?? ""}
          className="rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-turquesa-200"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="caso-autor">Autor del testimonio</Label>
          <Input
            id="caso-autor"
            name="autor"
            defaultValue={valoresIniciales?.autor ?? ""}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="caso-cargo">Cargo del autor</Label>
          <Input
            id="caso-cargo"
            name="cargoAutor"
            defaultValue={valoresIniciales?.cargoAutor ?? ""}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="caso-imagen">Imagen (URL)</Label>
        <Input
          id="caso-imagen"
          name="imagenUrl"
          type="url"
          defaultValue={valoresIniciales?.imagenUrl ?? ""}
        />
      </div>

      <Label className="flex-row items-center gap-2">
        <input
          type="checkbox"
          name="publicado"
          defaultChecked={valoresIniciales?.publicado ?? false}
          className="size-4"
        />
        Publicado (visible en /casos)
      </Label>

      {estado.error && (
        <p role="alert" className="text-sm text-destructive">
          {estado.error}
        </p>
      )}

      <Button type="submit" disabled={enviando} className="mt-2">
        {textoBoton}
      </Button>
    </form>
  );
}
