"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { agregarMensajeAction, type EstadoFormulario } from "./actions";

// Criterio de aceptación (PR 7.4): el interruptor interno/visible al
// cliente tiene que ser "imposible de confundir" — no alcanza con la
// etiqueta del checkbox. Por eso el fondo de todo el formulario cambia
// (acento = interno, no solo el checkbox) y hay un texto explícito al
// lado, no solo el estado del control. `accent` es el token semántico
// (ámbar) del sistema visual, no un color literal.
export function FormularioMensaje({ solicitudId }: { solicitudId: number }) {
  const [estado, accion, enviando] = useActionState<EstadoFormulario, FormData>(
    agregarMensajeAction.bind(null, solicitudId),
    {},
  );
  const [visibleParaCliente, setVisibleParaCliente] = useState(true);

  return (
    <form
      action={accion}
      className={cn(
        "flex flex-col gap-2 rounded-md border border-border p-3 text-sm",
        !visibleParaCliente && "border-accent bg-accent/10",
      )}
    >
      <textarea
        name="cuerpo"
        required
        rows={3}
        placeholder={
          visibleParaCliente
            ? "Escribir una respuesta que va a ver el cliente…"
            : "Escribir una nota interna — el cliente no la va a ver…"
        }
        className="rounded-md border border-input bg-card px-2 py-1"
      />
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="visibleParaCliente"
          checked={visibleParaCliente}
          onChange={(e) => setVisibleParaCliente(e.target.checked)}
        />
        <span
          className={
            visibleParaCliente
              ? "text-muted-foreground"
              : "font-medium text-accent-foreground"
          }
        >
          {visibleParaCliente
            ? "Visible para el cliente"
            : "Nota interna — el cliente NO va a ver este mensaje"}
        </span>
      </label>
      {estado.error && <p className="text-destructive">{estado.error}</p>}
      <Button
        type="submit"
        size="sm"
        variant={visibleParaCliente ? "secondary" : "outline"}
        disabled={enviando}
        className="self-start"
      >
        {visibleParaCliente ? "Enviar respuesta" : "Guardar nota interna"}
      </Button>
    </form>
  );
}
