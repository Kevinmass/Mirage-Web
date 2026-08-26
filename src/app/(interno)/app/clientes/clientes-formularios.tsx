"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EstadoFormulario } from "./actions";
import { crearContactoAction, registrarInteraccionAction } from "./actions";

function ErrorAccion({ estado }: { estado: EstadoFormulario }) {
  if (!estado.error) return null;
  return <p className="text-sm text-destructive">{estado.error}</p>;
}

export function FormularioContacto({ clienteId }: { clienteId: number }) {
  const [estado, accion, enviando] = useActionState<EstadoFormulario, FormData>(
    crearContactoAction.bind(null, clienteId),
    {},
  );

  return (
    <form action={accion} className="flex flex-col gap-2">
      <Input name="nombre" placeholder="Nombre" required />
      <Input name="apellido" placeholder="Apellido" required />
      <Input name="email" type="email" placeholder="Email" required />
      <Input name="telefono" placeholder="Teléfono (E.164, opcional)" />
      <Input name="cargo" placeholder="Cargo (opcional)" />
      <Label className="font-normal">
        <input type="checkbox" name="esPrincipal" />
        Es el contacto principal
      </Label>
      <ErrorAccion estado={estado} />
      <Button type="submit" size="sm" variant="secondary" disabled={enviando}>
        Agregar contacto
      </Button>
    </form>
  );
}

// El diseño no fija un enum de tipos de interacción (no es una
// restricción normativa, a diferencia de `estado`) — esta lista incluye
// "whatsapp" desde este PR porque es el canal real que más se consulta
// (§ del plan, PR 9); antes caía en "otro" y se perdía la información.
export const TIPOS_INTERACCION = [
  { value: "llamada", etiqueta: "Llamada" },
  { value: "mail", etiqueta: "Mail" },
  { value: "reunion", etiqueta: "Reunión" },
  { value: "whatsapp", etiqueta: "WhatsApp" },
  { value: "otro", etiqueta: "Otro" },
] as const;

interface OpcionPersona {
  id: number;
  nombre: string;
  apellido: string;
}

export function FormularioInteraccion({
  clienteId,
  personas,
}: {
  clienteId: number;
  personas: OpcionPersona[];
}) {
  const [estado, accion, enviando] = useActionState<EstadoFormulario, FormData>(
    registrarInteraccionAction.bind(null, clienteId),
    {},
  );

  return (
    <form action={accion} className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          name="personaId"
          required
          className="h-11 rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="">Con quién…</option>
          {personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} {p.apellido}
            </option>
          ))}
        </select>
        <select
          name="tipo"
          required
          className="h-11 rounded-md border border-input bg-card px-3 text-sm"
        >
          {TIPOS_INTERACCION.map((t) => (
            <option key={t.value} value={t.value}>
              {t.etiqueta}
            </option>
          ))}
        </select>
      </div>
      <textarea
        name="resumen"
        placeholder="¿Qué se habló?"
        required
        rows={2}
        className="rounded-md border border-input bg-card px-3 py-2 text-sm"
      />
      <ErrorAccion estado={estado} />
      <Button type="submit" size="sm" variant="secondary" disabled={enviando}>
        Registrar interacción
      </Button>
    </form>
  );
}
