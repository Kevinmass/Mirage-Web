"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { EstadoFormulario } from "./actions";

interface Props {
  action: (
    previo: EstadoFormulario,
    formData: FormData,
  ) => Promise<EstadoFormulario>;
  valoresIniciales?: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string | null;
    tipo: string;
  };
  textoBoton: string;
}

export function FormularioPersona({
  action,
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
        Apellido
        <input
          name="apellido"
          required
          defaultValue={valoresIniciales?.apellido}
          className="rounded-md border px-3 py-1.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          name="email"
          type="email"
          required
          defaultValue={valoresIniciales?.email}
          className="rounded-md border px-3 py-1.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Teléfono (E.164, ej: +5491122334455)
        <input
          name="telefono"
          defaultValue={valoresIniciales?.telefono ?? ""}
          className="rounded-md border px-3 py-1.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Tipo
        <select
          name="tipo"
          defaultValue={valoresIniciales?.tipo ?? "empleado"}
          className="rounded-md border px-3 py-1.5"
        >
          <option value="empleado">Empleado</option>
          <option value="contacto_cliente">Contacto de cliente</option>
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
