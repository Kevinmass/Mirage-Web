"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useMovimientoReducido } from "@/lib/usar-movimiento-reducido";
import type { NodoConDetalle } from "@/kernel/organigrama/arbol";
import {
  calcularLayoutRadial,
  type PosicionNodo,
} from "@/kernel/organigrama/layout-radial";
import {
  crearMotorFisico,
  type MotorFisico,
  type PosicionVisible,
} from "./motor-fisico-organigrama";
import {
  BotonArchivarNodo,
  BotonFinalizarAsignacion,
  FormularioAsignarPersona,
  FormularioCrearNodo,
  FormularioEditarNodo,
  FormularioMoverNodo,
} from "./organigrama-formularios";

interface PersonaResumen {
  id: number;
  nombre: string;
  apellido: string;
}

interface Props {
  nodos: NodoConDetalle[];
  personas: PersonaResumen[];
  nodosControladosIds: number[];
}

type Rama = "interno" | "externo";

// Radio del nodo: tamaño por cantidad de personas asignadas (diseño
// §8.7), con un piso mayor para las dos jefaturas al centro.
function radioDeNodo(n: NodoConDetalle): number {
  const base = n.padreId === null ? 16 : 9;
  return base + Math.min(n.ocupantes.length, 4) * 2.5;
}

// Solo las dos raíces tienen `raiz` seteado — cualquier otro nodo hereda
// la rama de su mitad del círculo, que `calcularLayoutRadial` ya fijó
// (0°-180° interno, 180°-360° externo). Más barato que subir por
// padreId de nuevo acá, porque el ángulo ya está calculado.
function ramaDeNodo(n: NodoConDetalle, anguloInicio: number): Rama {
  if (n.raiz) return n.raiz;
  return anguloInicio < 180 ? "interno" : "externo";
}

const COLOR_RAMA: Record<Rama, string> = {
  interno: "var(--color-turquesa-500)",
  externo: "var(--color-ambar-500)",
};

