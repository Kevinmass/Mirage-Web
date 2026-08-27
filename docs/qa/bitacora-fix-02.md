# Bitácora — PR 2 (`fix-02-fondos-react-bits`) — **PARCIAL**

React Bits de verdad: hero y fondos. Rama sacada de `fix-01-base-visual`
(PR 1 todavía en review, no mergeado a `staging`).

> **Este PR no está terminado.** La parte central —elegir el fondo del hero
> mirándolo en vivo (paso 2)— no se puede hacer desde esta sesión: el panel
> de preview no compone frames (sin screenshots, y el `IntersectionObserver`
> no tickea). Lo que sigue es el andamiaje listo para que Kevin haga la
> elección en `/dev/hero` y de ahí se cierre el PR. Ver §6–7.

---

## 1. Qué se hizo (contra el §3, PR 2)

**Paso 1 — habilitar el registro / instalar candidatos.** ✅
- El install de React Bits va por URL completa:
  `npx shadcn@latest add https://reactbits.dev/r/<Nombre>-TS-TW.json`.
  Copia el archivo a `src/components/<Nombre>.tsx` (no a `ui/`).
  `components.json` → `registries` sigue vacío; no hizo falta el namespace
  `@react-bits`, alcanza con la URL.
- Instalados: `DarkVeil`, `Prism`, `LightRays`, `SoftAurora`.
- **`silk` descartado**: su registry declara
  `["@react-three/fiber@^9.3.0", "three@^0.180.0"]` — ~150 KB gz de
  dependencia nueva, contra el presupuesto "JS inicial ≤ 180 KB". Los otros
  cinco candidatos declaran solo `ogl@^1.0.11`, que **ya está** en
  `package.json` (lo usa `canvas-hero.tsx`): cero peso nuevo.
- Ajustes al código vendido: `"use client"` antepuesto a los cuatro
  (usan hooks); en `SoftAurora` un `prefer-const` con `--fix` y otro con
  `// eslint-disable-next-line prefer-const` comentado.

**Paso 2 — elegir el fondo comparándolo en vivo.** ⛔ **Bloqueado** (ver §6).
En su lugar se armó el harness (`/dev/hero`, ver §3 abajo).

**Paso 3 — retiñir a la paleta.** 🟡 Parcial.
- El harness resuelve los tokens (`--turquesa-400/500/700`, `--ambar-500`,
  `--arena-50`) a `#rrggbb` en runtime vía `src/lib/color-token.ts`
  (canvas 2D, porque `getComputedStyle().color` devuelve `lab()` en este
  Chrome) y se los pasa a los componentes. Valores medidos:
  turquesa-400 `#31c5b4`, turquesa-500 `#0fa594`, arena-50 `#fdfbf7`,
  ámbar-500 `#f2a93b`.
- `LightRays` y `SoftAurora` toman color por prop (`raysColor`,
  `color1`/`color2`) → retinte directo. `Prism` y `DarkVeil` solo rotan
  matiz (`hueShift`) → el harness expone un slider.
- **Falta**: fijar los valores definitivos en el componente elegido y
  quitar el harness / dejar solo el ganador. Los literales del shader del
  ganador quedarán comentados, como en `canvas-hero.tsx` hoy.

**Paso 4 — `FondoSeccion` acepta capa animada.** ✅
`FondoSeccion` ahora toma `children`: se montan encima de la banda quieta,
que queda de fallback y de fondo real bajo `prefers-reduced-motion`
(`motion-reduce:hidden` sobre la capa animada). **Falta** montar los dos
fondos de sección concretos (paso 4, segunda parte) — depende del ganador.

**Paso 5 — qué se conserva / qué cambia del gate a póster.** ✅
`fondo-hero.tsx`:
- Se sacan los gates `hardwareConcurrency <= 4` y `min-width: 768px`
  (§1.2: en notebook modesto o celular el hero era una imagen fija).
- Único corte a póster ahora: `prefers-reduced-motion`.
- En móvil (`max-width: 767px` o `pointer: coarse`) se pasa `liviano` a
  `CanvasHero`, que baja el DPR tope de 1.5 a 1 (mitad de píxeles/frame).
- Se conservan: pausa fuera de viewport y con pestaña oculta, póster de
  `loading` del `next/dynamic`.
- **Nota**: hoy `CanvasHeroDinamico` sigue apuntando al `canvas-hero.tsx`
  actual. El swap al componente ganador es parte del cierre del PR.

