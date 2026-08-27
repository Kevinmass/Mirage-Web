# Bitácora — PR 2 (`fix-02-fondos-react-bits`)

React Bits de verdad: hero y fondos. Rama sacada de `fix-01-base-visual`
(PR 1 en review). PR contra `staging`.

> **Estado**: el fondo del hero ya está elegido y cableado (Prism, elegido
> por Kevin en `/dev/hero`), los dos fondos de sección animados están, y el
> bug de "todas las secciones se ven igual" está arreglado. Falta: medición
> Lighthouse/LCP en producción y la reescritura de la documentación
> normativa (§5.2/§6.8/`CLAUDE.md`). Ver §7.

---

## 1. Qué se hizo (contra el §3, PR 2)

**Paso 1 — instalar candidatos.** ✅
- Install: `npx shadcn@latest add https://reactbits.dev/r/<Nombre>-TS-TW.json`
  → copia a `src/components/<Nombre>.tsx`. `components.json` → `registries`
  vacío; alcanza la URL completa.
- Instalados: `DarkVeil`, `Prism`, `LightRays`, `SoftAurora`.
- **`silk` descartado**: arrastra `three` + `@react-three/fiber` (~150 KB gz),
  contra el presupuesto. Los otros usan `ogl`, ya en `package.json` → cero
  peso nuevo.
- Ajustes al código vendido: `"use client"` a los cuatro; en `SoftAurora`
  un `prefer-const` con `--fix` y otro con `eslint-disable` comentado.

**Paso 2 — elegir el fondo del hero.** ✅
- Se armó `/dev/hero` (harness dev-only) para comparar en vivo. Kevin
  eligió **Prism**, modo `rotate`, con el matiz rotando solo.

**Paso 3 — retiñir a la paleta.** ✅ (con matiz)
- `src/lib/color-token.ts` resuelve tokens CSS a `#rrggbb` vía canvas 2D.
- `Prism` **no toma colores**, solo rota el matiz de su paleta procedural
  (`hueShift` fija el arranque, `colorFrequency` la variación). Como el hero
  cicla el matiz a propósito, no hay literales que reteñir en el hero.
- `FondoSeccionAurora` (secciones) sí: `color1`/`color2` = arena-50 ↔
  turquesa-500 / ámbar-500, resueltos de tokens.

**Paso 4 — capa animada en `FondoSeccion` + dos fondos de sección.** ✅
- `FondoSeccion` acepta `children` (capa animada sobre la banda quieta,
  oculta bajo `prefers-reduced-motion`).
- `FondoSeccionAurora`: `SoftAurora` retiñido, bajo brillo, sin mouse.
  Auto-gateado con `IntersectionObserver` (`rootMargin: 200px`) porque
  SoftAurora no trae pausa propia — al salir del viewport se desmonta y
  libera el contexto WebGL.
- En `(con-chasis)/page.tsx`: "Qué hacemos" (turquesa) y "Casos" (ámbar)
  con aurora; "Cómo trabajamos" pasa de turquesa a neutro para no repetir
  la banda de arriba.

**Paso 5 — gate a póster.** ✅
`fondo-hero.tsx`:
- Fuera los gates `hardwareConcurrency <= 4` y `min-width: 768px` (§1.2).
- Único corte a póster: `prefers-reduced-motion`.
- Móvil (`max-width: 767px` o `pointer: coarse`) → Prism en versión liviana
  (menos glow/bloom/noise, escala menor).
- Pausa fuera de viewport: ahora la hace Prism (`suspendWhenOffscreen`); se
  sacó el `IntersectionObserver` a mano.
- Póster de `loading` del `next/dynamic` = `<FondoSeccion tinte="turquesa">`.

**Paso 6 — borrar `canvas-hero.tsx` / `poster-hero.tsx`.** ✅
Prism los reemplaza. El harness pierde la opción "canvas-hero (actual)".

**Paso 7 — medir.** 🟡 Pendiente.
- `ogl` ya pesa ~21 KB (encoded) en el bundle → los candidatos no agregan
  dependencia.
