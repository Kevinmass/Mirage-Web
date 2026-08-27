# Bitácora — PR 2 (`fix-02-fondos-react-bits`)

React Bits de verdad: hero y fondos. Rama sacada de `fix-01-base-visual`
(cadena 1→2→3). PR contra `staging`.

> El PR creció más allá del §3/PR 2 original ("hero + dos fondos de
> sección") porque la revisión visual con Kevin fue pidiendo más: fondo
> continuo para toda la landing, break de vidrio, y el rework de la sección
> "Qué hacemos" (que es §1 del PR 3, adelantado). Todo eso está acá.

---

## 1. Qué se hizo (contra el §3, PR 2)

**Paso 1 — instalar candidatos.** ✅
`npx shadcn@latest add https://reactbits.dev/r/<Nombre>-TS-TW.json` → copia a
`src/components/<Nombre>.tsx`. Instalados: `DarkVeil`, `Prism`, `LightRays`,
`SoftAurora`. **`silk` descartado**: arrastra `three` + `@react-three/fiber`
(~150 KB gz). Los otros usan `ogl`, ya en `package.json` → cero peso nuevo.
Ajustes al código vendido: `"use client"` a los cuatro; en `SoftAurora` un
`prefer-const` con `--fix` y otro con `eslint-disable` comentado. En `Prism`,
adaptación `hueShiftSpeed` (§6.8) — ver paso 2.

**Paso 2 — elegir el fondo del hero.** ✅
Harness `/dev/hero` (dev-only) para comparar en vivo. Kevin eligió **Prism**,
modo `rotate`, con el matiz rotando solo. `Prism.tsx` no anima `hueShift`
(cambiarlo re-monta el WebGL entero), así que se le agregó `hueShiftSpeed`
(rad/s) que mueve el uniform `uHueShift` dentro del loop de render. El hero
usa `2π/10` → un ciclo de matiz cada ~10 s.

**Paso 3 — retiñir a la paleta.** ✅
`src/lib/color-token.ts` resuelve tokens CSS a `#rrggbb` vía canvas 2D
(`getComputedStyle` devuelve `lab()` en Chrome). `SoftAurora` toma
`color1`/`color2` de tokens (`--arena-50` ↔ `--turquesa-500` / `--ambar-500`).
`Prism` no toma colores (rota el matiz de su paleta procedural); sus literales
del shader son la excepción permitida a "cero color literal".

**Paso 4 — capa animada en `FondoSeccion` + fondos de sección.** ✅ (y más)
- `FondoSeccion` acepta `children` (capa animada sobre la banda quieta) y suma
  dos resplandores radiales de esquina para no leerse vacía.
- `FondoSeccionAurora`: `SoftAurora` retiñido, bajo brillo, sin mouse,
  auto-gateado por `IntersectionObserver` (se desmonta fuera de viewport).
  Prop `className` para posicionarlo y que sangre entre secciones.
- `FondoContinuo` (nuevo): **una** capa que abarca las cuatro secciones
  post-break — degradé largo turquesa → neutro → ámbar sin volver a
  `--background` en el medio. Empieza y termina en `--background`.
- En `page.tsx`: las secciones post-break perdieron su `FondoSeccion` propio;
  el fondo es continuo, con dos auroras posicionadas `top-0 h-[62%]` /
  `bottom-0 h-[62%]` (se solapan, sin costura).

**Paso 5 — gate a póster.** ✅
`fondo-hero.tsx`: fuera los gates `hardwareConcurrency <= 4` y
`min-width: 768px` (§1.2). Único corte a póster: `prefers-reduced-motion`.
Móvil → Prism liviano (menos glow/bloom/noise, escala menor). Pausa fuera de
viewport: la hace Prism (`suspendWhenOffscreen`).

**Paso 6 — borrar `canvas-hero.tsx` / `poster-hero.tsx`.** ✅ Prism los
reemplaza.

**Paso 7 — medir.** ⛔ **Pendiente** (ver §6). No se puede desde esta sesión:
el `pnpm build` de Next 16 + Turbopack no imprime "First Load JS" y no hay
Lighthouse. `ogl` ya pesaba ~21 KB (encoded), así que los candidatos no
agregan dependencia — pero falta LCP real y una pasada en Render free.

**Paso 8 — documentación.** ✅
`docs/specs/2026-08-21-sistema-visual-mirage.md`: §5.1 (presupuesto por
página), §5.2 (Prism, se cayeron dos fallbacks), §5.3 (`FondoSeccion` /
`FondoContinuo` / auroras / break de vidrio), §6.8 (inventario abierto para
fondos de landing), §7 (fila "Fondo"). `CLAUDE.md`: las dos líneas de la
tabla §0.2 (WebGL por página, inventario).

---

## 2. Trabajo extra (pedido en la revisión, fuera del §3/PR 2)

- **Hero + "Qué hacemos" + break comparten el fondo Prism.** El corte entre
  el hero (con noise del shader) y la sección siguiente se notaba brusco.
  `FondoHero` lo monta `page.tsx` sobre un contenedor que envuelve las tres.
- **Break "Un sistema propio…" pasa a panel de vidrio** (`PageBreak
  variante="vidrio"`): `backdrop-blur` + degradé teal translúcido + bordes
  hairline. Deja pasar el prisma desenfocado en vez de tapar con un bloque.
  Un fade en el borde inferior de la zona lleva el prisma a `--background`.
- **"Qué hacemos" — tres cards visibles, no card-swap** (§1 del PR 3,
  adelantado; queja §1.5). El card-swap casero era angosto (`max-w-md`),
  rotaba solo cada 5 s y no se entendía como interactivo. Ahora es una
  grilla (1 col móvil / 3 col ≥sm), sin estado ni JS; `capacidades.tsx` dejó
  de ser client component. Anotado también en la bitácora del PR 3.
- **Tintes de `FondoSeccion` subidos** (claro 9→16 %, oscuro 8-10→22-24 %):
  al valor anterior las tres bandas se leían iguales en oscuro.

---

## 3. Decisiones que tomé yo

- **`silk` afuera por peso** (three.js). La terna efectiva fue `dark-veil` vs
  `prism`, con `light-rays` / `soft-aurora` de alternativa — todos ogl.
- **`hueShiftSpeed` como adaptación a `Prism.tsx`** (§6.8), no un wrapper: el
  prop `hueShift` re-monta el WebGL al cambiar.
- **Ciclo de matiz de 10 s** recorriendo todo el espectro — pedido explícito
  de Kevin ("que el hue shift transicione cada 10 segundos aprox").
- **`FondoContinuo` como capa única** en vez de `FondoSeccion` por sección:
  era la única forma de que no se notara el borde de cada sección.
- **Break de vidrio adentro del contenedor del hero**, para que el prisma
  corra por detrás; `backdrop-blur-xl` (24px).
- **Auroras a `brightness 0.42 / speed 0.35`** (más tenues que el arranque)
  porque cubren áreas grandes y hay dos siempre montadas en ese tramo.
- **`card-swap` → tres cards estáticas**: la sección son tres puntos de
  información, no una navegación; no tienen por qué ser interactivos.

---

## 4. Archivos tocados

**Candidatos vendidos (nuevos)**: `src/components/{DarkVeil,Prism,LightRays,
SoftAurora}.tsx`. `Prism.tsx` con la adaptación `hueShiftSpeed`.

**Hero**: `src/components/espejismo-hero/hero-prism.tsx` (nuevo);
`fondo-hero.tsx` (Prism + gates + liviano); `espejismo-hero.tsx` (deja de
montar el fondo); `canvas-hero.tsx` + `poster-hero.tsx` (borrados).

**Fondos de la landing**: `src/components/fondo-seccion.tsx` (children +
glows); `src/components/fondo-seccion-aurora.tsx` (nuevo);
`src/components/fondo-continuo.tsx` (nuevo); `src/components/page-break.tsx`
(variante vidrio); `src/app/(publico)/(con-chasis)/page.tsx` (toda la
estructura de fondos).

**"Qué hacemos"**: `src/app/(publico)/(con-chasis)/_inicio/capacidades.tsx`
(grilla, sin JS).

**Harness**: `src/app/dev/hero/{page,comparador-hero}.tsx`,
`src/lib/color-token.ts` (nuevos).

**Docs**: sistema visual §5.1-5.3, §6.8, §7; `CLAUDE.md`; esta bitácora.

**Tokens**: `src/app/globals.css` (`--tinte-*` subidos, claro y oscuro).

---

## 5. Qué verifiqué y cómo

- `pnpm lint` / `pnpm typecheck` / `pnpm test` (24 archivos, 190) /
  `pnpm build` → verde. `test` corrió verde en el commit del fondo continuo;
  los commits posteriores (vidrio, capacidades, docs) solo tocan UI de
  landing y docs, sin código con tests.
- Navegador — verificación **de estructura**, no visual (el panel de preview
  no compone frames: sin screenshots, el `IntersectionObserver` no tickea,
  el viewport reporta ancho 0). Confirmado: Prism monta como fondo del hero
  (árbol de padres correcto); las cuatro `<h2>` de la landing existen; las
  tres cards de "Qué hacemos" renderizan con su contenido; el `PageBreak`
  vidrio aplica `backdrop-filter: blur(24px)` + el degradé + los bordes;
  tokens de tinte resuelven distinto en oscuro. `/dev/hero` compila y monta
  Prism / SoftAurora / DarkVeil (LightRays no monta acá — gatea en un
  `IntersectionObserver` que no dispara en este entorno).
- **Verificación visual y de rendimiento: la hizo Kevin en su navegador**, a
  lo largo de la revisión ("bien, por ahora está bien la página principal").
  Falta la medición Lighthouse (§6).

---

## 6. Dudas y sospechas / lo que queda

- **Lighthouse / LCP / peso en producción (paso 7)** — pendiente. Necesita
  `pnpm build && pnpm start` + Lighthouse en una máquina con navegador, y
  una pasada en Render free. Presupuesto: LCP ≤ 2.5 s, JS inicial ≤ 180 KB
  sin el shader, no empeorar el LCP actual +200 ms. Confirmar también en la
  pestaña Network que `/app` y `/portal` no cargan un byte de WebGL.
- **El canvas de Prism ahora se estira sobre hero + "Qué hacemos" + break**
  (~2.5 viewports) → ~2.5× de píxeles a pintar por frame vs. el hero solo.
  Es el mayor riesgo de rendimiento del PR. Si en un celular real va con
  lag, la opción es limitar la altura del contenedor del Prism (sticky /
  masked) en vez de que llene todo.
- **`backdrop-blur-xl` sobre WebGL** en el break puede pesar en móvil. Si va
  mal, bajar a `blur-md` o dejar solo el degradé translúcido.
- **El ciclo de matiz de Prism recorre todo el espectro.** Es lo que se
  pidió. Si en algún momento se ve "modo fiesta", subir `CICLO_SEGUNDOS` en
  `hero-prism.tsx` o cambiarlo por una oscilación acotada a un rango cálido.
- **Prism cachea `dpr = min(2, devicePixelRatio)`** y no lo expone; la
  versión `liviano` baja el costo del fragment shader pero no la resolución.
- **`FondoSeccionAurora` monta/desmonta con `rootMargin: 120px`**: si al
  scrollear rápido se ve el "encendido" del shader, subir el margen.
- **`LightRays` no se pudo probar en esta sesión** (IO no dispara). Kevin:
  si alguna vez se lo quiere usar, verificar que monte.

---

## 7. Deuda que dejo

1. **Medición Lighthouse** (§6) — es lo único del §3/PR 2 que queda abierto.
2. Revisar en 390 px que el fondo continuo y el break de vidrio no metan
   scroll horizontal ni tapen texto.
3. Sign-off de rendimiento en un celular real (el canvas grande del Prism).
