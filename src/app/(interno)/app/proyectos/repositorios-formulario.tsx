"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EstadoFormulario } from "./actions";
import { agregarRepositorioAction } from "./actions";

export function FormularioAgregarRepositorio({
  proyectoId,
}: {
  proyectoId: number;
}) {
  const [estado, accion, enviando] = useActionState<EstadoFormulario, FormData>(
    agregarRepositorioAction.bind(null, proyectoId),
    {},
  );

  return (
    <form action={accion} className="flex max-w-sm flex-col gap-2 text-sm">
      <Input
        name="owner"
        placeholder="Organización o usuario (ej: Kevinmass)"
        required
      />
      <Input name="repo" placeholder="Repositorio (ej: Mirage-Web)" required />
      {estado.error && (
        <p className="text-sm text-destructive">{estado.error}</p>
      )}
      <Button type="submit" size="sm" variant="secondary" disabled={enviando}>
        Agregar repositorio
      </Button>
    </form>
  );
}
