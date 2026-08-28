"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { crearSolicitudAction, type EstadoFormulario } from "./actions";

const TIPOS = [
  { value: "funcionalidad_nueva", etiqueta: "Funcionalidad nueva" },
  { value: "bug", etiqueta: "Algo no está funcionando" },
  { value: "consulta", etiqueta: "Consulta" },
  { value: "otro", etiqueta: "Otro" },
];

export function FormularioSolicitud() {
  const [estado, accion, enviando] = useActionState<EstadoFormulario, FormData>(
    crearSolicitudAction,
    {},
  );

  return (
    <form
      action={accion}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="titulo">Título</Label>
        <Input
          id="titulo"
          name="titulo"
          required
          placeholder="Un resumen corto de lo que necesitás"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tipo">Tipo</Label>
        <select
          id="tipo"
          name="tipo"
          required
          defaultValue=""
          className="h-11 rounded-md border border-input bg-card px-3 text-sm text-card-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-turquesa-200 focus-visible:outline-none"
        >
          <option value="" disabled>
            Elegí una opción…
          </option>
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.etiqueta}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="descripcion">Descripción</Label>
        <textarea
          id="descripcion"
          name="descripcion"
          required
          rows={5}
          placeholder="Contanos con el mayor detalle posible qué necesitás"
          className="rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-turquesa-200 focus-visible:outline-none"
        />
      </div>

      {estado.error && (
        <p className="text-sm text-destructive">{estado.error}</p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={enviando}
        className="self-start"
      >
        Enviar solicitud
      </Button>
    </form>
  );
}