- Falta `pnpm build && pnpm start` + Lighthouse (LCP ≤ 2.5 s, JS inicial
  ≤ 180 KB sin el shader, no empeorar el LCP +200 ms) y una pasada en
  Render free. El `pnpm build` de Next 16 + Turbopack no imprime "First
  Load JS" y `next dev` mezcla chunks de devtools, así que no es medible
  desde esta sesión.

**Paso 8 — documentación (§5.2, §6.8, `CLAUDE.md` según §0.2).** ⛔ Pendiente.
Reescribir "un solo WebGL" → "presupuesto por página (1 hero + 2 landing,
0 en `/app` y `/portal`)" e "inventario cerrado" → "inventario abierto para
la landing", con el motivo escrito. Se hace junto con el cierre del PR.

---

## 2. Decisiones que tomé yo

- **`silk` afuera por peso.** La terna efectiva fue `dark-veil` vs `prism`,
  con `light-rays` / `soft-aurora` de alternativa — todos ogl.
- **Prism en `rotate` con matiz que cicla** (pedido de Kevin explícito).
  `rotate` no reacciona al cursor — se acepta; el prisma girando + el matiz
  rotando ya cumplen "se mueve solo". Ciclo de matiz: **10 s** por vuelta
  completa (`hueShiftSpeed = 2π/10` rad/s).
- **`hueShiftSpeed` como adaptación a `Prism.tsx`** (§6.8), no un wrapper:
  el prop `hueShift` de Prism re-monta todo el WebGL al cambiar, así que
  animarlo desde afuera era inviable. La adaptación mueve el uniform
  `uHueShift` dentro del loop de render. Comentada como tal.
- **Fondos de sección con `SoftAurora`, no Prism**: el prisma girando es
  mucho para una banda de contenido; SoftAurora es una cortina calma.
- **Auto-gate por `IntersectionObserver` en `FondoSeccionAurora`**:
  SoftAurora no tiene `suspendWhenOffscreen`. Sin esto habría 3 contextos
  WebGL corriendo siempre en la landing.
- **Tintes de `FondoSeccion` subidos** (claro 9→16 %, oscuro 8-10→22-24 %):
  al valor anterior las tres bandas se leían iguales, sobre todo en oscuro
  (feedback de Kevin sobre la captura).
- **"Cómo trabajamos" pasa de turquesa a neutro**: quedaba pegado a la
  banda turquesa animada de "Qué hacemos".

---

## 3. El harness `/dev/hero` (se conserva)

Dev-only (`notFound()` en producción). Selector Prism / LightRays /
SoftAurora / DarkVeil, uno por vez a pantalla completa, con el `<h1>` real
encima, slider `hueShift`, selector de modo para Prism, ficha por candidato.
Prism ya trae el `hueShiftSpeed` de 10 s. Se deja para re-comparar o tunear
los otros fondos.

---

## 4. Archivos tocados

**Candidatos vendidos (nuevos)**: `src/components/{DarkVeil,Prism,LightRays,
SoftAurora}.tsx` (React Bits, ogl, `"use client"`). `Prism.tsx` además con
la adaptación `hueShiftSpeed`.

**Hero**
- `src/components/espejismo-hero/hero-prism.tsx` (nuevo) — wrapper del hero.
- `src/components/espejismo-hero/fondo-hero.tsx` — monta HeroPrism, saca
  gates de CPU/ancho y el IntersectionObserver.
- `src/components/espejismo-hero/canvas-hero.tsx`, `poster-hero.tsx`
  (borrados).

**Fondos de sección**
- `src/components/fondo-seccion.tsx` — `children` como capa animada opcional.
- `src/components/fondo-seccion-aurora.tsx` (nuevo) — SoftAurora auto-gateado.
- `src/app/globals.css` — tintes `--tinte-*` subidos, claro y oscuro.
- `src/app/(publico)/(con-chasis)/page.tsx` — aurora en dos secciones,
  "Cómo trabajamos" a neutro.