export function OrganigramaCliente({
  nodos,
  personas,
  nodosControladosIds,
}: Props) {
  const [seleccionadoId, setSeleccionadoId] = useState<number | null>(null);
  const [vistaLista, setVistaLista] = useState(false);
  const reducido = useMovimientoReducido();
  const nodosControlados = useMemo(
    () => new Set(nodosControladosIds),
    [nodosControladosIds],
  );

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
    <div className="flex flex-col gap-4">
      <div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setVistaLista((v) => !v)}
        >
          {vistaLista ? "Ver dibujo radial" : "Ver como lista"}
        </Button>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className={vistaLista ? undefined : "hidden md:block md:flex-1"}>
          {vistaLista ? (
            <ListaJerarquica
              nodos={raices}
              hijosDe={hijosDe}
              seleccionadoId={seleccionadoId}
              onSeleccionar={setSeleccionadoId}
            />
          ) : (
            <OrganigramaRadial
              nodos={nodos}
              layout={layout}
              radioMax={radioMax}
              seleccionadoId={seleccionadoId}
              onSeleccionar={setSeleccionadoId}
              reducido={reducido}
            />
          )}
        </div>

        {!vistaLista && (
          <div className="md:hidden">
            <ListaJerarquica
              nodos={raices}
              hijosDe={hijosDe}
              seleccionadoId={seleccionadoId}
              onSeleccionar={setSeleccionadoId}
            />
          </div>
        )}

        <div className="w-full shrink-0 rounded-md border border-border p-4 lg:w-80">
          {seleccionado ? (
            <DetalleNodo
              nodo={seleccionado}
              hijos={hijosDe.get(seleccionado.id) ?? []}
              todosLosNodos={nodos}
              personas={personas}
              onSeleccionarHijo={setSeleccionadoId}
              puedeControlar={nodosControlados.has(seleccionado.id)}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Elegí un nodo para ver su detalle.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function OrganigramaRadial({
  nodos,
  layout,
  radioMax,
  seleccionadoId,
  onSeleccionar,
  reducido,
}: {
  nodos: NodoConDetalle[];
  layout: Map<number, PosicionNodo>;
  radioMax: number;
  seleccionadoId: number | null;
  onSeleccionar: (id: number) => void;
  reducido: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [posiciones, setPosiciones] = useState<Map<number, PosicionVisible>>(
    () => new Map(),
  );

  // El motor vive en un módulo aparte (ver motor-fisico-organigrama.ts):
  // no toma refs de React, así que crearlo durante el render es la
  // inicialización perezosa de un ref que React sí permite. Cada render
  // le pasa los datos frescos vía `actualizarContexto` desde un efecto
  // — nunca desde el cuerpo del render, que es lo que react-hooks/refs
  // prohíbe.
  const motorRef = useRef<MotorFisico | null>(null);
  if (motorRef.current == null) {
    motorRef.current = crearMotorFisico(setPosiciones);
  }

  useLayoutEffect(() => {
    motorRef.current?.actualizarContexto({
      layout,
      radioDe: (id) => {
        const n = nodos.find((m) => m.id === id);
        return n ? radioDeNodo(n) : 9;
      },
      reducido,
    });
  }, [layout, nodos, reducido]);

  useEffect(() => {
    return () => motorRef.current?.detener();
  }, []);

  function posicionDe(id: number): PosicionVisible {
    return posiciones.get(id) ?? layout.get(id) ?? { x: 0, y: 0 };
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`${-radioMax} ${-radioMax} ${radioMax * 2} ${radioMax * 2}`}
      className="h-auto w-full touch-none"
      role="img"
      aria-label="Organigrama, vista radial. Arrastrá un nodo para jugar con él — no cambia nada al soltarlo."
    >
      <circle
        cx={0}
        cy={0}
        r={radioMax - 10}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth={1}
        className="transition-[r] duration-(--dur-media) ease-(--ease-suave) motion-reduce:transition-none"
      />

      {nodos
        .filter((n) => n.padreId !== null)
        .map((n) => {
          if (
            !layout.has(n.id) ||
            n.padreId === null ||
            !layout.has(n.padreId)
          ) {
            return null;
          }
          const pos = posicionDe(n.id);
          const posPadre = posicionDe(n.padreId);
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
        const posCanonica = layout.get(n.id);
        if (!posCanonica) return null;
        const pos = posicionDe(n.id);
        const esRaiz = n.padreId === null;
        const activo = n.id === seleccionadoId;
        const vacante = n.ocupantes.length === 0;
        const radio = radioDeNodo(n);
        const rama = ramaDeNodo(n, posCanonica.anguloInicio);

        return (
          <g
            key={n.id}
            transform={`translate(${pos.x}, ${pos.y})`}
            tabIndex={0}
            role="button"
            aria-label={`${n.nombre}${vacante ? ", vacante" : ""}`}
            aria-pressed={activo}
            onClick={() => onSeleccionar(n.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSeleccionar(n.id);
              }
            }}
            onPointerDown={(e) => {
              (e.target as Element).setPointerCapture(e.pointerId);
              if (svgRef.current) {
                motorRef.current?.onPointerDown(
                  n.id,
                  svgRef.current,
                  e.clientX,
                  e.clientY,
                );
              }
            }}
            onPointerMove={(e) => {
              if (svgRef.current) {
                motorRef.current?.onPointerMove(
                  n.id,
                  svgRef.current,
                  e.clientX,
                  e.clientY,
                );
              }
            }}
            onPointerUp={(e) => {
              (e.target as Element).releasePointerCapture(e.pointerId);
              motorRef.current?.onPointerUp(n.id);
            }}
            className="cursor-pointer outline-none focus-visible:[&>circle]:stroke-ring focus-visible:[&>circle]:stroke-[3]"
          >
            <circle
              r={radio}
              // Un nodo vacante nunca se rellena sólido: sobre un radio
              // chico, relleno sólido + trazo punteado se ve como un
              // engranaje, no como un anillo. La selección se marca
              // engrosando el trazo en vez de cambiar el relleno acá.
              fill={activo && !vacante ? COLOR_RAMA[rama] : "var(--color-card)"}
              stroke={COLOR_RAMA[rama]}
              strokeWidth={esRaiz ? 3 : activo ? 3 : 2}
              strokeDasharray={vacante ? "3 3" : undefined}
            />
            <text
              y={-(radio + 6)}
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
  );
}

function DetalleNodo({
  nodo,
  hijos,
  todosLosNodos,
  personas,
  onSeleccionarHijo,
  puedeControlar,
}: {
  nodo: NodoConDetalle;
  hijos: NodoConDetalle[];
  todosLosNodos: NodoConDetalle[];
  personas: PersonaResumen[];
  onSeleccionarHijo: (id: number) => void;
  puedeControlar: boolean;
}) {
  const titular = nodo.ocupantes.find((o) => o.esTitular);
  const deshabilitado = !puedeControlar;

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
          <ul className="flex flex-col gap-1 text-sm">
            {nodo.ocupantes.map((o) => (
              <li key={o.personaId} className="flex items-center gap-2">
                <span>
                  {o.nombre} {o.apellido}
                  {o.esTitular ? " (titular)" : ""}
                </span>
                <BotonFinalizarAsignacion
                  asignacionId={o.asignacionId}
                  deshabilitado={deshabilitado}
                />
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2">
          <FormularioAsignarPersona
            nodoId={nodo.id}
            personas={personas}
            deshabilitado={deshabilitado}
          />
        </div>
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
        <div className="mt-2">
          <FormularioCrearNodo
            padreId={nodo.id}
            deshabilitado={deshabilitado}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-3">
        <div>
          <h3 className="mb-1 text-sm font-medium">Editar</h3>
          <FormularioEditarNodo nodo={nodo} deshabilitado={deshabilitado} />
        </div>

        {nodo.padreId !== null && (
          <div>
            <h3 className="mb-1 text-sm font-medium">Mover</h3>
            <FormularioMoverNodo
              nodo={nodo}
              candidatos={todosLosNodos}
              deshabilitado={deshabilitado}
            />
          </div>
        )}

        <div>
          <BotonArchivarNodo nodoId={nodo.id} deshabilitado={deshabilitado} />
        </div>
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
            {n.ocupantes.length === 0 && (
              <span className="ml-2 text-xs text-muted-foreground">
                vacante
              </span>
            )}
          </button>
          {(hijosDe.get(n.id) ?? []).length > 0 && (
            <div className="ml-4 border-l border-border pl-3">
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
