"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const CAPACIDADES = [
  {
    titulo: "Sistemas a medida",
    descripcion:
      "Software diseñado para el proceso real de tu equipo, no una plantilla genérica que hay que adaptar a los golpes.",
  },
  {
    titulo: "De punta a punta",
    descripcion:
      "Construimos y operamos todo el sistema: desde la base de datos hasta la interfaz que tu equipo usa todos los días.",
  },
  {
    titulo: "Con vos en el tiempo",
    descripcion:
      "No es un proyecto que se entrega y se olvida. Seguimos operando y mejorando lo que construimos.",
  },
];

// "card-swap" de React Bits, reteñido (§6.8) — acá, una pila que rota
// sola cada 5s y se puede agarrar clickeando cualquier carta para
// traerla al frente. No trae la física de arrastre de la librería
// original: agarrar-y-soltar con inercia es browser-only y GSAP, y no
// cambia lo que la sección comunica.
export function Capacidades() {
  const [activa, setActiva] = useState(0);
  const [enPausa, setEnPausa] = useState(false);

  useEffect(() => {
    if (enPausa) return;
    const id = setInterval(() => {
      setActiva((valor) => (valor + 1) % CAPACIDADES.length);
    }, 5000);
    return () => clearInterval(id);
  }, [enPausa]);

  return (
    <div
      className="relative mx-auto h-72 w-full max-w-sm sm:max-w-md"
      onMouseEnter={() => setEnPausa(true)}
      onMouseLeave={() => setEnPausa(false)}
    >
      {CAPACIDADES.map((capacidad, indice) => {
        const desplazamiento =
          (indice - activa + CAPACIDADES.length) % CAPACIDADES.length;
        return (
          <button
            key={capacidad.titulo}
            type="button"
            onClick={() => setActiva(indice)}
            aria-label={`Mostrar "${capacidad.titulo}"`}
            aria-current={desplazamiento === 0}
            style={{
              zIndex: CAPACIDADES.length - desplazamiento,
              transform: `translateY(${desplazamiento * 14}px) scale(${1 - desplazamiento * 0.05})`,
            }}
            className="absolute inset-0 text-left transition-[transform,opacity] duration-(--dur-media) ease-(--ease-suave) motion-reduce:transition-none"
          >
            <Card
              className={cn(
                "h-full justify-center px-2 shadow-lg transition-shadow",
                desplazamiento === 0 ? "shadow-lg" : "shadow-sm",
              )}
            >
              <CardContent className="flex flex-col gap-3">
                <CardTitle className="text-h3 font-heading">
                  {capacidad.titulo}
                </CardTitle>
                <CardDescription className="text-body">
                  {capacidad.descripcion}
                </CardDescription>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