**Harness**
- `src/app/dev/hero/{page,comparador-hero}.tsx`, `src/lib/color-token.ts`
  (nuevos, del commit anterior) — `comparador-hero.tsx` pierde la opción
  canvas-hero.

---

## 5. Qué verifiqué y cómo

- `pnpm lint` / `pnpm typecheck` / `pnpm test` (24 archivos, 190) /
  `pnpm build` → todo en verde. `/dev/hero` y `/` compilan.
- Navegador (dev server, sin compositing — sin screenshots, el
  `IntersectionObserver` no tickea):
  - `/`: monta **1 `<canvas>`** cuyo árbol de padres es
    `canvas → div.w-full h-full relative (Prism) → div.absolute inset-0
    (HeroPrism) → div (FondoHero) → section` — o sea, Prism es el fondo del
    hero. `<h1>` en Bricolage.
  - **Tintes de sección en oscuro ahora distintos**: `--background` L≈0.19;
    `--tinte-turquesa` oklch(L 0.293, hue 182), `--tinte-ambar`
    oklch(L 0.292, hue 71), `--tinte-neutro` oklch(L 0.300, ~gris). ΔL ≈
    0.10 con el fondo y turquesa/ámbar separados por matiz.
  - Las dos `FondoSeccionAurora` montan su wrapper; el `<SoftAurora>` en sí
    no llega a montar acá porque su `IntersectionObserver` no dispara en
    este entorno — en el navegador real de Kevin sí.
  - Sin errores de consola de los componentes (solo ruido de HMR).
- **No verificado desde acá** (necesita navegador real / Kevin): que Prism
  se vea bien y el ciclo de matiz de 10 s sea agradable y no "modo fiesta";
  que las auroras de sección monten al scrollear y se vean sutiles; LCP y
  peso de JS en producción.

---

## 6. Dudas y sospechas

- **El ciclo de matiz de Prism recorre todo el espectro** (rojo→verde→azul→
  violeta) cada 10 s. Es lo que pidió Kevin ("el hue shift transicione cada
  10 s aprox"). Si en pantalla se ve demasiado "arcoíris" para "Espejismo
  cálido", hay dos ajustes de una línea en `hero-prism.tsx`: subir
  `CICLO_SEGUNDOS` (más lento) o cambiar `hueShiftSpeed` por una oscilación
  senoidal acotada a un rango cálido en `Prism.tsx`.
- **Prism cachea `dpr = min(2, devicePixelRatio)`** y no lo expone. La
  versión `liviano` de móvil baja el costo del fragment shader
  (glow/bloom/noise/scale) pero no la resolución. Si en un celular real va
  con lag, hay que exponer `dpr` en `Prism.tsx`.
- **Prism en `rotate` no reacciona al cursor** (criterio b del plan). Kevin
  lo eligió así a propósito.
- **`FondoSeccionAurora` monta/desmonta con `rootMargin: 200px`**: si al
  scrollear rápido se ve el "encendido" del shader, subir el margen o
  mantenerlo montado y solo pausar (SoftAurora no lo permite hoy).
- **3 contextos WebGL en la landing** (hero + 2 auroras) es el tope del
  presupuesto revisado (§0.2). En un celular de gama baja hay que medirlo.

---

## 7. Deuda que dejo (cierre del PR)

1. **Kevin**: sign-off visual de Prism (color / ciclo de matiz) y de las
   auroras de sección, en su navegador. Si el matiz molesta, ajuste de una
   línea (ver §6).
2. **Medición (paso 7)**: `pnpm build && pnpm start` + Lighthouse local +
   Render free. Números antes/después acá. Confirmar que `/app` y `/portal`
   no cargan un byte de WebGL (pestaña Network).
3. **Documentación (paso 8)**: reescribir §5.2 y §6.8 del sistema visual y
   las líneas de `CLAUDE.md` según la tabla del §0.2, con el motivo escrito.
4. Revisar en 390 px que las auroras de sección no metan scroll horizontal
   ni tapen texto.
