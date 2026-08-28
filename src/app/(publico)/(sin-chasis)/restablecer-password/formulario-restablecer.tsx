"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EstadoRestablecer } from "./actions";
import { restablecerPasswordAction } from "./actions";

export function FormularioRestablecer({ token }: { token: string }) {
  const [estado, accion, enviando] = useActionState<
    EstadoRestablecer,
    FormData
  >(restablecerPasswordAction, {});

  return (
    <form action={accion} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <div className="flex flex-col gap-1">
        <Label htmlFor="restablecer-password">Contraseña nueva</Label>
        <Input
          id="restablecer-password"
          name="password"
          type="password"
          required
          minLength={8}
        />
      </div>

      {estado.error && (
        <p role="alert" className="text-sm text-destructive">
          {estado.error}
        </p>
      )}

      <Button type="submit" disabled={enviando}>
        Guardar contraseña
      </Button>
    </form>
  );
}
