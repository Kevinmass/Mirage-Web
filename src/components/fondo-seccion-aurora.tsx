"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { tokenAHex } from "@/lib/color-token";
import { cn } from "@/lib/utils";

const SoftAurora = dynamic(() => import("@/components/SoftAurora"), {
  ssr: false,
});

// Fondo animado sutil para la landing (PR 2 de la ronda de fixes).
// SoftAurora de React Bits, retiñido arena↔turquesa / arena↔ámbar, a bajo
// brillo y sin interacción con el mouse — más quieto que el hero, que ya
// tiene el prisma girando.
//
// SoftAurora no trae pausa fuera de viewport, así que se monta solo cuando
// entra al viewport (IntersectionObserver con margen); al salir se desmonta
// y libera el contexto WebGL. Presupuesto §5.2 (revisado en §0.2): uno en
// el hero + hasta dos en el resto de la landing.
//
// `className` reemplaza el `absolute inset-0` por defecto: en el tramo
// continuo de la landing las instancias se posicionan para sangrar entre
// secciones (ej. `absolute inset-x-0 top-0 h-[65%]`) y que no se note el
// borde de cada sección.
export function FondoSeccionAurora({
  tono = "turquesa",
  className = "absolute inset-0",
}: {
  tono?: "turquesa" | "ambar";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [colores, setColores] = useState<{ c1: string; c2: string } | null>(
    null,
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entrada]) => {
        setVisible(entrada.isIntersecting);
        if (entrada.isIntersecting) {
          setColores((prev) =>
            prev
              ? prev
              : {
                  c1: tokenAHex("--arena-50"),
                  c2: tokenAHex(
                    tono === "ambar" ? "--ambar-500" : "--turquesa-500",
                  ),
                },
          );
        }
      },
      // Margen chico a propósito: con tres secciones animadas en la landing
      // (Qué hacemos / Cómo trabajamos / Casos) esto acota cuántos contextos
      // WebGL pueden estar montados a la vez — en la práctica, dos.
      { rootMargin: "120px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [tono]);

  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      {visible && colores ? (
        <SoftAurora
          color1={colores.c1}
          color2={colores.c2}
          speed={0.35}
          brightness={0.42}
          bandHeight={0.6}
          bandSpread={1.3}
        />
      ) : null}
    </div>
  );
}
