"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { EstadoIngreso } from "./actions";
import { iniciarSesionAction } from "./actions";

export function FormularioIngreso() {
  const [estado, accion, enviando] = useActionState<EstadoIngreso, FormData>(
    iniciarSesionAction,
    {},
  );

  return (
    <form action={accion} className="flex max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          name="email"
          type="email"
          required
          className="rounded-md border px-3 py-1.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Contraseña
        <input
          name="password"
          type="password"
          required
          className="rounded-md border px-3 py-1.5"
        />
      </label>

      {estado.error && (
        <p className="text-sm text-destructive">{estado.error}</p>
      )}

      <Button type="submit" disabled={enviando}>
        Ingresar
      </Button>
    </form>
  );
}
