"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TareaConProyecto } from "@/modules/proyectos/api";
import type { EstadoFormulario } from "../proyectos/actions";
import {
  cambiarFechasTareaAction,
  crearHitoAction,
} from "../proyectos/actions";
import type { ActualizadorTareas } from "./kanban-tareas";

export interface ProyectoInscrito {
  id: number;
  nombre: string;
  color: string | null;
  fechaInicio: Date | null;
  fechaFinEstimada: Date | null;
}

export interface Hito {
  id: number;
  proyectoId: number;
  nombre: string;
  fecha: Date;
  color: string | null;
}

interface OpcionProyecto {
  id: number;
  nombre: string;
}

type Zoom = "semana" | "mes" | "trimestre";

const CONFIG_ZOOM: Record<
  Zoom,
  { pixelsPorDia: number; rangoDias: number; unidad: "dia" | "semana" | "mes" }
> = {
  semana: { pixelsPorDia: 32, rangoDias: 90, unidad: "dia" },
  mes: { pixelsPorDia: 10, rangoDias: 270, unidad: "semana" },
  trimestre: { pixelsPorDia: 3, rangoDias: 720, unidad: "mes" },
};

const ALTURA_FILA = 32;
const DIA_MS = 24 * 60 * 60 * 1000;
const RIESGO_HITO_DIAS = 14;

function diffEnDias(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / DIA_MS);
}

function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getTime() + dias * DIA_MS);
}

// empiezaEn/venceEn/fecha de hito son fechas de calendario, no
// instantes — se guardan como medianoche UTC. Formatearlas sin fijar
// timeZone: "UTC" las corre un día para atrás en cualquier huso
// horario negativo (Buenos Aires, -03:00, incluido): 2026-08-24T00:00Z
// se ve "23/8" en vez de "24/8". Esto no aplica a fechas con hora real
// (una interacción de cliente, por ejemplo), solo a las de solo-fecha.
function formatearFechaUTC(
  fecha: Date,
  opciones: Intl.DateTimeFormatOptions = {},
): string {
  return fecha.toLocaleDateString("es-AR", { ...opciones, timeZone: "UTC" });
}

// "Cuando la fecha se acerca y hay tareas sin terminar antes de ella,
// el rombo pasa a coral" (diseño §8.11) — es la señal que justifica el
// hito, no un adorno.
function hitoEnRiesgo(hito: Hito, tareas: TareaConProyecto[]): boolean {
  const hoy = new Date();
  const diasHastaHito = diffEnDias(hito.fecha, hoy);
  if (diasHastaHito < 0 || diasHastaHito > RIESGO_HITO_DIAS) return false;

  return tareas.some((t) => {
    if (t.proyectoId !== hito.proyectoId || t.estado === "hecha") return false;
    const fechaLimite = t.venceEn ?? t.empiezaEn;
    return fechaLimite !== null && new Date(fechaLimite) <= hito.fecha;
  });
}

interface Props {
  tareas: TareaConProyecto[];
  onTareasChange: ActualizadorTareas;
  proyectosInscritos: ProyectoInscrito[];
  hitosIniciales: Hito[];
  proyectosParaHito: OpcionProyecto[];
  puedeEditar: boolean;
}

