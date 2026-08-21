"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
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
      className="flex flex-col gap-4 rounded-lg border bg-background p-6"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="titulo" className="text-sm font-medium">
          Título
        </label>
        <input
          id="titulo"
          name="titulo"
          required
          placeholder="Un resumen corto de lo que necesitás"
          className="rounded-md border px-3 py-2"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="tipo" className="text-sm font-medium">
          Tipo
        </label>
        <select
          id="tipo"
          name="tipo"
          required
          defaultValue=""
          className="rounded-md border px-3 py-2"
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

      <div className="flex flex-col gap-1">
        <label htmlFor="descripcion" className="text-sm font-medium">
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          required
          rows={5}
          placeholder="Contanos con el mayor detalle posible qué necesitás"
          className="rounded-md border px-3 py-2"
        />
      </div>

      {estado.error && (
        <p className="text-sm text-destructive">{estado.error}</p>
      )}

      <Button type="submit" disabled={enviando} className="self-start">
        Enviar solicitud
      </Button>
    </form>
  );
}
