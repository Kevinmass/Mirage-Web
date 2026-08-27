"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { FondoSeccion } from "@/components/fondo-seccion";

const HeroPrismDinamico = dynamic(
  () => import("./hero-prism").then((m) => m.HeroPrism),
  { ssr: false, loading: () => <PosterEstatico /> },
);

function PosterEstatico() {
  return <FondoSeccion tinte="turquesa" className="absolute inset-0" />;
}

// Decide WebGL (Prism) o póster estático. Nunca decide el <h1>/la bajada —
// esos son HTML del servidor, hermanos de este componente, no hijos.
//
// PR 2 de la ronda de fixes:
//  - §1.2: el póster deja de dispararse por `hardwareConcurrency <= 4` y por
//    ancho de pantalla. El único corte a póster ahora es
//    `prefers-reduced-motion`.
//  - El fondo pasa de `canvas-hero.tsx` (ondulación imperceptible, §1.1) a
//    Prism. En móvil se sirve la misma escena en versión liviana, no una
//    foto.
//  - La pausa fuera del viewport la maneja el propio Prism
//    (`suspendWhenOffscreen`); ya no hace falta el IntersectionObserver de
//    acá.
export function FondoHero() {
  const [permiteWebgl, setPermiteWebgl] = useState(false);
  const [liviano, setLiviano] = useState(false);

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

  return (
    <div className="absolute inset-0 overflow-hidden">
      {permiteWebgl ? (
        <HeroPrismDinamico liviano={liviano} />
      ) : (
        <PosterEstatico />
      )}
    </div>
  );
}
