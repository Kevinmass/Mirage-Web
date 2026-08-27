"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Revelado al scrollear (§5.3): IntersectionObserver, una sola vez —
// nunca reversible, no se reanima al volver a pasar por acá al subir. El
// escalonado de 60ms entre hermanos lo pone quien usa el componente vía
// `indice` (máximo 6, el propio §5.3 lo limita).
//
// El disparo NO depende de la altura del elemento: `threshold: 0` (con que
// asome un pixel alcanza) + `rootMargin` inferior negativo, para que el
// revelado ocurra un poco después de entrar. Con `threshold: 0.2`, una
// sección más alta que ~5 viewports nunca llegaba a ese ratio y se quedaba
// en opacity-0 para siempre (§3 del plan de fixes).
export function Revelado({
  children,
  indice = 0,
  className,
}: {
  children: React.ReactNode;
  indice?: number;
  className?: string;
}) {
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
      { threshold: 0, rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${Math.min(indice, 5) * 60}ms` }}
      className={cn(
        "opacity-0 translate-y-4 transition-[opacity,transform] duration-(--dur-entrada) ease-(--ease-salida) motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0",
        visible && "opacity-100 translate-y-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
