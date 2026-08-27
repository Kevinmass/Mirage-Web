# Bitácora — PR 1 (`fix-01-base-visual`)

Base visual: tipografía, modo claro y el fin de `CampoArena`.
Rama sacada de `staging` actualizado (commit `1ce2ae4`). PR contra `staging`.

---

## 1. Qué se hizo (paso por paso del §3, PR 1)

1. **Tipografía — cuerpo a Geist.** `src/app/layout.tsx`: `Inter` → `Geist`
   de `next/font/google`, variable `--font-inter` → `--font-geist`.
   `globals.css`: `--font-sans: var(--font-geist)`. Verificado en el
   navegador: `getComputedStyle(document.body).fontFamily` → `Geist`.
   **No** hizo falta caer a General Sans: Geist se lee bien en `/dev/ui`
   y en la landing; la decisión de "mirarlo en pantalla" se resolvió a
   favor de Geist (ver §2).
2. **La display al interno.** `grep` de `text-2xl font-semibold` /
   `text-lg font-semibold` (+ `text-xl` / `text-3xl` que aparecían en el
   camino) en `src/app/(interno)` y `src/app/(portal)`: 30 archivos, todos
   `<h1>`/`<h2>`. Reemplazos:
   - `text-2xl font-semibold` → `text-h3 font-heading font-semibold`
     (h1 de `/app`; `text-h3` = 1.5rem = el `text-2xl` que había, solo
     cambia la fuente).
   - `text-xl font-semibold` → `text-h3 font-heading font-semibold`
     (h1 de `/app/solicitudes/[id]`, h2 de `/portal`).
   - `text-3xl font-semibold` → `text-h2 font-heading font-semibold`
     (h1 de `/portal`, que es "amplio y explicativo").
   - `text-lg font-semibold` → `text-lg font-heading font-semibold`
     (subsecciones, ambas superficies: se conserva el tamaño, cambia la
     fuente).
   Verificado en el navegador que `/dev/ui` y la landing resuelven los
   `<h1>`/`<h2>` a `"Bricolage Grotesque"`.
3. **Modo claro con temperatura.** `globals.css` `:root`:
   - `--background`: `arena-100` → `arena-200`. `--card` queda en
     `arena-50`. Medido en el navegador (modo claro forzado): `--background`
     lab L≈93.3, `--card` lab L≈98.7 → Δ≈5.4 puntos de L, se distingue de
     un vistazo (antes Δ≈1.5).
   - `--muted` y `--secondary`: `arena-200` → `arena-300` (lab L≈87.2), se
     separan del fondo nuevo.
   - `--muted-foreground`: `tinta-600` → `tinta-700` (lab L≈32.2), para
     mantener AA de texto secundario sobre `arena-200`.
   - `--border`: `arena-300` → `color-mix(in oklch, var(--turquesa-500)
     18%, var(--arena-300))`. Medido: `oklch(0.846 0.043 98.5)` — más
     croma que el `arena-300` pelado (0.027), tinte perceptible sin gritar.
   - `--input`: se deja en `arena-500` (es el borde de control, necesita
     3:1). **Ver §6** — no lo re-medí con herramienta WCAG sobre el fondo
     nuevo.
   - Tokens nuevos `--tinte-turquesa` / `--tinte-ambar` / `--tinte-neutro`
     en `:root` y en `.dark`, mezcla del color sobre `--background`.
4. **`FondoSeccion`.** `src/components/fondo-seccion.tsx`: `aria-hidden`,
   `absolute inset-0 -z-10`, `background-image: linear-gradient(180deg,
   --background 0%, --tinte-<x> 50%, --background 100%)`. **Sin animación.**
   Prop `tinte`: `turquesa` / `ambar` / `neutro` (default `neutro`). La
   textura la pone la `<CapaGrano>` global del layout raíz, no el
   componente. Reemplaza a `<CampoArena>` en:
   - `(publico)/(con-chasis)/page.tsx` — 5 bandas
     (`arena-turquesa`→`turquesa` ×2, `arena`→`neutro` ×2,
     `arena-ambar`→`ambar` ×1).
   - `(publico)/(sin-chasis)/layout.tsx` — `/ingresar` y
     `/restablecer-password`.
   - `espejismo-hero/poster-hero.tsx` — el póster/fallback del hero.
   - `dev/ui/page.tsx` — fondo de la vitrina + la sección de muestra.
