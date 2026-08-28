"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { IndicadorCarga } from "@/components/ui/indicador-carga";
import { Input } from "@/components/ui/input";
import { ProfileCard } from "@/components/ui/profile-card";
import { cn } from "@/lib/utils";

export interface NodoDePersona {
  id: number;
  nombre: string;
  rama: "interno" | "externo" | null;
}

export interface FilaPersona {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  tipo: "empleado" | "contacto_cliente";
  activo: boolean;
  estadoAcceso: "sin_acceso" | "invitada" | "confirmada";
  nodos: NodoDePersona[];
}

const BADGE_ESTADO = {
  sin_acceso: { variant: "outline" as const, texto: "Sin acceso" },
  invitada: { variant: "accent" as const, texto: "Invitada" },
  confirmada: { variant: "primary" as const, texto: "Confirmada" },
};

const FILTROS_RAMA = [
  { valor: "todas", etiqueta: "Todas" },
  { valor: "interno", etiqueta: "Interna" },
  { valor: "externo", etiqueta: "Externa" },
] as const;

type ValorFiltroRama = (typeof FILTROS_RAMA)[number]["valor"];

export function PersonasGrid({ filas }: { filas: FilaPersona[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [rama, setRama] = useState<ValorFiltroRama>("todas");

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return filas.filter((f) => {
      if (rama !== "todas" && !f.nodos.some((n) => n.rama === rama)) {
        return false;
      }
      if (!q) return true;
      return (
        `${f.nombre} ${f.apellido}`.toLowerCase().includes(q) ||
        f.email.toLowerCase().includes(q)
      );
    });
  }, [filas, busqueda, rama]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Buscar por nombre o email…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="sm:max-w-xs"
          aria-label="Buscar persona"
        />
        <div className="flex gap-1" role="group" aria-label="Filtrar por rama">
          {FILTROS_RAMA.map((f) => (
            <button
              key={f.valor}
              type="button"
              onClick={() => setRama(f.valor)}
              aria-pressed={rama === f.valor}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                rama === f.valor
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)]",
              )}
            >
              {f.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {filtradas.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nadie coincide con ese filtro.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtradas.map((f) => (
            <ProfileCard
              key={f.id}
              href={`/app/personas/${f.id}`}
              nombre={f.nombre}
              apellido={f.apellido}
              className={!f.activo ? "opacity-60" : undefined}
            >
              <p className="truncate text-xs text-muted-foreground">
                {f.email}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                {f.tipo === "empleado" ? (
                  <>
                    <IndicadorCarga cantidadDeNodos={f.nodos.length} />
                    <Badge variant={BADGE_ESTADO[f.estadoAcceso].variant}>
                      {BADGE_ESTADO[f.estadoAcceso].texto}
                    </Badge>
                  </>
                ) : (
                  <Badge variant="outline">Contacto de cliente</Badge>
                )}
                {!f.activo && <Badge variant="outline">Archivada</Badge>}
              </div>
              {f.nodos.length > 0 && (
                <p className="truncate text-xs text-muted-foreground">
                  {f.nodos.map((n) => n.nombre).join(", ")}
                </p>
              )}
            </ProfileCard>
          ))}
        </div>
      )}
    </div>
  );
}
