"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Capacidad, Rol } from "@/kernel/permisos/roles";
import {
  crearRolAction,
  fijarCapacidadesDeRolAction,
  type EstadoRoles,
} from "./actions";

function agruparPorModulo(capacidades: Capacidad[]) {
  const grupos = new Map<string, Capacidad[]>();
  for (const c of capacidades) {
    const lista = grupos.get(c.modulo) ?? [];
    lista.push(c);
    grupos.set(c.modulo, lista);
  }
  return [...grupos.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function FormularioRol({
  rol,
  capacidades,
  seleccionadas,
}: {
  rol: Rol;
  capacidades: Capacidad[];
  seleccionadas: string[];
}) {
  const accion = fijarCapacidadesDeRolAction.bind(null, rol.id);
  const [estado, formAction, enviando] = useActionState<EstadoRoles, FormData>(
    accion,
    {},
  );
  const activas = new Set(seleccionadas);

  return (
    <form action={formAction} className="rounded-md border border-border p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-heading font-semibold">{rol.nombre}</h2>
        {rol.descripcion && (
          <p className="text-xs text-muted-foreground">{rol.descripcion}</p>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {agruparPorModulo(capacidades).map(([modulo, caps]) => (
          <fieldset key={modulo} className="flex flex-col gap-1.5">
            <legend className="text-xs font-medium text-muted-foreground uppercase">
              {modulo}
            </legend>
            {caps.map((c) => (
              <label key={c.clave} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  name="capacidad"
                  value={c.clave}
                  defaultChecked={activas.has(c.clave)}
                  className="mt-0.5 accent-primary"
                />
                <span>
                  <code className="font-mono text-xs">{c.clave}</code>
                  {c.huerfana && (
                    <span className="ml-1 text-xs text-destructive">
                      (huérfana)
                    </span>
                  )}
                  <span className="block text-xs text-muted-foreground">
                    {c.descripcion}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
        ))}
      </div>

      {estado.error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {estado.error}
        </p>
      )}

      <Button type="submit" size="sm" disabled={enviando} className="mt-3">
        Guardar capacidades
      </Button>
    </form>
  );
}

function FormularioNuevoRol() {
  const [estado, formAction, enviando] = useActionState<EstadoRoles, FormData>(
    crearRolAction,
    {},
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-md border border-dashed border-border p-4"
    >
      <h2 className="text-lg font-heading font-semibold">Nuevo rol</h2>
      <div className="flex flex-col gap-1">
        <Label htmlFor="rol-nombre">Nombre</Label>
        <Input id="rol-nombre" name="nombre" required />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="rol-descripcion">Descripción (opcional)</Label>
        <Input id="rol-descripcion" name="descripcion" />
      </div>
      {estado.error && (
        <p role="alert" className="text-sm text-destructive">
          {estado.error}
        </p>
      )}
      <Button type="submit" size="sm" variant="secondary" disabled={enviando}>
        Crear rol
      </Button>
    </form>
  );
}

export function EditorRoles({
  roles,
  capacidades,
  capacidadesPorRol,
}: {
  roles: Rol[];
  capacidades: Capacidad[];
  capacidadesPorRol: Record<number, string[]>;
}) {
  return (
    <div className="flex flex-col gap-6">
      {roles.map((rol) => (
        <FormularioRol
          key={rol.id}
          rol={rol}
          capacidades={capacidades}
          seleccionadas={capacidadesPorRol[rol.id] ?? []}
        />
      ))}
      <FormularioNuevoRol />
    </div>
  );
}