**Paso 6 — borrar `canvas-hero.tsx` / `poster-hero.tsx`.** ⛔ No se hace
todavía: no hay ganador y `canvas-hero.tsx` es el fallback vigente + una de
las opciones del harness.

**Paso 7 — medir.** 🟡 Parcial.
- `ogl` ya pesa ~21 KB (encoded) en el bundle actual → los candidatos
  ogl no agregan dependencia.
- No hay medición de producción ni Lighthouse (ver §6). El `pnpm build` de
  Next 16 + Turbopack no imprime "First Load JS", y `next dev` mezcla
  chunks de devtools. Falta `pnpm build && pnpm start` + Lighthouse, y una
  pasada en Render free.

**Paso 8 — documentación (§5.2, §6.8, `CLAUDE.md` según tabla §0.2).**
⛔ No se toca hasta que haya ganador — reescribir esas reglas sin el
resultado sería a ciegas.

---

## 2. Decisiones que tomé yo

- **`silk` afuera por peso**, no por gusto: `three` + `@react-three/fiber`
  no entran en el presupuesto. La terna efectiva pasa a `dark-veil` vs
  `prism`, con `light-rays` y `soft-aurora` de alternativa — todos ogl.
- **Los candidatos van a `src/components/` (raíz), no a `ui/`** — igual que
  `campo-arena.tsx` en su momento y que el resto de componentes no-shadcn.
- **`color-token.ts` con canvas 2D** en vez de parsear el string de
  `getComputedStyle`: este Chrome devuelve `lab(...)`, y el 2D context
  normaliza cualquier espacio de color a bytes sRGB.
- **Harness que monta un candidato por vez**, no los cinco a la vez: cinco
  contextos WebGL simultáneos compiten y algunos navegadores cortan a los
  ~16 contextos vivos.
- **`liviano` = DPR 1** (no "menos capas"): es el ajuste de una línea con
  más impacto y no toca el shader. "Menos capas" quedaría para el
  componente ganador si hace falta.
- **`FondoSeccion` usa `children`** (no un prop `animado={<X/>}`): más
  simple y deja pasar cualquier componente.

---

## 3. El harness `/dev/hero`

Página dev-only (`notFound()` en producción, igual que `/dev/ui`).
`src/app/dev/hero/page.tsx` (server, guarda) + `comparador-hero.tsx`
(client). Qué ofrece:
- Selector de candidato: Prism / LightRays / SoftAurora / canvas-hero
  (actual) / DarkVeil. Monta uno por vez a pantalla completa.
- El `<h1>`/bajada reales encima, para juzgar contraste y legibilidad.
- Slider `hueShift` (−180…180) para Prism y DarkVeil.
- Selector de modo para Prism (`rotate` / `hover` / `3drotate` — solo
  `hover`/`3drotate` reaccionan al cursor).
- Ficha por candidato: dependencia, si se mueve solo, si reacciona al
  mouse, cómo se lee (mi lectura del shader, para orientar; la decisión
  es visual).

**Cómo lo usa Kevin**: `pnpm dev` → `http://localhost:3000/dev/hero`,
recorrer los cinco con el mouse quieto y moviéndose, elegir uno y anotar
`hueShift`/modo. Con eso yo cierro el PR (swap en `fondo-hero.tsx`,
retinte fijo, borrado de `canvas-hero.tsx`/`poster-hero.tsx`, los dos
fondos de sección, medición y docs).

Criterios del plan, en orden: (a) se mueve solo, visiblemente, con el
mouse quieto; (b) reacciona al cursor; (c) se lee como aire caliente que
dobla la luz; (d) entra en el presupuesto. Mi apuesta a ciegas, por el
código: **Prism** en modo `3drotate` — es refracción literal y reacciona
al cursor; `SoftAurora` es lo más cercano al arena↔turquesa del brief pero
más frío y sin el "doblado de luz".

---

## 4. Archivos tocados

**Candidatos vendidos (nuevos)**
- `src/components/{DarkVeil,Prism,LightRays,SoftAurora}.tsx` — React Bits,
  base ogl, con `"use client"`.

**Harness**
- `src/app/dev/hero/page.tsx`, `src/app/dev/hero/comparador-hero.tsx` (nuevos).
- `src/lib/color-token.ts` (nuevo).

**Hero — gate a póster**
- `src/components/espejismo-hero/fondo-hero.tsx` — saca gates de CPU/ancho,
  agrega `liviano` para móvil.
