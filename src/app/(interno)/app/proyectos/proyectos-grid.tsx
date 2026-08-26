"use client";

import { useMemo, useState } from "react";
import { CardProyecto } from "@/components/ui/card-proyecto";
import { cn } from "@/lib/utils";
import { BotonDesinscribirme, BotonInscribirme } from "./proyectos-formularios";

export interface FilaProyecto {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: string;
  color: string | null;
  imagenUrl: string | null;
  cupo: number | null;
  inscriptos: { personaId: number; nombre: string; apellido: string }[];
  inscriptoPropio: boolean;
  clienteId: number | null;
  clienteNombre: string | null;
}

const ESTADOS = [
  "propuesto",
  "activo",
  "pausado",
  "terminado",
  "cancelado",
] as const;

const ETIQUETA_ESTADO: Record<string, string> = {
  propuesto: "Propuesto",
  activo: "Activo",
  pausado: "Pausado",
  terminado: "Terminado",
  cancelado: "Cancelado",
};

type FiltroAlcance = "mis" | "todos";

export function ProyectosGrid({
  filas,
  clientes,
  haySesion,
}: {
  filas: FilaProyecto[];
  clientes: { id: number; nombre: string }[];
  haySesion: boolean;
}) {
  const [alcance, setAlcance] = useState<FiltroAlcance>("todos");
  const [clienteId, setClienteId] = useState<string>("todos");
  const [estado, setEstado] = useState<string>("todos");

  const filtradas = useMemo(() => {
    const resultado = filas.filter((f) => {
      if (alcance === "mis" && !f.inscriptoPropio) return false;
      if (clienteId !== "todos" && String(f.clienteId) !== clienteId) {
        return false;
      }
      if (estado !== "todos" && f.estado !== estado) return false;
      return true;
    });
    // Los proyectos donde el usuario está inscripto van primero
    // (diseño §8.10) — el resto conserva el orden alfabético que ya
    // trae listarProyectosConDetalle.
    return resultado
      .map((f, indice) => ({ f, indice }))
      .sort((a, b) => {
        if (a.f.inscriptoPropio !== b.f.inscriptoPropio) {
          return a.f.inscriptoPropio ? -1 : 1;
        }
        return a.indice - b.indice;
      })
      .map(({ f }) => f);
  }, [filas, alcance, clienteId, estado]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex gap-1" role="group" aria-label="Alcance">
          {(
            [
              { valor: "todos", etiqueta: "Todos" },
              { valor: "mis", etiqueta: "Mis proyectos" },
            ] as const
          ).map((o) => (
            <button
              key={o.valor}
              type="button"
              onClick={() => setAlcance(o.valor)}
              aria-pressed={alcance === o.valor}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                alcance === o.valor
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)]",
              )}
            >
              {o.etiqueta}
            </button>
          ))}
        </div>

        <select
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className="h-9 rounded-md border border-input bg-card px-2 text-sm"
          aria-label="Filtrar por cliente"
        >
          <option value="todos">Todos los clientes</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>

        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="h-9 rounded-md border border-input bg-card px-2 text-sm"
          aria-label="Filtrar por estado"
        >
          <option value="todos">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {ETIQUETA_ESTADO[e]}
            </option>
          ))}
        </select>
      </div>

      {filtradas.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Ningún proyecto coincide con ese filtro.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtradas.map((f) => {
            const lleno = f.cupo !== null && f.inscriptos.length >= f.cupo;
            return (
              <CardProyecto
                key={f.id}
                id={f.id}
                nombre={f.nombre}
                descripcion={f.descripcion}
                estado={f.estado}
                color={f.color}
                imagenUrl={f.imagenUrl}
                cupo={f.cupo}
                inscriptos={f.inscriptos}
                inscriptoPropio={f.inscriptoPropio}
                accion={
                  haySesion ? (
                    f.inscriptoPropio ? (
                      <BotonDesinscribirme proyectoId={f.id} />
                    ) : (
                      <BotonInscribirme proyectoId={f.id} lleno={lleno} />
                    )
                  ) : undefined
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
