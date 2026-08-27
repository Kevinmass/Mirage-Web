"use client";

import Prism from "@/components/Prism";

// El fondo del hero de `/` — PR 2 de la ronda de fixes. Reemplaza a
// `canvas-hero.tsx` (§1.1: la ondulación ambiente del shader anterior era
// imperceptible). Prism de React Bits: un prisma que gira solo y refracta
// la luz en haces de color — la lectura literal de "aire caliente que
// dobla la luz". Base `ogl`, ya en el repo.
//
// Modo `rotate` (elegido en /dev/hero): el prisma gira sobre su eje, sin
// reaccionar al cursor. El matiz rota solo (`hueShiftSpeed`), un ciclo
// completo cada ~10 s, para que el fondo "transicione" y no se lea estático
// en una captura.
//
// Prism no toma colores, solo rota el matiz de su paleta procedural: por
// eso no hay literales que reteñir acá. `hueShift` fija el punto de
// arranque (turquesa), `colorFrequency` cuánta variación de color hay.

const CICLO_SEGUNDOS = 10;
const HUE_SPEED = (2 * Math.PI) / CICLO_SEGUNDOS;

export function HeroPrism({ liviano = false }: { liviano?: boolean }) {
  return (
    <div className="absolute inset-0" aria-hidden>
      <Prism
        animationType="rotate"
        timeScale={0.4}
        hueShift={2}
        hueShiftSpeed={HUE_SPEED}
        colorFrequency={1}
        noise={liviano ? 0.15 : 0.4}
        glow={liviano ? 0.45 : 0.7}
        bloom={liviano ? 0.5 : 0.9}
        scale={liviano ? 3 : 3.4}
        suspendWhenOffscreen
      />
    </div>
  );
}