- `src/components/espejismo-hero/canvas-hero.tsx` — prop `liviano` → DPR 1.

**FondoSeccion**
- `src/components/fondo-seccion.tsx` — `children` como capa animada opcional.

---

## 5. Qué verifiqué y cómo

- `pnpm lint` / `pnpm typecheck` / `pnpm test` (24 archivos, 190 tests) /
  `pnpm build` → todo en verde. `/dev/hero` compila como ruta estática.
- Navegador (`pnpm dev`, sin Docker):
  - `/dev/hero`: montan `Prism`, `SoftAurora`, `canvas-hero`, `DarkVeil`
    (1 `<canvas>` cada uno, tamaños razonables). Los colores de paleta
    resuelven bien (turquesa-400 `#31c5b4`, etc.). Sin errores de consola
    de los componentes (solo ruido de HMR y warnings de preload de fuentes).
  - **`LightRays` no monta acá**: gatea su init en un `IntersectionObserver`
    que en este entorno nunca dispara (el panel no compone frames). En el
    navegador real de Kevin va a andar. Confirmado que no es bug del
    harness: un `IntersectionObserver` fresco sobre cualquier elemento de
    la página tampoco dispara acá.
  - `/` (landing): sigue sano tras los cambios — `<h1>` ok, 1 `<canvas>`
    del hero (ahora corre WebGL donde antes caía a póster, que es el
    objetivo del paso 5), 5 capas de `FondoSeccion`, 0 `conic-gradient`,
    sin scroll horizontal.
- Peso de JS: no medible en condiciones reales desde acá (dev build).

---

## 6. Dudas y sospechas / lo que quedó bloqueado

- **La elección del fondo (paso 2) es de Kevin, en `/dev/hero`.** No se
  puede hacer sin ver los cinco en movimiento. Todo lo que depende del
  ganador quedó sin cerrar: swap en `fondo-hero.tsx` (paso 5, segunda
  parte), retinte fijo (paso 3), borrado de `canvas-hero.tsx`/
  `poster-hero.tsx` (paso 6), los dos fondos de sección (paso 4), y la
  reescritura de §5.2/§6.8/`CLAUDE.md` (paso 8).
- **`LightRays` no se pudo probar en esta sesión** (IntersectionObserver
  no tickea). Kevin: verificá que monte en tu navegador.
- **Lighthouse / LCP / peso en producción (paso 7)**: pendiente. Necesita
  `pnpm build && pnpm start` + Lighthouse en una máquina con navegador, y
  una pasada en Render free (peor caso). Presupuesto: LCP ≤ 2.5 s, JS
  inicial ≤ 180 KB sin el shader, no empeorar el LCP actual +200 ms.
- **`Prism` en modo `rotate` no reacciona al cursor** (criterio b). Si se
  elige Prism hay que dejarlo en `hover` o `3drotate`, o combinar.
- **`DarkVeil` produce una imagen oscura y psicodélica**: probablemente
  pelee con el arena claro. Lo dejé en el harness como referencia, no
  espero que gane.
- El `IntersectionObserver` interno de `LightRays` y el de `fondo-hero.tsx`
  usan `threshold`/lógica propia — si el ganador es LightRays, revisar que
  su pausa fuera de viewport no choque con la de `fondo-hero.tsx`.

---

## 7. Deuda que dejo (cierre del PR, tras la elección)

1. Kevin elige fondo + `hueShift`/modo en `/dev/hero`.
2. Wrapper retiñido del ganador (colores de paleta fijos, literales del
   shader comentados) y swap en `fondo-hero.tsx`.
3. Variante liviana de móvil del ganador (menos capas / menor DPR).
4. Borrar `canvas-hero.tsx` y `poster-hero.tsx` si el ganador los
   reemplaza; si el ganador es `canvas-hero`, este paso no aplica.
5. Dos fondos de sección de la landing sobre `FondoSeccion` (misma familia
   de color).
6. Medición: `pnpm build && pnpm start` + Lighthouse local + Render free,
   números antes/después en esta bitácora.
7. Reescribir §5.2 y §6.8 del sistema visual y las líneas de `CLAUDE.md`
   según la tabla del §0.2 (presupuesto por página en vez de "un solo
   WebGL"; inventario abierto para la landing), con el motivo escrito.
8. Confirmar en Network que `/app` y `/portal` no cargan un byte de WebGL.
