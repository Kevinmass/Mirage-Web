"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { PosterHero } from "./poster-hero";

const CanvasHeroDinamico = dynamic(
  () => import("./canvas-hero").then((m) => m.CanvasHero),
  { ssr: false, loading: () => <PosterHero /> },
);

// Decide WebGL o póster y, si es WebGL, si el RAF corre o no. Nunca decide
// el <h1>/la bajada — esos son HTML del servidor, hermanos de este
// componente, no hijos.
//
// Cambio del PR 2 de la ronda de fixes (§1.2): el póster deja de dispararse
// por `hardwareConcurrency <= 4` y por ancho de pantalla — en un notebook
// modesto o en el celular el hero era una imagen fija. El único corte a
// póster ahora es `prefers-reduced-motion`. En móvil se sirve la misma
// escena en versión liviana (menor DPR), no una foto.
export function FondoHero() {
  const [permiteWebgl, setPermiteWebgl] = useState(false);
  const [liviano, setLiviano] = useState(false);
  const [enViewport, setEnViewport] = useState(true);
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mediaReducido = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mediaMovil = window.matchMedia(
      "(max-width: 767px), (pointer: coarse)",
    );

    function evaluar() {
      setPermiteWebgl(!mediaReducido.matches);
      setLiviano(mediaMovil.matches);
    }
    evaluar();
    mediaReducido.addEventListener("change", evaluar);
    mediaMovil.addEventListener("change", evaluar);
    return () => {
      mediaReducido.removeEventListener("change", evaluar);
      mediaMovil.removeEventListener("change", evaluar);
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
        <CanvasHeroDinamico activo={enViewport} liviano={liviano} />
      ) : (
        <PosterHero />
      )}
    </div>
  );
}
