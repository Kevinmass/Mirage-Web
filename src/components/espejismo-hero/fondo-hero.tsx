"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { PosterHero } from "./poster-hero";

const CanvasHeroDinamico = dynamic(
  () => import("./canvas-hero").then((m) => m.CanvasHero),
  { ssr: false, loading: () => <PosterHero /> },
);

// Decide WebGL o póster (§5.2, obligaciones técnicas del PR 3) y, si es
// WebGL, si el RAF corre o no. Nunca decide el <h1>/la bajada — esos son
// HTML del servidor, hermanos de este componente, no hijos.
export function FondoHero() {
  const [permiteWebgl, setPermiteWebgl] = useState(false);
  const [enViewport, setEnViewport] = useState(true);
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mediaReducido = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mediaAngosto = window.matchMedia("(min-width: 768px)");
    const pocosNucleos = (navigator.hardwareConcurrency ?? 8) <= 4;

    function evaluar() {
      setPermiteWebgl(
        !mediaReducido.matches && mediaAngosto.matches && !pocosNucleos,
      );
    }
    evaluar();
    mediaReducido.addEventListener("change", evaluar);
    mediaAngosto.addEventListener("change", evaluar);
    return () => {
      mediaReducido.removeEventListener("change", evaluar);
      mediaAngosto.removeEventListener("change", evaluar);
    };
  }, []);

  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!contenedor || !permiteWebgl) return;

    const interseccion = { current: true };
    function recalcular() {
      setEnViewport(
        interseccion.current && document.visibilityState === "visible",
      );
    }

    const observer = new IntersectionObserver(([entrada]) => {
      interseccion.current = entrada.isIntersecting;
      recalcular();
    });
    observer.observe(contenedor);
    document.addEventListener("visibilitychange", recalcular);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", recalcular);
    };
  }, [permiteWebgl]);

  return (
    <div ref={contenedorRef} className="absolute inset-0 overflow-hidden">
      {permiteWebgl ? (
        <CanvasHeroDinamico activo={enViewport} />
      ) : (
        <PosterHero />
      )}
    </div>
  );
}
