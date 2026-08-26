"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EstadoIngreso } from "./actions";
import { iniciarSesionAction } from "./actions";

export function FormularioIngreso() {
  const [estado, accion, enviando] = useActionState<EstadoIngreso, FormData>(
    iniciarSesionAction,
    {},
  );

  return (
    <form action={accion} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="ingreso-email">Email</Label>
        <Input id="ingreso-email" name="email" type="email" required />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="ingreso-password">Contraseña</Label>
        <Input id="ingreso-password" name="password" type="password" required />
      </div>

      {estado.error && (
        <p role="alert" className="text-sm text-destructive">
          {estado.error}
        </p>
      )}

      <Button type="submit" disabled={enviando} className="mt-2">
        Ingresar
      </Button>
    </form>
  );
}
