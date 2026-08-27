"use client";

import { useState, useSyncExternalStore } from "react";
import DarkVeil from "@/components/DarkVeil";
import LightRays from "@/components/LightRays";
import Prism from "@/components/Prism";
import SoftAurora from "@/components/SoftAurora";
import { CanvasHero } from "@/components/espejismo-hero/canvas-hero";
import { tokenAHex } from "@/lib/color-token";

// Harness de comparación para el PR 2 de la ronda de fixes (paso 2): elegir
// el fondo del hero mirándolo en vivo, no de memoria. Dev-only. Monta un
// candidato por vez (un contexto WebGL a la vez), con el <h1>/bajada reales
// encima para juzgar legibilidad, y una ficha de qué hace cada uno.
//
// Los colores salen de los tokens de globals.css vía tokenAHex(): el harness
// no tiene un color literal. Prism y DarkVeil no aceptan color, solo rotan
// el matiz — para esos hay un slider de hueShift.

type Id = "canvas-hero" | "prism" | "light-rays" | "soft-aurora" | "dark-veil";

const FICHAS: Record<
  Id,
  { nombre: string; dep: string; solo: string; mouse: string; lee: string }
> = {
  "canvas-hero": {
    nombre: "canvas-hero (actual)",
    dep: "ogl (ya instalado)",
    solo: "Ondulación ambiente lenta, hoy imperceptible (§1.1)",
    mouse: "Estela de calor que sigue y deforma el campo",
    lee: "Degradé arena→turquesa que ondula; sin capas ni refracción",
  },
  prism: {
    nombre: "Prism",
    dep: "ogl (ya instalado)",
    solo: "Sí — haces refractados girando (animationType 'rotate')",
    mouse: "Solo en modo 'hover' / '3drotate' (abajo se cambia)",
    lee: "Prisma que dobla la luz en haces de color — literal 'refracción'",
  },
  "light-rays": {
    nombre: "LightRays",
    dep: "ogl (ya instalado)",
    solo: "Sí — rayos que laten y barren desde el borde superior",
    mouse: "followMouse: los rayos se inclinan hacia el cursor",
    lee: "Luz volumétrica / god-rays; menos 'aire caliente', más 'foco'",
  },
  "soft-aurora": {
    nombre: "SoftAurora",
    dep: "ogl (ya instalado)",
    solo: "Sí — bandas de aurora que se desplazan y respiran",
    mouse: "enableMouseInteraction: la banda se curva hacia el cursor",
    lee: "Cortina suave arena↔turquesa; cercano al brief, más frío",
  },
  "dark-veil": {
    nombre: "DarkVeil",
    dep: "ogl (ya instalado)",
    solo: "Sí — velo CPPN que se deforma solo",
    mouse: "No reacciona al cursor",
    lee: "Oscuro y psicodélico; pelea con el arena claro — referencia",
  },
};

const ORDEN: Id[] = [
  "prism",
  "light-rays",
  "soft-aurora",
  "canvas-hero",
  "dark-veil",
];

type Colores = {
  turquesa400: string;
  turquesa500: string;
  turquesa700: string;
  ambar500: string;
  arena50: string;
};

// Los tokens no cambian una vez montado, así que se resuelven una vez y se
// cachean a nivel de módulo. useSyncExternalStore es la forma sancionada de
// leer un valor solo-cliente sin setState en un efecto ni desajuste de
// hidratación (server devuelve null → se rendea sin fondo hasta el mount).
let cacheColores: Colores | null = null;
function leerColores(): Colores | null {
  if (typeof window === "undefined") return null;
  if (!cacheColores) {
    cacheColores = {
      turquesa400: tokenAHex("--turquesa-400"),
      turquesa500: tokenAHex("--turquesa-500"),
      turquesa700: tokenAHex("--turquesa-700"),
      ambar500: tokenAHex("--ambar-500"),
      arena50: tokenAHex("--arena-50"),
    };
  }
  return cacheColores;
}

function useColoresPaleta(): Colores | null {
  return useSyncExternalStore(
    () => () => {},
    leerColores,
    () => null,
  );
}

