"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import type { EstadoOlvide } from "./actions";
import { olvidePasswordAction } from "./actions";

export function FormularioOlvide() {
  const [abierto, setAbierto] = useState(false);
  const [estado, accion, enviando] = useActionState<EstadoOlvide, FormData>(
    olvidePasswordAction,
    {},
  );

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="text-sm text-muted-foreground hover:text-foreground hover:underline"
      >
        ¿Olvidaste tu contraseña?
      </button>
    );
  }

  if (estado.enviado) {
    return (
      <p className="text-sm text-muted-foreground">
        Si ese email tiene una cuenta, te llega un link para poner una
        contraseña nueva.
      </p>
    );
  }

  return (
    <form action={accion} className="flex max-w-sm flex-col gap-2">
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          name="email"
          type="email"
          required
          className="rounded-md border px-3 py-1.5"
        />
      </label>
      <Button type="submit" variant="secondary" size="sm" disabled={enviando}>
        Mandar link
      </Button>
    </form>
  );
}
