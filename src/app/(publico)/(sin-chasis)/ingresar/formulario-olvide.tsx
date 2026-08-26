"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <form action={accion} className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <Label htmlFor="olvide-email">Email</Label>
        <Input id="olvide-email" name="email" type="email" required />
      </div>
      <Button type="submit" variant="secondary" size="sm" disabled={enviando}>
        Mandar link
      </Button>
    </form>
  );
}
