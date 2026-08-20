"use client";

import { useMemo, useState } from "react";
import type { NodoConDetalle } from "@/kernel/organigrama/arbol";
import { calcularLayoutRadial } from "@/kernel/organigrama/layout-radial";

interface Props {
  nodos: NodoConDetalle[];
}

// Diseño (PR 3.5): dibujo por anillos concéntricos en desktop; en
// móvil (< 768px, breakpoint md de Tailwind) un organigrama radial no
// se lee en 390px de ancho, así que en su lugar hay una lista
// jerárquica — no es la misma vista encogida, es una vista distinta.
export function OrganigramaCliente({ nodos }: Props) {
  const [seleccionadoId, setSeleccionadoId] = useState<number | null>(null);

  const layout = useMemo(
    () =>
      calcularLayoutRadial(
        nodos.map((n) => ({
          id: n.id,
          padreId: n.padreId,
          raiz: n.raiz,
          orden: n.orden,
          anillo: n.anillo,
        })),
      ),
    [nodos],
  );

  const porId = useMemo(() => new Map(nodos.map((n) => [n.id, n])), [nodos]);

  const hijosDe = useMemo(() => {
    const mapa = new Map<number, NodoConDetalle[]>();
    for (const n of nodos) {
      if (n.padreId === null) continue;
      const lista = mapa.get(n.padreId) ?? [];
      lista.push(n);
      mapa.set(n.padreId, lista);
    }
    for (const lista of mapa.values()) {
      lista.sort((a, b) => a.orden - b.orden);
    }
    return mapa;
  }, [nodos]);

  const raices = useMemo(
    () =>
      nodos
        .filter((n) => n.padreId === null)
        .sort((a, b) =>
          a.raiz === b.raiz ? a.orden - b.orden : a.raiz === "interno" ? -1 : 1,
        ),
    [nodos],
  );

  if (nodos.length === 0) {
    return (
      <p className="text-muted-foreground">Todavía no hay nodos cargados.</p>
    );
  }

  const seleccionado =
    seleccionadoId !== null ? porId.get(seleccionadoId) : undefined;
  const radioMax =
    Math.max(...Array.from(layout.values()).map((p) => p.radio)) + 60;

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="hidden flex-1 md:block">
        <svg
          viewBox={`${-radioMax} ${-radioMax} ${radioMax * 2} ${radioMax * 2}`}
          className="h-auto w-full"
          role="img"
          aria-label="Organigrama, vista radial"
        >
          {nodos
            .filter((n) => n.padreId !== null)
            .map((n) => {
              const pos = layout.get(n.id);
              const posPadre =
                n.padreId !== null ? layout.get(n.padreId) : undefined;
              if (!pos || !posPadre) return null;
              return (
                <line
                  key={`linea-${n.id}`}
                  x1={posPadre.x}
                  y1={posPadre.y}
                  x2={pos.x}
                  y2={pos.y}
                  stroke="var(--color-border)"
                  strokeWidth={1}
                />
              );
            })}

          {nodos.map((n) => {
            const pos = layout.get(n.id);
            if (!pos) return null;
            const esRaiz = n.padreId === null;
            const activo = n.id === seleccionadoId;
            return (
              <g
                key={n.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => setSeleccionadoId(n.id)}
                className="cursor-pointer"
              >
                <circle
                  r={esRaiz ? 14 : 8}
                  fill={
                    activo
                      ? "var(--color-primary)"
                      : "var(--color-muted-foreground)"
                  }
                />
                <text
                  y={esRaiz ? -20 : -12}
                  textAnchor="middle"
                  fontSize={esRaiz ? 12 : 9}
                  fill="var(--color-foreground)"
                >
                  {n.nombre}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="md:hidden">
        <ListaJerarquica
          nodos={raices}
          hijosDe={hijosDe}
          seleccionadoId={seleccionadoId}
          onSeleccionar={setSeleccionadoId}
        />
      </div>

      <div className="w-full shrink-0 rounded-md border p-4 lg:w-80">
        {seleccionado ? (
          <DetalleNodo
            nodo={seleccionado}
            hijos={hijosDe.get(seleccionado.id) ?? []}
            onSeleccionarHijo={setSeleccionadoId}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Elegí un nodo para ver su detalle.
          </p>
        )}
      </div>
    </div>
  );
}

function DetalleNodo({
  nodo,
  hijos,
  onSeleccionarHijo,
}: {
  nodo: NodoConDetalle;
  hijos: NodoConDetalle[];
  onSeleccionarHijo: (id: number) => void;
}) {
  const titular = nodo.ocupantes.find((o) => o.esTitular);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{nodo.nombre}</h2>
      {nodo.descripcion && (
        <p className="text-sm text-muted-foreground">{nodo.descripcion}</p>
      )}

      <div>
        <h3 className="text-sm font-medium">Titular</h3>
        {titular ? (
          <p className="text-sm">
            {titular.nombre} {titular.apellido}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Sin titular</p>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium">Ocupantes</h3>
        {nodo.ocupantes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nadie asignado</p>
        ) : (
          <ul className="text-sm">
            {nodo.ocupantes.map((o) => (
              <li key={o.personaId}>
                {o.nombre} {o.apellido}
                {o.esTitular ? " (titular)" : ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium">Nodos hijos</h3>
        {hijos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin hijos</p>
        ) : (
          <ul className="text-sm">
            {hijos.map((hijo) => (
              <li key={hijo.id}>
                <button
                  type="button"
                  className="hover:underline"
                  onClick={() => onSeleccionarHijo(hijo.id)}
                >
                  {hijo.nombre}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ListaJerarquica({
  nodos,
  hijosDe,
  seleccionadoId,
  onSeleccionar,
}: {
  nodos: NodoConDetalle[];
  hijosDe: Map<number, NodoConDetalle[]>;
  seleccionadoId: number | null;
  onSeleccionar: (id: number) => void;
}) {
  return (
    <ul className="flex flex-col gap-1 pl-0">
      {nodos.map((n) => (
        <li key={n.id}>
          <button
            type="button"
            onClick={() => onSeleccionar(n.id)}
            className={
              n.id === seleccionadoId
                ? "text-left text-sm font-semibold text-primary hover:underline"
                : "text-left text-sm hover:underline"
            }
          >
            {n.nombre}
          </button>
          {(hijosDe.get(n.id) ?? []).length > 0 && (
            <div className="ml-4 border-l pl-3">
              <ListaJerarquica
                nodos={hijosDe.get(n.id) ?? []}
                hijosDe={hijosDe}
                seleccionadoId={seleccionadoId}
                onSeleccionar={onSeleccionar}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