export function ComparadorHero() {
  const [id, setId] = useState<Id>("prism");
  const [hueShift, setHueShift] = useState(-135);
  const [prismMode, setPrismMode] = useState<"rotate" | "hover" | "3drotate">(
    "rotate",
  );
  const colores = useColoresPaleta();

  const ficha = FICHAS[id];

  return (
    <div className="relative min-h-screen">
      {/* Capa de fondo — un candidato por vez, a pantalla completa. */}
      <div className="fixed inset-0 -z-10" aria-hidden>
        {colores && id === "prism" && (
          <Prism
            animationType={prismMode}
            hueShift={hueShift}
            colorFrequency={1}
            glow={0.6}
            bloom={0.8}
            noise={0.3}
            scale={3.6}
            timeScale={0.5}
            hoverStrength={1.5}
            suspendWhenOffscreen
          />
        )}
        {colores && id === "light-rays" && (
          <LightRays
            raysOrigin="top-center"
            raysColor={colores.turquesa400}
            raysSpeed={0.8}
            lightSpread={0.85}
            rayLength={1.3}
            pulsating={false}
            fadeDistance={1.1}
            saturation={0.7}
            followMouse
            mouseInfluence={0.15}
            noiseAmount={0.08}
            distortion={0.03}
          />
        )}
        {colores && id === "soft-aurora" && (
          <SoftAurora
            color1={colores.arena50}
            color2={colores.turquesa500}
            speed={0.6}
            brightness={1}
            bandHeight={0.5}
            enableMouseInteraction
            mouseInfluence={0.2}
          />
        )}
        {colores && id === "dark-veil" && (
          <DarkVeil
            hueShift={hueShift}
            noiseIntensity={0.02}
            scanlineIntensity={0}
            speed={0.5}
            warpAmount={2}
          />
        )}
        {id === "canvas-hero" && <CanvasHero activo />}
      </div>

      {/* El hero real encima, para juzgar contraste y legibilidad. */}
      <section className="relative flex min-h-screen items-center overflow-hidden">
        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-start gap-6 px-6 py-32">
          <h1 className="text-hero font-heading font-extrabold tracking-[-0.03em] text-crema-100 drop-shadow-sm">
            Mirage
          </h1>
          <p className="max-w-xl text-lead text-crema-100/90 drop-shadow-sm">
            Desarrollamos software a medida: sistemas específicos para las
            necesidades de cada cliente, no productos estándar.
          </p>
        </div>
      </section>

      {/* Controles + ficha. */}
      <div className="fixed top-4 left-1/2 z-20 w-[min(92vw,44rem)] -translate-x-1/2 rounded-lg border border-border bg-popover/95 p-4 text-popover-foreground shadow-lg backdrop-blur">
        <div className="flex flex-wrap gap-2">
          {ORDEN.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setId(k)}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                id === k
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input hover:bg-secondary"
              }`}
            >
              {FICHAS[k].nombre}
            </button>
          ))}
        </div>

        {(id === "prism" || id === "dark-veil") && (
          <label className="mt-3 flex items-center gap-3 text-sm">
            <span className="w-24 shrink-0 text-muted-foreground">
              hueShift {hueShift}°
            </span>
            <input
              type="range"
              min={-180}
              max={180}
              value={hueShift}
              onChange={(e) => setHueShift(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </label>
        )}

        {id === "prism" && (
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="w-24 shrink-0 text-muted-foreground">modo</span>
            {(["rotate", "hover", "3drotate"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPrismMode(m)}
                className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                  prismMode === m
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input hover:bg-secondary"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        )}

        <dl className="mt-3 grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-muted-foreground">dependencia</dt>
          <dd>{ficha.dep}</dd>
          <dt className="text-muted-foreground">se mueve solo</dt>
          <dd>{ficha.solo}</dd>
          <dt className="text-muted-foreground">reacciona al mouse</dt>
          <dd>{ficha.mouse}</dd>
          <dt className="text-muted-foreground">cómo se lee</dt>
          <dd>{ficha.lee}</dd>
        </dl>
      </div>
    </div>
  );
}
