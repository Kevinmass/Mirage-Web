"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { agregarMensajeAction, type EstadoFormulario } from "./actions";

export function FormularioMensajePortal({
  solicitudId,
}: {
  solicitudId: number;
}) {
  const [estado, accion, enviando] = useActionState<EstadoFormulario, FormData>(
    agregarMensajeAction.bind(null, solicitudId),
    {},
  );

  return (
    <form
      action={accion}
      className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
    >
      <textarea
        name="cuerpo"
        required
        rows={3}
        placeholder="Escribir una respuesta…"
        className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-turquesa-200 focus-visible:outline-none"
      />
      {estado.error && (
        <p className="text-sm text-destructive">{estado.error}</p>
      )}
      <Button type="submit" disabled={enviando} className="self-start">
        Enviar
      </Button>
    </form>
  );
}
