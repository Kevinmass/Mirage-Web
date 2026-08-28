# Bitácora — PR 3 (`fix-03-landing-interaccion`)

Landing: afordancias e interacción. Rama sacada de `staging` actualizado
(`b240410`, ya con PR 1 y PR 2 mergeados). PR contra `staging`.

---

## 1. Qué se hizo (contra el §3, PR 3)

**Paso 1 — "Qué hacemos" card-swap.** ✅ **Ya hecho en el PR 2.**
El card-swap casero (angosto, rotaba solo cada 5 s, no se entendía como
interactivo — §1.5) se reemplazó por tres cards visibles a la vez en grilla,
sin estado ni JS. Ver `capacidades.tsx` y la bitácora del PR 2 §2. Acá no se
volvió a tocar.

**Paso 2 — Contacto (`contacto/metodos-directos.tsx`).** ✅
El bloque de email solo cambiaba la sombra en hover (`sm`→`md`); al lado de
"Enviar mensaje" parecía un cartel. Ahora `BloqueContacto`:
- **Borde que se ilumina**: `hover:border-primary`.
- **Ícono de acción**: un `ArrowUpRight` a la derecha que se desplaza en
  hover (`group-hover:-translate-y-0.5 translate-x-0.5`).
- **Desplazamiento**: la card se levanta (`hover:-translate-y-0.5`).
- **Foco visible**: `outline-none` + `focus-visible:border-ring
  focus-visible:ring-3 focus-visible:ring-turquesa-200` (mismo lenguaje que
  `<Input>`), y el desplazamiento también en `focus-visible`.
- El ícono redondo del método invierte a `bg-primary` en hover.

**Paso 3 — `revelado.tsx`.** ✅
`{ threshold: 0.2 }` → `{ threshold: 0, rootMargin: "0px 0px -12% 0px" }`.
Con `0.2`, un elemento más alto que ~5 viewports nunca alcanza ese ratio de
intersección (ratio = área visible / área total) y se queda en `opacity-0`
para siempre. Ahora el disparo no depende de la altura: con que asome un
pixel dentro del viewport recortado 12 % por abajo, se revela.

**Paso 4 — barrido de la landing (claro y oscuro).** ✅
Elementos clickeables sin foco visible (o sin hover):
- **Menú móvil** (`menu-movil.tsx`): los ítems de nav **no tenían ni hover
  ni foco**. Ahora `hover/focus-visible:text-primary` + anillo turquesa +
  padding para que el anillo respire. El botón de cerrar suma anillo.
- **Índice de cierre** (`cierre-indice.tsx`, "flowing-menu"): el subrayado
  que crece y el cambio de color solo respondían a `group-hover`. Se
  duplicó en `group-focus-visible`, con `outline-none` (el subrayado
  full-width + color primario es indicador de foco suficiente para un
  `text-display`).
- **Footer** (`footer-mirage.tsx`): los enlaces tenían `hover:text-foreground`
  pero nada en foco. Ahora anillo + subrayado en `focus-visible`.
- **Header** (`header-publico.tsx`): logo, ítems de nav, "Ingresar" y el
  botón de menú no tenían anillo de foco propio (quedaban con el outline por
  defecto del navegador, invisible sobre el hero en algunos casos). Se sumó
  `anilloFoco` con color condicional: `crema-100/70` cuando el header está
  transparente sobre el hero, `ring` (turquesa) cuando está sólido.
- **`/servicios`** (`servicios/page.tsx`): las cards-enlace tenían
  `hover:shadow-xl` pero ni foco ni borde reactivo. Ahora se levantan, el
  borde se ilumina y hay anillo de foco turquesa.

Ya estaban bien y no se tocaron: **el recomendador** (`casos/recomendador.tsx`
— sus botones de opción y los `<Button>` ya traen `focus-visible:ring`), **el
toggle de tema** (`toggle-tema.tsx` — ya tiene `focus-visible:ring` con
offset), y todos los `<Button render={<Link>}>` (el componente `Button` se
encarga). El `<PageBreak>` no es clickeable.

---

## 2. Decisiones que tomé yo

- **`cierre-indice` con `outline-none`**: el efecto de foco es el subrayado
  full-width + el color primario, no un anillo. Para un enlace `text-display`
  (enorme) es un indicador clarísimo; un anillo encima quedaba redundante.
