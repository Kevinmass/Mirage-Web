"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
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
    <form action={accion} className="flex max-w-sm flex-col gap-2 text-sm">
      <input
        name="nombre"
        placeholder="Nombre"
        required
        className="rounded-md border px-2 py-1"
      />
      <input
        name="apellido"
        placeholder="Apellido"
        required
        className="rounded-md border px-2 py-1"
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        className="rounded-md border px-2 py-1"
      />
      <input
        name="telefono"
        placeholder="Teléfono (E.164, opcional)"
        className="rounded-md border px-2 py-1"
      />
      <input
        name="cargo"
        placeholder="Cargo (opcional)"
        className="rounded-md border px-2 py-1"
      />
      <label className="flex items-center gap-2">
        <input type="checkbox" name="esPrincipal" />
        Es el contacto principal
      </label>
      <ErrorAccion estado={estado} />
      <Button type="submit" size="sm" variant="secondary" disabled={enviando}>
        Agregar contacto
      </Button>
    </form>
  );
}

const TIPOS_INTERACCION = [
  { value: "llamada", etiqueta: "Llamada" },
  { value: "mail", etiqueta: "Mail" },
  { value: "reunion", etiqueta: "Reunión" },
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
    <form action={accion} className="flex max-w-sm flex-col gap-2 text-sm">
      <select name="personaId" required className="rounded-md border px-2 py-1">
        <option value="">Con quién…</option>
        {personas.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre} {p.apellido}
          </option>
        ))}
      </select>
      <select name="tipo" required className="rounded-md border px-2 py-1">
        {TIPOS_INTERACCION.map((t) => (
          <option key={t.value} value={t.value}>
            {t.etiqueta}
          </option>
        ))}
      </select>
      <textarea
        name="resumen"
        placeholder="Resumen"
        required
        className="rounded-md border px-2 py-1"
      />
      <ErrorAccion estado={estado} />
      <Button type="submit" size="sm" variant="secondary" disabled={enviando}>
        Registrar interacción
      </Button>
    </form>
  );
}
