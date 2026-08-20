"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
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
      <input
        name="owner"
        placeholder="Organización o usuario (ej: Kevinmass)"
        required
        className="rounded-md border px-2 py-1"
      />
      <input
        name="repo"
        placeholder="Repositorio (ej: Mirage-Web)"
        required
        className="rounded-md border px-2 py-1"
      />
      {estado.error && (
        <p className="text-sm text-destructive">{estado.error}</p>
      )}
      <Button type="submit" size="sm" variant="secondary" disabled={enviando}>
        Agregar repositorio
      </Button>
    </form>
  );
}
