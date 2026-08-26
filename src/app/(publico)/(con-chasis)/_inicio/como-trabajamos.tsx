"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const PASOS = [
  {
    titulo: "Relevamiento",
    descripcion:
      "Entendemos el proceso real antes de escribir una línea de código.",
  },
  {
    titulo: "Diseño",
    descripcion:
      "Arquitectura y alcance definidos antes de empezar a construir.",
  },
  {
    titulo: "Desarrollo",
    descripcion: "Sesiones cortas y seguido, con feedback en cada etapa.",
  },
  {
    titulo: "Operación",
    descripcion: "Seguimos andando después de la entrega: soporte y mejoras.",
  },
];

// Línea de tiempo que se dibuja al scrollear (§8.1.4): la línea
// conectora crece de 0 a 100% y los cuatro pasos entran escalonados, los
// dos disparados por el mismo IntersectionObserver — por eso es un
// componente propio y no una serie de <Revelado> sueltos, que no podrían
// coordinar la línea con los pasos.
export function ComoTrabajamos() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative">
      <div
        className="absolute top-5 left-0 hidden h-px w-full bg-border sm:block"
        aria-hidden
      >
        <div
          className={cn(
            "h-full bg-primary transition-[width] duration-1000 ease-(--ease-suave) motion-reduce:transition-none",
            visible ? "w-full" : "w-0",
          )}
        />
      </div>
      <ol className="relative grid grid-cols-1 gap-8 sm:grid-cols-4">
        {PASOS.map((paso, indice) => (
          <li
            key={paso.titulo}
            style={{ transitionDelay: `${indice * 60}ms` }}
            className={cn(
              "flex flex-col gap-2 opacity-0 transition-opacity duration-(--dur-entrada) motion-reduce:opacity-100",
              visible && "opacity-100",
            )}
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-primary font-mono text-sm text-primary-foreground">
              {indice + 1}
            </span>
            <h3 className="font-heading text-h3 font-semibold">
              {paso.titulo}
            </h3>
            <p className="text-sm text-muted-foreground">{paso.descripcion}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
