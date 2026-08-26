"use client";

import { Mesh, Program, Renderer, Triangle } from "ogl";
import { useEffect, useRef } from "react";

// El único WebGL de toda la plataforma (§5.2 del sistema visual): un
// campo de gradiente arena→turquesa que ondula solo, y una estela de
// calor que sigue al cursor y deforma el campo debajo. No incluye la
// deformación literal de las letras del <h1> sobre una textura del DOM
// (lo que hace "grid-distortion" de React Bits, capturando el DOM a una
// textura) — eso duplica la complejidad para un efecto que es, acá, puro
// fondo decorativo; el título sigue siendo HTML del servidor y nunca
// participa del LCP, que es la obligación dura del PR.
//
// Nunca se importa fuera de un `next/dynamic({ ssr: false })`: este
// archivo asume `window`/WebGL disponibles en el momento de montar.

const VERTEX = /* glsl */ `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// Ruido simplex 2D (Ashima Arts, dominio público / MIT) — es el
// algoritmo estándar para ruido orgánico en GLSL, no una obra creativa:
// se reescribe de memoria en cualquier shader de este tipo.
const RUIDO_SIMPLEX = /* glsl */ `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
      + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uMouseFuerza;
  uniform float uDistorsion;
  uniform vec2 uResolucion;
  uniform vec3 uColorArena;
  uniform vec3 uColorTurquesa;

  ${RUIDO_SIMPLEX}

  void main() {
    vec2 uv = vUv;
    float aspecto = uResolucion.x / uResolucion.y;
    vec2 uvAspecto = vec2(uv.x * aspecto, uv.y);
    vec2 mouseAspecto = vec2(uMouse.x * aspecto, uMouse.y);

    // Estela de calor: un pulso radial alrededor del cursor que empuja
    // las coordenadas de muestreo, atenuado por uDistorsion (se apaga
    // al scrollear) y uMouseFuerza (se apaga si el cursor no se movió).
    float distanciaCursor = distance(uvAspecto, mouseAspecto);
    float calor = exp(-distanciaCursor * 5.0) * uMouseFuerza * uDistorsion;
    vec2 direccion = normalize(uvAspecto - mouseAspecto + 0.0001);
    vec2 uvDeformada = uv + direccion * calor * 0.06;

    // Ondulación ambiente, ciclo lento (~12s) e independiente del cursor.
    float ruidoLento = snoise(uvDeformada * 1.6 + vec2(0.0, uTime * 0.05));
    float ruidoDistorsion = snoise(uvDeformada * 3.0 - vec2(uTime * 0.03, 0.0)) * uDistorsion;

    float mezcla = uvDeformada.y + ruidoLento * 0.18 + ruidoDistorsion * 0.12 + calor * 0.35;
    mezcla = clamp(mezcla, 0.0, 1.0);

    vec3 color = mix(uColorArena, uColorTurquesa, mezcla);
    gl_FragColor = vec4(color, 1.0);
  }
`;

// oklch(0.974 0.01 81.8) (arena-100) y oklch(0.649 0.114 182) (turquesa-500)
// pasados a sRGB lineal aproximado — el shader no puede leer custom
// properties CSS, así que estos dos son los únicos colores literales de
// todo el sistema fuera de globals.css, y es a propósito (comentario
// también en el PR: es la textura del hero, no un componente de UI).
const COLOR_ARENA: [number, number, number] = [0.976, 0.965, 0.937];
const COLOR_TURQUESA: [number, number, number] = [0.078, 0.639, 0.573];

export function CanvasHero({ activo }: { activo: boolean }) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const activoRef = useRef(activo);

  useEffect(() => {
    activoRef.current = activo;
  }, [activo]);

  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!contenedor) return;

    const renderer = new Renderer({ alpha: false, antialias: false, dpr: Math.min(window.devicePixelRatio, 1.5) });
    const gl = renderer.gl;
    contenedor.appendChild(gl.canvas);
    gl.clearColor(1, 1, 1, 1);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: VERTEX,
      fragment: FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: [0.5, 0.35] },
        uMouseFuerza: { value: 0 },
        uDistorsion: { value: 1 },
        uResolucion: { value: [1, 1] },
        uColorArena: { value: COLOR_ARENA },
        uColorTurquesa: { value: COLOR_TURQUESA },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });

    function ajustarTamano() {
      if (!contenedor) return;
      const { clientWidth, clientHeight } = contenedor;
      renderer.setSize(clientWidth, clientHeight);
      program.uniforms.uResolucion.value = [clientWidth, clientHeight];
    }
    ajustarTamano();
    const resizeObserver = new ResizeObserver(ajustarTamano);
    resizeObserver.observe(contenedor);

    let fuerzaCursorObjetivo = 0;
    function alMoverMouse(evento: PointerEvent) {
      const rect = contenedor!.getBoundingClientRect();
      program.uniforms.uMouse.value = [
        (evento.clientX - rect.left) / rect.width,
        1 - (evento.clientY - rect.top) / rect.height,
      ];
      fuerzaCursorObjetivo = 1;
    }
    function alSalirMouse() {
      fuerzaCursorObjetivo = 0;
    }
    contenedor.addEventListener("pointermove", alMoverMouse);
    contenedor.addEventListener("pointerleave", alSalirMouse);

    // La distorsión se apaga al scrollear (§5.2): 0 = tope de la
    // sección, 1 = ya se scrolleó una pantalla completa.
    function alScrollear() {
      const progreso = Math.min(Math.max(window.scrollY / window.innerHeight, 0), 1);
      program.uniforms.uDistorsion.value = 1 - progreso;
    }
    alScrollear();
    window.addEventListener("scroll", alScrollear, { passive: true });

    let idAnimacion: number;
    let ultimoTiempo = performance.now();
    function animar(ahora: number) {
      idAnimacion = requestAnimationFrame(animar);
      if (!activoRef.current) {
        ultimoTiempo = ahora;
        return;
      }
      const delta = (ahora - ultimoTiempo) / 1000;
      ultimoTiempo = ahora;
      program.uniforms.uTime.value += delta;
      // La fuerza del cursor decae sola cuando deja de moverse, en vez
      // de depender de otro listener para "se quedó quieto".
      const fuerzaActual = program.uniforms.uMouseFuerza.value;
      program.uniforms.uMouseFuerza.value +=
        (fuerzaCursorObjetivo - fuerzaActual) * Math.min(delta * 3, 1);
      fuerzaCursorObjetivo *= 0.98;
      renderer.render({ scene: mesh });
    }
    idAnimacion = requestAnimationFrame(animar);

    return () => {
      cancelAnimationFrame(idAnimacion);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", alScrollear);
      contenedor.removeEventListener("pointermove", alMoverMouse);
      contenedor.removeEventListener("pointerleave", alSalirMouse);
      contenedor.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <div ref={contenedorRef} className="absolute inset-0" aria-hidden />;
}