5. **Borrado de `campo-arena.tsx`** (`git rm`) y de `@property
   --campo-angulo` + `@keyframes campo-arena-girar` de `globals.css`.
   `grep -rn "CampoArena" src` no devuelve nada (los comentarios que
   mencionaban el componente se reescribieron a "el cónico giratorio del
   viejo `campo-arena.tsx`").
6. **Primitivos que faltaban.** `npx shadcn@latest add select textarea`
   generó los archivos; los **reescribí** a mano para que hablen el
   lenguaje de `<Input>` (§6.5): alto 44px, `bg-card`, `border-input`,
   `rounded-md`, foco `ring-3 ring-turquesa-200`. En `select.tsx` las
   opciones usan `data-highlighted:bg-secondary`, **no** `--accent`
   (ámbar) como venía del CLI. Los 25 `<select>` nativos de `/app`
   **no** se migran acá (es el PR 6).
7. **Vitrina.** `dev/ui/page.tsx`: sección "Campo de arena" → "Fondo de
   sección" (3 tintes), sección nueva "Select y textarea", texto "Bajada
   en Inter" → "en Geist", `<h1>`/subtítulo con `font-heading`.
8. **Documentación.** `docs/specs/2026-08-21-sistema-visual-mirage.md`
   §2.2 (tabla de tokens + nota del porqué) y §3 (par tipográfico, escala).
   `CLAUDE.md`: bloque "Estado del repo" (saca el párrafo de "van 4 PRs",
   corrige la nota de `.claude/launch.json`, aclara el esquema de ramas
   `fix-0N-*`).

**Fuera de lo que pedía el plan, nada.** Todo el §3/PR 1 quedó hecho.

---

## 2. Decisiones que tomé yo (lo que el plan dejaba abierto)

- **Geist y no General Sans.** El plan dejaba la puerta a General Sans si
  Geist "no rendía en pantallas densas". Geist se ve limpia en `/dev/ui`
  y no requiere `next/font/local` ni bajar el archivo; me quedé con Geist.
- **`text-h3` para los h1 de `/app`, `text-h2` para los de `/portal`.**
  El plan dice "aplicar `font-heading` y la escala (`text-h2` / `text-h3`)"
  sin asignar cuál a cuál. `/app` es denso: `text-h3` (1.5rem) es
  exactamente el `text-2xl` que ya tenían, así que el tamaño no cambia,
  solo la fuente. `/portal` es amplio: sus h1 (que eran `text-3xl`)
  pasan a `text-h2`.
- **Las etiquetas `text-sm font-medium` no se tocaron.** Hay ~6 `<h2>` /
  `<h3>` chiquitos (`text-sm font-medium text-muted-foreground`: columnas
  del Kanban, "Hilo", headers del dashboard). El plan dio como scope
  explícito el grep de `font-semibold`; esos son etiquetas, no títulos, y
  los dejé en Geist (lo anoté también en §3 del sistema visual). Si Kevin
  los quiere en Bricolage, es un cambio de una línea por archivo.
- **`FondoSeccion` no dibuja su propia capa de grano.** El plan dice
  "degradé + la capa de grano que ya existe". La `<CapaGrano>` del layout
  raíz ya cubre todo a `z-50`; meter otra en el componente sería grano
  doble. El componente es solo el degradé.
- **Mezclas de los `--tinte-*`:** turquesa/ámbar al 9 % en claro y
  10 %/8 % en oscuro, neutro con `arena-500` al 14 % (claro) /
  `noche-700` al 55 % (oscuro). Elegidas para que la banda quede "a un
  paso" del fondo. Medidas en pantalla: L entre `--card` y `--muted`.
- **`select.tsx` conserva el prop `size` (`sm` | `default`)** aunque el
  plan no lo pida: `default` = 44px (igual que `<Input>`), `sm` = 36px
  para cuando el PR 6 migre los selects densos del Kanban/Gantt.

---

## 3. Desviaciones del plan

- **Paso 6 dice `npx shadcn@latest add select textarea` y "adaptarlos a
  los tokens".** Corrí el CLI, pero lo que generó estaba lejos del estilo
  de la casa (sin comentarios, comillas dobles sin `;`, `bg-transparent`,
  `rounded-lg`, `focus:bg-accent` en las opciones). En vez de editar por
  encima, reescribí los dos archivos tomando `components/ui/input.tsx`
  como molde. El resultado es funcionalmente el primitivo de shadcn/Base
  UI, con los tokens y el idioma del repo.
- **`.claude/launch.json` (paso 6.6 del §0.1 / nota de `CLAUDE.md`):** el
  plan pedía corregirlo porque "apunta a un worktree que ya no existe".
  Ya estaba corregido en el repo (`pnpm dev`, puerto 3000, sin worktree).
  No toqué el archivo; sí actualicé la nota vieja de `CLAUDE.md`.
- **8 archivos de `/app` y `/portal` que el sed de títulos dejó fuera de
  formato.** El reemplazo alargó líneas de JSX que pasaban de 80 columnas;
  Prettier las quería envolver. Corrí `prettier --write` sobre esos 8 y
  quedaron con el wrap correcto. (El resto del repo tiene ~200 archivos
  que `format:check` marca en local por CRLF vs LF — es un artefacto de
  Windows + `core.autocrlf=true`; en CI, que corre en Linux con LF, pasa.
  Verifiqué que los archivos de este PR pasan `prettier --check` con
  finales LF.)

---

## 4. Archivos tocados (por intención)

**Tipografía**
- `src/app/layout.tsx` — Inter → Geist.
- `src/app/globals.css` — `--font-sans`.
- 30 archivos en `src/app/(interno)` y `src/app/(portal)` — `font-heading`
  + escala en `<h1>`/`<h2>`.
- `docs/specs/2026-08-21-sistema-visual-mirage.md` §3.

**Modo claro / tokens**
- `src/app/globals.css` — `:root` y `.dark`: `--background`, `--muted`,
  `--secondary`, `--muted-foreground`, `--border`, `--tinte-*`; borrado de
  `@property --campo-angulo` y `@keyframes campo-arena-girar`.
- `docs/specs/2026-08-21-sistema-visual-mirage.md` §2.2.

**Fin de `CampoArena` / `FondoSeccion`**
- `src/components/fondo-seccion.tsx` — nuevo.
- `src/components/campo-arena.tsx` — borrado.
- `src/components/espejismo-hero/poster-hero.tsx`,
  `src/app/(publico)/(con-chasis)/page.tsx`,
  `src/app/(publico)/(sin-chasis)/layout.tsx` — swap de componente.

**Primitivos**
- `src/components/ui/select.tsx`, `src/components/ui/textarea.tsx` — nuevos.

**Vitrina**
- `src/app/dev/ui/page.tsx` — tipografía, "Fondo de sección", "Select y
  textarea".

**Docs de repo**
- `CLAUDE.md` — bloque "Estado del repo".
- `docs/plan/2026-08-27-plan-fixes.md` — se sumó al repo (estaba sin
  trackear); primer commit de la rama.

---

## 5. Qué verifiqué y cómo

**Comandos (estado final, en verde):**
- `pnpm lint` → sin salida (ok).
- `pnpm typecheck` → sin errores.
- `pnpm test` → 24 archivos, 190 tests, todos pasan.
- `pnpm build` → `✓ Compiled successfully`, 14/14 páginas estáticas.
- `prettier --check` sobre los archivos del PR con finales LF → "All
  matched files use Prettier code style!".

**Navegador (`pnpm dev`, sin Docker/DB — ver §6):**
- `/dev/ui`: `--font-sans` → Geist; `body` → Geist; `<h1>` → Bricolage
  Grotesque. `FondoSeccion`: `animationName` = `none`; 0 elementos con
  `conic-gradient` en la página. Modo claro forzado: `--background` lab
  L≈93.3 vs `--card` L≈98.7 (se separan); `--muted`/`--secondary` L≈87.2;
  `--border` con croma 0.043; `--muted-foreground` L≈32.2. Modo oscuro
  (el navegador estaba en `prefers-color-scheme: dark`): `--background`
  L≈5.25 vs `--card` L≈9.0, sin cambios respecto de antes.
- `/dev/ui` — `<Select>`: el trigger mide 44px, fondo `--card`; abre el
  popup con 3 opciones; las opciones traen
  `data-highlighted:bg-secondary data-highlighted:text-secondary-foreground`
  (no `--accent`).
- `/` (landing): 0 `conic-gradient`; 5 instancias de `FondoSeccion`, todas
  con `animationName: none`; los `<h2>` de sección en Bricolage; sin
  scroll horizontal a 375 px; único elemento animado = un `<svg>` con
  `bounce` (ícono de scroll, no un fondo).
- `/ingresar`: `FondoSeccion` presente, sin animación, formulario ok.
- `/app` sin sesión → 404 (comportamiento esperado). Sin errores de
  consola salvo ese 404. `preview_logs` sin errores de servidor.

Temas: claro y oscuro (oscuro en vivo, claro forzando quitar `.dark`).
Anchos: escritorio y 375 px.

---

## 6. Dudas y sospechas

- **`--input` sobre `--background` nuevo no está re-medido con herramienta
  WCAG.** Se deja en `arena-500` como pedía el plan. `arena-500` sobre
  `arena-100` daba 3.41 (§2.3 del sistema visual); sobre `arena-200`
  (marginalmente más oscuro) el ratio baja un poco y podría acercarse a
  3:1. Recomiendo pasarle un contrastómetro antes de dar por cerrado el
  PR. Lo dejé anotado en §2.2 del sistema visual.
- **Los pares de contraste de §2.3 medidos "sobre arena-100" no los
  volví a calcular uno por uno.** El razonamiento (que anoté en el doc):
  `arena-200` es más oscuro, así que el texto `tinta-*` gana contraste, y
  el único riesgo claro-sobre-claro (`turquesa-500` como texto) ya estaba
  prohibido. Pero es razonamiento, no medición.
- **`/app` y `/portal` internos no se vieron en vivo** — no levanté
  Postgres ni corrí `db:bootstrap` en esta sesión. El cambio a esas
  pantallas es un swap de clases (`text-2xl font-semibold` →
  `text-h3 font-heading font-semibold`), cubierto por `typecheck` +
  `build` + el hecho de que la misma utilidad `font-heading` resuelve a
  Bricolage en `/dev/ui` y la landing. Riesgo bajo, pero conviene una
  pasada por `/app` con datos.
- **`--tinte-neutro` en oscuro** resuelve a `oklch(0.223 0.006 none)` —
  el `none` en el hue es porque el croma es casi cero (mezcla de dos
  casi-grises). Es CSS válido y renderiza bien; lo menciono por si
  aparece en una herramienta y asusta.
- **`SelectValue` es el alias directo de `SelectPrimitive.Value`** (sin
  wrapper con `className`). Si en el PR 6 algún select necesita alinear a
  la izquierda un texto largo, quizás haya que envolverlo.

---

## 7. Deuda que dejo

- **Re-medir `--input` (3:1) y los pares de §2.3 con herramienta WCAG.**
  No entró porque no tengo un contrastómetro en esta sesión; es
  verificación, no código.
- **Ver `/app` y `/portal` internos en vivo con datos.** Requiere
  `docker compose up -d` + migrate/seed/bootstrap; lo dejo para la
  revisión de Kevin o para el PR 6 (que audita esas pantallas de todos
  modos).
- **Los ~6 `<h2>`/`<h3>` chicos (`text-sm font-medium`) siguen en Geist.**
  Decisión consciente (§2); si se quieren en Bricolage es trivial pero
  quedaba fuera del scope del grep del plan.
- **Migrar los 25 `<select>` nativos y los 13 `rounded-md border px-2
  py-1`** a los primitivos nuevos — es explícitamente el PR 6.