- **Header: `anilloFoco` como variable condicional** en vez de un anillo
  fijo — el header vive sobre el hero (fondo oscuro/colorido) y sobre
  superficie sólida, y un solo color de anillo no se ve bien en los dos.
- **Cards de servicios/contacto: `hover:-translate-y-0.5`** (levante sutil)
  además del borde y la sombra — es el gesto que más rápido dice
  "clickeable".
- **`rootMargin: -12%`** para el revelado: suficiente para que el elemento
  entre bien antes de animar, sin que se sienta tardío. Height-independent.
- **No convertí en enlaces** las cards de "Servicios destacados" /
  "Casos" de la portada (`servicios-destacados.tsx` / `prueba-social.tsx`):
  el §4 pide foco/hover en lo clickeable, y esas no lo son (el enlace es el
  botón "Ver todos"). Se dejaron como están.

---

## 3. Desviaciones del plan

- Ninguna de fondo. El §1 ya estaba hecho (PR 2), así que este PR es §2 + §3
  + §4.

---

## 4. Archivos tocados

**Revelado**: `src/components/revelado.tsx`.

**Contacto**: `src/app/(publico)/(con-chasis)/contacto/metodos-directos.tsx`.

**Barrido de foco/hover**:
- `src/components/menu-movil.tsx`
- `src/components/footer-mirage.tsx`
- `src/components/header-publico.tsx`
- `src/app/(publico)/(con-chasis)/_inicio/cierre-indice.tsx`
- `src/app/(publico)/(con-chasis)/servicios/page.tsx`

**Bitácora**: este archivo.

---

## 5. Qué verifiqué y cómo

- `pnpm lint` / `pnpm typecheck` / `pnpm test` (24 archivos, 190) /
  `pnpm build` → todo en verde.
- **Verificación visual: pendiente de Kevin en el navegador.** El panel de
  preview de la sesión no compone frames (sin screenshots), y los cambios
  son estados `:hover` / `:focus-visible` que solo se ven interactuando. Lo
  que hay que mirar, con teclado (Tab) y mouse, en claro y oscuro:
  - Recorrer con Tab el header (logo, nav, Ingresar, menú), el footer y el
    índice de cierre: cada parada tiene que mostrar un anillo o subrayado
    visible, también con el header transparente sobre el hero.
  - Menú móvil abierto: Tab por los ítems, cada uno responde.
  - Página de Contacto: el bloque de email tiene que leerse tan clickeable
    como el botón "Enviar mensaje".
  - `/servicios`: Tab por las cards, se levantan y muestran anillo.
  - Scrollear la landing a 390 px: ninguna sección queda en `opacity-0`
    (revelado). Probar también una recarga a media página.

---

## 6. Dudas y sospechas

- **`revelado.tsx` sin JS**: el estado inicial sigue siendo `opacity-0` y se
  depende de que el `IntersectionObserver` corra para revelar. Si JS está
  deshabilitado, el contenido queda invisible (salvo `prefers-reduced-motion`,
  que lo fuerza a visible por CSS). Es un problema preexistente del
  componente, no lo introduce este PR y el §3 no lo pide — pero conviene
  saberlo.
- **Anillo del header sobre el hero**: `focus-visible:ring-crema-100/70`
  asume que el fondo detrás es oscuro. El hero de `/` (Prism) es oscuro casi
  siempre, pero el matiz cicla y en el pico claro podría contrastar poco.
  Verificar en el navegador.
- **`cierre-indice` con `outline-none`**: si el subrayado no se percibe como
  foco (a alguien le puede parecer solo "hover"), habría que sumar un anillo
  tenue. Lo dejé sin anillo a propósito; sujeto a lo que vea Kevin.
- **`/servicios` cards con `position: sticky`** (`sm:sticky`): el
  `hover:-translate-y-0.5` sobre un elemento sticky puede dar un salto raro
  al hacer hover mientras está pegado. Verificar en desktop.

---

## 7. Deuda que dejo

- Verificación visual + de teclado (§5) — es lo único que queda, y es de
  Kevin.
- Nada más del §3/PR 3 queda abierto.
