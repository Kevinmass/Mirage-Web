"use client";

import { useState, useTransition } from "react";
import type { Rol } from "@/kernel/permisos/roles";
import { alternarRolAction } from "./actions";

// Los roles de una persona, con checkbox para asignar/quitar. Solo se
// renderiza si la sesión tiene identidad.administrar (lo decide la page);
// la Server Action lo revalida igual.
export function RolesDePersona({
  personaId,
  roles,
  rolesActuales,
}: {
  personaId: number;
  roles: Rol[];
  rolesActuales: number[];
}) {
  const [seleccion, setSeleccion] = useState(() => new Set(rolesActuales));
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  function alternar(rolId: number, marcado: boolean) {
    setSeleccion((prev) => {
      const next = new Set(prev);
      if (marcado) next.add(rolId);
      else next.delete(rolId);
      return next;
    });
    setError(null);
    startTransition(async () => {
      try {
        await alternarRolAction(personaId, rolId, marcado);
      } catch {
        // Revertir el optimista si la acción falló.
        setSeleccion((prev) => {
          const next = new Set(prev);
          if (marcado) next.delete(rolId);
          else next.add(rolId);
          return next;
        });
        setError("No se pudo cambiar el rol.");
      }
    });
  }

  if (roles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no hay roles. Creá uno en{" "}
        <a
          href="/app/roles"
          className="underline underline-offset-2 hover:text-foreground"
        >
          Roles
        </a>
        .
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {roles.map((rol) => (
        <label key={rol.id} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={seleccion.has(rol.id)}
            disabled={pendiente}
            onChange={(e) => alternar(rol.id, e.target.checked)}
            className="accent-primary"
          />
          <span>
            {rol.nombre}
            {rol.descripcion && (
              <span className="block text-xs text-muted-foreground">
                {rol.descripcion}
              </span>
            )}
          </span>
        </label>
      ))}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
