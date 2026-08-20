"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { EstadoRestablecer } from "./actions";
import { restablecerPasswordAction } from "./actions";

export function FormularioRestablecer({ token }: { token: string }) {
  const [estado, accion, enviando] = useActionState<
    EstadoRestablecer,
    FormData
  >(restablecerPasswordAction, {});

  return (
    <form action={accion} className="flex max-w-sm flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <label className="flex flex-col gap-1 text-sm">
        Contraseña nueva
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="rounded-md border px-3 py-1.5"
        />
      </label>

      {estado.error && (
        <p className="text-sm text-destructive">{estado.error}</p>
      )}

      <Button type="submit" disabled={enviando}>
        Guardar contraseña
      </Button>
    </form>
  );
}