export function GanttTareas({
  tareas,
  onTareasChange,
  proyectosInscritos,
  hitosIniciales,
  proyectosParaHito,
  puedeEditar,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const zoom = (searchParams.get("zoom") as Zoom | null) ?? "mes";
  const config = CONFIG_ZOOM[zoom] ?? CONFIG_ZOOM.mes;

  const [hitos, setHitos] = useState(hitosIniciales);
  const [hitosPrevios, setHitosPrevios] = useState(hitosIniciales);
  if (hitosIniciales !== hitosPrevios) {
    setHitosPrevios(hitosIniciales);
    setHitos(hitosIniciales);
  }

  const tareasConFecha = useMemo(
    () => tareas.filter((t) => t.empiezaEn !== null || t.venceEn !== null),
    [tareas],
  );

  const { inicioVentana, anchoTotal } = useMemo(() => {
    const hoy = new Date();
    const fechas: Date[] = [hoy];
    for (const t of tareasConFecha) {
      if (t.empiezaEn) fechas.push(new Date(t.empiezaEn));
      if (t.venceEn) fechas.push(new Date(t.venceEn));
    }
    for (const p of proyectosInscritos) {
      if (p.fechaInicio) fechas.push(new Date(p.fechaInicio));
      if (p.fechaFinEstimada) fechas.push(new Date(p.fechaFinEstimada));
    }
    for (const h of hitos) fechas.push(new Date(h.fecha));

    const minFecha = new Date(Math.min(...fechas.map((f) => f.getTime())));
    const maxFecha = new Date(Math.max(...fechas.map((f) => f.getTime())));
    const padding = Math.round(config.rangoDias * 0.15);
    const inicio = sumarDias(minFecha, -padding);
    const fin = sumarDias(maxFecha, padding);
    const dias = Math.max(diffEnDias(fin, inicio), config.rangoDias);

    return { inicioVentana: inicio, anchoTotal: dias * config.pixelsPorDia };
  }, [tareasConFecha, proyectosInscritos, hitos, config]);

  function xDe(fecha: Date): number {
    return diffEnDias(fecha, inicioVentana) * config.pixelsPorDia;
  }

  function cambiarZoom(nuevoZoom: Zoom) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("zoom", nuevoZoom);
    router.push(`?${params.toString()}`, { scroll: false });
  }

  const segmentosHeader = useMemo(
    () => construirSegmentosHeader(inicioVentana, anchoTotal, config),
    [inicioVentana, anchoTotal, config],
  );

  const filasProyecto = proyectosInscritos.filter(
    (p) => p.fechaInicio ?? p.fechaFinEstimada,
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="hidden items-center justify-between md:flex">
        <h2 className="text-lg font-heading font-semibold">Gantt</h2>
        <div className="flex items-center gap-3">
          <div className="flex gap-1" role="group" aria-label="Zoom del Gantt">
            {(["semana", "mes", "trimestre"] as const).map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => cambiarZoom(z)}
                aria-pressed={zoom === z}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                  zoom === z
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)]",
                )}
              >
                {z}
              </button>
            ))}
          </div>
          {puedeEditar && (
            <FormularioHito
              proyectos={proyectosParaHito}
              onCreado={(h) => setHitos((prev) => [...prev, h])}
            />
          )}
        </div>
      </div>

      {/* El Gantt no se dibuja en móvil — un Gantt en 390px es un Gantt
          que nadie usa (diseño §8.11). Se ofrece una lista por fecha. */}
      <div className="hidden md:block">
        {tareasConFecha.length === 0 && filasProyecto.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Nada con fechas todavía.
          </p>
        ) : (
          <div className="flex overflow-hidden rounded-lg border border-border">
            <div className="w-44 shrink-0 border-r border-border bg-muted/30">
              <div
                className="flex items-center border-b border-border px-2 text-xs font-medium text-muted-foreground"
                style={{ height: ALTURA_FILA }}
              >
                Proyectos
              </div>
              {filasProyecto.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-1.5 truncate px-2 text-xs"
                  style={{ height: ALTURA_FILA }}
                >
                  <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor: p.color ?? "var(--color-primary)",
                    }}
                  />
                  <span className="truncate">{p.nombre}</span>
                </div>
              ))}
              <div
                className="flex items-center border-y border-border px-2 text-xs font-medium text-muted-foreground"
                style={{ height: ALTURA_FILA }}
              >
                Tareas
              </div>
              {tareasConFecha.map((t) => (
                <div
                  key={t.id}
                  title={t.titulo}
                  className="flex items-center truncate px-2 text-xs"
                  style={{ height: ALTURA_FILA }}
                >
                  {t.titulo}
                </div>
              ))}
            </div>

            <div className="flex-1 overflow-x-auto">
              <div style={{ width: anchoTotal, position: "relative" }}>
                <div
                  className="flex border-b border-border"
                  style={{ height: ALTURA_FILA }}
                >
                  {segmentosHeader.map((s) => (
                    <div
                      key={s.x}
                      className="shrink-0 truncate border-r border-border px-1 text-[0.65rem] text-muted-foreground"
                      style={{ width: s.ancho }}
                    >
                      {s.etiqueta}
                    </div>
                  ))}
                </div>

                {filasProyecto.map((p, i) => {
                  const inicio = p.fechaInicio ? new Date(p.fechaInicio) : null;
                  const fin = p.fechaFinEstimada
                    ? new Date(p.fechaFinEstimada)
                    : inicio;
                  if (!inicio || !fin) return null;
                  return (
                    <div
                      key={p.id}
                      className="border-b border-border"
                      style={{ height: ALTURA_FILA }}
                    >
                      <div
                        className="absolute rounded-full opacity-70"
                        style={{
                          left: xDe(inicio),
                          width: Math.max(xDe(fin) - xDe(inicio), 6),
                          top: (i + 1) * ALTURA_FILA + 8,
                          height: ALTURA_FILA - 16,
                          backgroundColor: p.color ?? "var(--color-primary)",
                        }}
                        title={p.nombre}
                      />
                    </div>
                  );
                })}

                <div
                  className="border-b border-border"
                  style={{ height: ALTURA_FILA }}
                />

                {tareasConFecha.map((t, i) => (
                  <BarraTarea
                    key={t.id}
                    tarea={t}
                    top={(filasProyecto.length + 2 + i) * ALTURA_FILA}
                    xDe={xDe}
                    pixelsPorDia={config.pixelsPorDia}
                    puedeEditar={puedeEditar}
                    onTareasChange={onTareasChange}
                    onAbrir={() =>
                      router.push(`/app/proyectos/${t.proyectoId}`)
                    }
                  />
                ))}

                {hitos.map((h) => (
                  <MarcadorHito
                    key={h.id}
                    hito={h}
                    x={xDe(new Date(h.fecha))}
                    alturaTotal={
                      ALTURA_FILA *
                      (filasProyecto.length + 2 + tareasConFecha.length)
                    }
                    enRiesgo={hitoEnRiesgo(h, tareas)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="md:hidden">
        <ListaPorFecha tareas={tareasConFecha} />
      </div>
    </div>
  );
}

function construirSegmentosHeader(
  inicioVentana: Date,
  anchoTotal: number,
  config: (typeof CONFIG_ZOOM)[Zoom],
): { x: number; ancho: number; etiqueta: string }[] {
  const segmentos: { x: number; ancho: number; etiqueta: string }[] = [];
  const totalDias = anchoTotal / config.pixelsPorDia;

  if (config.unidad === "dia") {
    for (let d = 0; d < totalDias; d++) {
      const fecha = sumarDias(inicioVentana, d);
      segmentos.push({
        x: d * config.pixelsPorDia,
        ancho: config.pixelsPorDia,
        etiqueta: formatearFechaUTC(fecha, {
          day: "2-digit",
          month: "2-digit",
        }),
      });
    }
  } else if (config.unidad === "semana") {
    for (let d = 0; d < totalDias; d += 7) {
      const fecha = sumarDias(inicioVentana, d);
      segmentos.push({
        x: d * config.pixelsPorDia,
        ancho: 7 * config.pixelsPorDia,
        etiqueta: `Sem ${formatearFechaUTC(fecha, { day: "2-digit", month: "2-digit" })}`,
      });
    }
  } else {
    // Los cursores del bucket mensual se arman con getters/Date.UTC en
    // UTC, no locales: las fechas guardadas son medianoche UTC, y armar
    // el 1° del mes con getFullYear()/getMonth() (locales) las corre un
    // día en cualquier huso horario negativo (Buenos Aires incluido).
    let cursor = new Date(
      Date.UTC(inicioVentana.getUTCFullYear(), inicioVentana.getUTCMonth(), 1),
    );
    while (diffEnDias(cursor, inicioVentana) < totalDias) {
      const siguiente = new Date(
        Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1),
      );
      const x = diffEnDias(cursor, inicioVentana) * config.pixelsPorDia;
      const ancho = diffEnDias(siguiente, cursor) * config.pixelsPorDia;
      segmentos.push({
        x,
        ancho,
        etiqueta: formatearFechaUTC(cursor, {
          month: "short",
          year: "numeric",
        }),
      });
      cursor = siguiente;
    }
  }

  return segmentos;
}

type ModoArrastre = "mover" | "inicio" | "fin";

function BarraTarea({
  tarea,
  top,
  xDe,
  pixelsPorDia,
  puedeEditar,
  onTareasChange,
  onAbrir,
}: {
  tarea: TareaConProyecto;
  top: number;
  xDe: (fecha: Date) => number;
  pixelsPorDia: number;
  puedeEditar: boolean;
  onTareasChange: ActualizadorTareas;
  onAbrir: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const arrastreRef = useRef<{
    modo: ModoArrastre;
    xInicial: number;
    empiezaEnInicial: Date;
    venceEnInicial: Date;
  } | null>(null);

  const inicio = tarea.empiezaEn
    ? new Date(tarea.empiezaEn)
    : new Date(tarea.venceEn!);
  const fin = tarea.venceEn ? new Date(tarea.venceEn) : inicio;
  const x = xDe(inicio);
  const ancho = Math.max(xDe(fin) - x, 10);

  function aplicarDelta(deltaDias: number, modo: ModoArrastre) {
    onTareasChange((prev) =>
      prev.map((t) => {
        if (t.id !== tarea.id) return t;
        const base = arrastreRef.current;
        const empiezaBase = base ? base.empiezaEnInicial : inicio;
        const venceBase = base ? base.venceEnInicial : fin;
        if (modo === "mover") {
          return {
            ...t,
            empiezaEn: sumarDias(empiezaBase, deltaDias),
            venceEn: sumarDias(venceBase, deltaDias),
          };
        }
        if (modo === "inicio") {
          return { ...t, empiezaEn: sumarDias(empiezaBase, deltaDias) };
        }
        return { ...t, venceEn: sumarDias(venceBase, deltaDias) };
      }),
    );
  }

  function confirmar(deltaDias: number, modo: ModoArrastre) {
    const empiezaAnterior = tarea.empiezaEn ? new Date(tarea.empiezaEn) : null;
    const venceAnterior = tarea.venceEn ? new Date(tarea.venceEn) : null;
    aplicarDelta(deltaDias, modo);
    setError(null);

    const nuevoEmpieza =
      modo === "fin" ? empiezaAnterior : sumarDias(inicio, deltaDias);
    const nuevoVence =
      modo === "inicio" ? venceAnterior : sumarDias(fin, deltaDias);

    cambiarFechasTareaAction(
      tarea.proyectoId,
      tarea.id,
      nuevoEmpieza,
      nuevoVence,
    ).then((res) => {
      if (!res.ok) {
        onTareasChange((prev) =>
          prev.map((t) =>
            t.id === tarea.id
              ? { ...t, empiezaEn: empiezaAnterior, venceEn: venceAnterior }
              : t,
          ),
        );
        setError(res.error ?? "No se pudo cambiar la fecha");
      }
    });
  }

  function iniciarArrastre(modo: ModoArrastre, e: React.PointerEvent) {
    if (!puedeEditar) return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    arrastreRef.current = {
      modo,
      xInicial: e.clientX,
      empiezaEnInicial: inicio,
      venceEnInicial: fin,
    };
  }

  function duranteArrastre(e: React.PointerEvent) {
    const arr = arrastreRef.current;
    if (!arr) return;
    const deltaDias = Math.round((e.clientX - arr.xInicial) / pixelsPorDia);
    aplicarDelta(deltaDias, arr.modo);
  }

  function terminarArrastre(e: React.PointerEvent) {
    const arr = arrastreRef.current;
    if (!arr) return;
    (e.target as Element).releasePointerCapture(e.pointerId);
    const deltaDias = Math.round((e.clientX - arr.xInicial) / pixelsPorDia);
    arrastreRef.current = null;
    if (deltaDias !== 0) confirmar(deltaDias, arr.modo);
  }

  function alTecla(e: React.KeyboardEvent) {
    if (!puedeEditar) return;
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const signo = e.key === "ArrowRight" ? 1 : -1;
    const modo: ModoArrastre = e.altKey
      ? "inicio"
      : e.shiftKey
        ? "fin"
        : "mover";
    confirmar(signo, modo);
  }

  return (
    <div
      role="button"
      tabIndex={puedeEditar ? 0 : -1}
      aria-label={`${tarea.titulo}, ${formatearFechaUTC(inicio)} a ${formatearFechaUTC(fin)}. Flechas para mover, con Alt ajusta el inicio, con Shift el fin.`}
      onKeyDown={alTecla}
      onDoubleClick={onAbrir}
      onPointerDown={(e) => iniciarArrastre("mover", e)}
      onPointerMove={duranteArrastre}
      onPointerUp={terminarArrastre}
      className={cn(
        "absolute flex items-center rounded-md border px-1.5 text-[0.65rem] whitespace-nowrap text-primary-foreground select-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        puedeEditar && "cursor-grab touch-none active:cursor-grabbing",
        error && "border-destructive",
      )}
      style={{
        left: x,
        width: ancho,
        top: top + 4,
        height: ALTURA_FILA - 8,
        backgroundColor: tarea.proyectoColor ?? "var(--color-primary)",
        borderColor: error ? undefined : "transparent",
      }}
    >
      {puedeEditar && (
        <>
          <div
            onPointerDown={(e) => iniciarArrastre("inicio", e)}
            className="absolute inset-y-0 left-0 w-1.5 cursor-ew-resize"
          />
          <div
            onPointerDown={(e) => iniciarArrastre("fin", e)}
            className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize"
          />
        </>
      )}
      <span className="truncate">{tarea.titulo}</span>
      {error && (
        <span className="absolute top-full left-0 z-10 mt-0.5 rounded bg-destructive px-1 py-0.5 text-[0.6rem] text-destructive-foreground">
          {error}
        </span>
      )}
    </div>
  );
}

function MarcadorHito({
  hito,
  x,
  alturaTotal,
  enRiesgo,
}: {
  hito: Hito;
  x: number;
  alturaTotal: number;
  enRiesgo: boolean;
}) {
  const color = enRiesgo
    ? "var(--color-coral-500)"
    : (hito.color ?? "var(--color-ambar-500)");

  return (
    <div
      className="pointer-events-none absolute top-0"
      style={{ left: x, height: alturaTotal }}
      title={`${hito.nombre} — ${formatearFechaUTC(new Date(hito.fecha))}`}
    >
      <div
        className="absolute h-full border-l border-dashed"
        style={{ borderColor: color }}
      />
      <div
        aria-hidden
        className="absolute -top-1 -left-1.5 size-3 rotate-45"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

function FormularioHito({
  proyectos,
  onCreado,
}: {
  proyectos: OpcionProyecto[];
  onCreado: (hito: Hito) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [estado, accion, enviando] = useActionState<EstadoFormulario, FormData>(
    async (previo, formData) => {
      const resultado = await crearHitoAction(previo, formData);
      if (!resultado.error) {
        setAbierto(false);
        // El hito recién creado se ve al instante en este cliente sin
        // esperar la revalidación del servidor — mismo criterio de
        // "sin recargar" que el resto del tablero. onCreado recibe un
        // objeto mínimo; el id real llega con la próxima revalidación.
        onCreado({
          id: -Date.now(),
          proyectoId: Number(formData.get("proyectoId")),
          nombre: String(formData.get("nombre") ?? ""),
          fecha: new Date(String(formData.get("fecha") ?? "")),
          color: String(formData.get("color") ?? "") || null,
        });
      }
      return resultado;
    },
    {},
  );

  if (!abierto) {
    return (
      <Button
        type="button"
        size="xs"
        variant="outline"
        onClick={() => setAbierto(true)}
      >
        + Hito
      </Button>
    );
  }

  return (
    <form action={accion} className="flex items-center gap-1.5">
      <select
        name="proyectoId"
        required
        defaultValue=""
        className="h-8 rounded-md border border-input bg-card px-1.5 text-xs"
      >
        <option value="" disabled>
          Proyecto…
        </option>
        {proyectos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre}
          </option>
        ))}
      </select>
      <input
        name="nombre"
        placeholder="Nombre"
        required
        className="h-8 w-28 rounded-md border border-input bg-card px-1.5 text-xs"
      />
      <input
        type="date"
        name="fecha"
        required
        className="h-8 rounded-md border border-input bg-card px-1.5 text-xs"
      />
      <input
        type="color"
        name="color"
        defaultValue="#f59e0b"
        className="h-8 w-8 rounded-md border border-input p-0.5"
      />
      <Button type="submit" size="xs" variant="secondary" disabled={enviando}>
        Crear
      </Button>
      {estado.error && (
        <span className="text-xs text-destructive">{estado.error}</span>
      )}
    </form>
  );
}

function ListaPorFecha({ tareas }: { tareas: TareaConProyecto[] }) {
  const ordenadas = [...tareas].sort((a, b) => {
    const fa = a.venceEn ? new Date(a.venceEn).getTime() : Infinity;
    const fb = b.venceEn ? new Date(b.venceEn).getTime() : Infinity;
    return fa - fb;
  });

  if (ordenadas.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Nada con fechas todavía.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {ordenadas.map((t) => (
        <li
          key={t.id}
          className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{t.titulo}</p>
            <p className="truncate text-xs text-muted-foreground">
              {t.proyectoNombre}
            </p>
          </div>
          {t.venceEn && (
            <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
              {formatearFechaUTC(new Date(t.venceEn))}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
