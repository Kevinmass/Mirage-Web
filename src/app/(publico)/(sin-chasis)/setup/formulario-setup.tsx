"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EstadoSetup } from "./actions";
import { crearPrimerEmpleadoAction } from "./actions";

export function FormularioSetup({ token }: { token: string }) {
  const [estado, accion, enviando] = useActionState<EstadoSetup, FormData>(
    crearPrimerEmpleadoAction,
    {},
  );

  return (
    <form action={accion} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="setup-nombre">Nombre</Label>
          <Input id="setup-nombre" name="nombre" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="setup-apellido">Apellido</Label>
          <Input id="setup-apellido" name="apellido" required />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="setup-email">Email</Label>
        <Input id="setup-email" name="email" type="email" required />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="setup-password">Contraseña</Label>
        <Input
          id="setup-password"
          name="password"
          type="password"
          minLength={8}
          required
        />
        <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
      </div>

      {estado.error && (
        <p role="alert" className="text-sm text-destructive">
          {estado.error}
        </p>
      )}

      <Button type="submit" disabled={enviando} className="mt-2">
        Crear empleado inicial
      </Button>
    </form>
  );
}
