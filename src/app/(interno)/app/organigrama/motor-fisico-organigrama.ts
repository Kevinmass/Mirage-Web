// Motor de la física de resorte del organigrama (diseño §8.7, PR 8),
// deliberadamente FUERA del componente: el linter de React Compiler
// (react-hooks/purity, react-hooks/refs) exige que el cuerpo de un
// componente u hook sea puro — no leer/escribir refs durante el render,
// y no pasarle un ref a una función porque podría leerlo ahí mismo.
// Reglas correctas para JSX, pero que no aplican a un motor imperativo
// con su propio loop de rAF. Por eso el motor no recibe refs: guarda su
// propio estado mutable (nada de React) y el componente se lo actualiza
// desde un `useLayoutEffect` — nunca desde el cuerpo del render — vía
// `actualizarContexto`. Los resultados salen por `onActualizar`, un
// setState normal, que es la única superficie que React necesita ver.
import { RESORTE } from "@/lib/movimiento";
import type { PosicionNodo } from "@/kernel/organigrama/layout-radial";

interface Vector {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface PosicionVisible {
  x: number;
  y: number;
}

export interface ContextoMotor {
  layout: Map<number, PosicionNodo>;
  radioDe: (id: number) => number;
  reducido: boolean;
}

export interface MotorFisico {
  actualizarContexto(contexto: ContextoMotor): void;
  onPointerDown(
    id: number,
    svg: SVGSVGElement,
    clientX: number,
    clientY: number,
  ): void;
  onPointerMove(
    id: number,
    svg: SVGSVGElement,
    clientX: number,
    clientY: number,
  ): void;
  onPointerUp(id: number): void;
  detener(): void;
}

function puntoSvg(svg: SVGSVGElement, clientX: number, clientY: number) {
  const punto = svg.createSVGPoint();
  punto.x = clientX;
  punto.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const transformado = punto.matrixTransform(ctm.inverse());
  return { x: transformado.x, y: transformado.y };
}

export function crearMotorFisico(
  onActualizar: (posiciones: Map<number, PosicionVisible>) => void,
): MotorFisico {
  let contexto: ContextoMotor = {
    layout: new Map(),
    radioDe: () => 9,
    reducido: false,
  };
  const offsets = new Map<number, Vector>();
  let arrastrandoId: number | null = null;
  let ultimoTiempo = 0;
  let rafId: number | null = null;

  function offsetDe(id: number): Vector {
    let o = offsets.get(id);
    if (!o) {
      o = { x: 0, y: 0, vx: 0, vy: 0 };
      offsets.set(id, o);
    }
    return o;
  }

  function emitir() {
    const posiciones = new Map<number, PosicionVisible>();
    for (const [id, pos] of contexto.layout) {
      const o = offsets.get(id);
      posiciones.set(id, {
        x: pos.x + (o?.x ?? 0),
        y: pos.y + (o?.y ?? 0),
      });
    }
    onActualizar(posiciones);
  }

  function tick(ahora: number) {
    const dt = Math.min((ahora - ultimoTiempo) / 1000, 1 / 30);
    ultimoTiempo = ahora;
    const { layout, radioDe } = contexto;
    let algoActivo = arrastrandoId !== null;

    for (const [id, pos] of layout) {
      if (id === arrastrandoId) continue;
      const o = offsetDe(id);

      let objetivoX = 0;
      let objetivoY = 0;
      if (arrastrandoId !== null) {
        const posArrastrado = layout.get(arrastrandoId);
        const oArrastrado = offsetDe(arrastrandoId);
        if (posArrastrado) {
          const dx = pos.x + o.x - (posArrastrado.x + oArrastrado.x);
          const dy = pos.y + o.y - (posArrastrado.y + oArrastrado.y);
          const distancia = Math.hypot(dx, dy) || 0.001;
          const radioSuma = radioDe(id) + radioDe(arrastrandoId) + 6;
          if (distancia < radioSuma) {
            const empuje = radioSuma - distancia;
            objetivoX = o.x + (dx / distancia) * empuje;
            objetivoY = o.y + (dy / distancia) * empuje;
          }
        }
      }

      const { stiffness, damping } = RESORTE;
      const ax = stiffness * (objetivoX - o.x) - damping * o.vx;
      const ay = stiffness * (objetivoY - o.y) - damping * o.vy;
      o.vx += ax * dt;
      o.vy += ay * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;

      if (
        Math.abs(o.x) > 0.05 ||
        Math.abs(o.y) > 0.05 ||
        Math.abs(o.vx) > 0.05 ||
        Math.abs(o.vy) > 0.05
      ) {
        algoActivo = true;
      } else {
        o.x = 0;
        o.y = 0;
        o.vx = 0;
        o.vy = 0;
      }
    }

    emitir();
    rafId = algoActivo ? requestAnimationFrame(tick) : null;
  }

  function iniciarLoop() {
    if (rafId !== null) return;
    ultimoTiempo = performance.now();
    rafId = requestAnimationFrame(tick);
  }

  return {
    actualizarContexto(nuevoContexto) {
      contexto = nuevoContexto;
    },
    onPointerDown(id, svg, clientX, clientY) {
      arrastrandoId = id;
      const pos = contexto.layout.get(id);
      const punto = puntoSvg(svg, clientX, clientY);
      const o = offsetDe(id);
      if (pos) {
        o.x = punto.x - pos.x;
        o.y = punto.y - pos.y;
      }
      o.vx = 0;
      o.vy = 0;
      if (!contexto.reducido) {
        iniciarLoop();
      } else {
        emitir();
      }
    },
    onPointerMove(id, svg, clientX, clientY) {
      if (arrastrandoId !== id) return;
      const pos = contexto.layout.get(id);
      if (!pos) return;
      const punto = puntoSvg(svg, clientX, clientY);
      const o = offsetDe(id);
      o.x = punto.x - pos.x;
      o.y = punto.y - pos.y;
      if (contexto.reducido) emitir();
    },
    onPointerUp(id) {
      if (arrastrandoId !== id) return;
      arrastrandoId = null;
      if (contexto.reducido) {
        // "Los nodos saltan a su posición sin resorte" — instantáneo,
        // ni siquiera para volver de un empujón propio.
        const o = offsetDe(id);
        o.x = 0;
        o.y = 0;
        o.vx = 0;
        o.vy = 0;
        emitir();
      } else {
        iniciarLoop();
      }
    },
    detener() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
    },
  };
}
