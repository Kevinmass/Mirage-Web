"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { tokenAHex } from "@/lib/color-token";

const SoftAurora = dynamic(() => import("@/components/SoftAurora"), {
  ssr: false,
});

// Fondo animado sutil para dos secciones de la landing (PR 2 de la ronda de
// fixes, paso 4: "dos fondos más, de la misma familia de color, montados
// sobre FondoSeccion"). SoftAurora de React Bits, retiñido arena↔turquesa /
// arena↔ámbar, a bajo brillo y sin interacción con el mouse — más quieto
// que el hero, que ya tiene el prisma girando.
//
// SoftAurora no trae pausa fuera de viewport, así que se monta solo cuando
// la sección está cerca (IntersectionObserver con margen); al salir se
// desmonta y libera el contexto WebGL. Presupuesto §5.2 (revisado en §0.2):
// uno en el hero + hasta dos en el resto de la landing.
export function FondoSeccionAurora({
  tono = "turquesa",
}: {
  tono?: "turquesa" | "ambar";
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
    <div ref={ref} className="absolute inset-0">
      {visible && colores ? (
        <SoftAurora
          color1={colores.c1}
          color2={colores.c2}
          speed={0.4}
          brightness={0.5}
          bandHeight={0.6}
          bandSpread={1.2}
        />
      ) : null}
    </div>
  );
}
