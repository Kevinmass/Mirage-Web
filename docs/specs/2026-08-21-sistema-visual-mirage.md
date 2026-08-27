# Mirage — sistema visual y directrices de frontend

**Fecha:** 21 de agosto de 2026
**Basado en:** `diseño-frontend/` (21 notas), `docs/specs/2026-08-14-plataforma-mirage-design.md`, `docs/plan/2026-08-18-plan-de-implementacion-v1.md`
**Alcance:** las tres superficies — `/` (público), `/app` (interno), `/portal` (clientes)
**Estado:** aprobado para planificar la implementación

---

## 0. Cómo leer este documento

Este documento decide **cómo se ve y cómo se mueve** la plataforma. No decide qué
hace: eso ya está en el documento de diseño de agosto y en el plan v1, y las fases
0 a 7 ya están implementadas y funcionando en gris.

Todo lo que está acá es normativo. Donde dice "solo", "nunca" o "máximo", es una
restricción dura y no una sugerencia: la mitad del valor de este documento está en
lo que **prohíbe**, porque las notas originales abren muchas más puertas de las que
un proyecto part-time puede sostener.

Cuando una decisión contradice una nota original, la sección lo dice explícitamente
y explica por qué.

---

## 1. El concepto

**Mirage = espejismo = luz que se dobla sobre aire caliente.**

Esa imagen es la que ordena todo el sistema: el calor del desierto (los arenas y
ámbares), el agua del oasis (el turquesa), y la distorsión — el movimiento
ondulante, la refracción, lo que se deforma al mirarlo de cerca.

Es una lectura literal del nombre y esa es exactamente su ventaja: cualquier
decisión visual futura tiene un criterio para resolverse sin volver a discutir
("¿esto se siente como calor sobre asfalto?"), y la identidad no se parece a la de
ningún otro estudio de software, que era el requisito explícito de
`Landing Page/Inicio/Inicio.md`.

De acá salen tres reglas de carácter:

1. **Nada es plano del todo.** Toda superficie grande tiene grano, gradiente o
   movimiento lento. El blanco puro y el negro puro no existen en este sistema.
2. **El calor sube, el agua enfría.** Los cálidos (arena, ámbar, coral) son el
   ambiente y la energía. El turquesa es lo que se puede tocar: acciones, enlaces,
   estados activos. Un cálido nunca es un botón primario.
3. **La distorsión es la firma.** Un solo lugar del sitio se deforma de verdad — el
   hero. En todo el resto la distorsión sobrevive como eco: un gradiente que
   respira, un borde que refracta, un hover que ondula.

---

## 2. Color

### 2.1 Escala cruda

Estos son los únicos colores del sistema. Cualquier valor que no esté acá es un bug.
Los valores canónicos son los OKLCH (es lo que ya usa `globals.css`); el hex está
como referencia para diseño.

**Arena** — la superficie del mundo claro.

| Token | Hex | OKLCH |
|---|---|---|
| `--arena-50` | `#FDFBF7` | `oklch(0.989 0.006 84.6)` |
| `--arena-100` | `#FAF6EF` | `oklch(0.974 0.010 81.8)` |
| `--arena-200` | `#F2EBDF` | `oklch(0.942 0.018 81.3)` |
| `--arena-300` | `#E4D9C7` | `oklch(0.889 0.027 80.2)` |
| `--arena-400` | `#C9BAA3` | `oklch(0.795 0.036 78.6)` |
| `--arena-500` | `#94836C` | `oklch(0.619 0.039 75.3)` |

**Tinta** — el texto y la estructura. Es un verde-negro, nunca negro puro.

| Token | Hex | OKLCH |
|---|---|---|
| `--tinta-900` | `#1F2421` | `oklch(0.254 0.009 159.4)` |
| `--tinta-800` | `#2E3531` | `oklch(0.321 0.012 160.7)` |
| `--tinta-700` | `#454E49` | `oklch(0.414 0.014 161.5)` |
| `--tinta-600` | `#636D67` | `oklch(0.524 0.015 159.5)` |
| `--tinta-400` | `#8D958F` | `oklch(0.661 0.013 153.5)` |

**Turquesa** — el oasis. Todo lo interactivo.

| Token | Hex | OKLCH |
|---|---|---|
| `--turquesa-700` | `#0C7A6D` | `oklch(0.521 0.091 181.8)` |
| `--turquesa-500` | `#12A594` | `oklch(0.649 0.114 182.0)` |
| `--turquesa-400` | `#31C5B4` | `oklch(0.745 0.122 183.4)` |
| `--turquesa-200` | `#A7E5DC` | `oklch(0.877 0.064 185.0)` |
| `--turquesa-50` | `#E6F7F4` | `oklch(0.963 0.018 184.3)` |

**Ámbar** — el calor. Destaca sin ser acción.

| Token | Hex | OKLCH |
|---|---|---|
| `--ambar-600` | `#D18A1E` | `oklch(0.690 0.140 70.8)` |
| `--ambar-500` | `#F2A93B` | `oklch(0.787 0.147 73.0)` |
| `--ambar-300` | `#F8CE8A` | `oklch(0.873 0.098 79.0)` |
| `--ambar-50` | `#FDF4E4` | `oklch(0.970 0.023 82.1)` |

**Coral** — la alarma y el énfasis raro.

| Token | Hex | OKLCH |
|---|---|---|
| `--coral-700` | `#BE3A25` | `oklch(0.540 0.172 31.8)` |
| `--coral-500` | `#FF6B54` | `oklch(0.708 0.185 31.0)` |
| `--coral-300` | `#FFA695` | `oklch(0.809 0.109 31.4)` |
| `--coral-50` | `#FFEDE9` | `oklch(0.959 0.020 32.5)` |

**Cielo** — el color de apoyo. Solo información neutra y gráficos.

| Token | Hex | OKLCH |
|---|---|---|
| `--cielo-500` | `#7FC7E8` | `oklch(0.794 0.086 228.8)` |
| `--cielo-200` | `#CDE8F5` | `oklch(0.915 0.034 228.3)` |

**Noche y crema** — el mundo oscuro. La noche es cálida, no azul.

| Token | Hex | OKLCH |
|---|---|---|
| `--noche-900` | `#131110` | `oklch(0.180 0.004 48.5)` |
| `--noche-800` | `#1C1917` | `oklch(0.216 0.006 56.0)` |
| `--noche-700` | `#272320` | `oklch(0.259 0.008 59.3)` |
| `--noche-600` | `#37322E` | `oklch(0.321 0.010 61.1)` |
| `--noche-500` | `#7A7168` | `oklch(0.554 0.018 67.4)` |
| `--crema-100` | `#F5EFE6` | `oklch(0.954 0.014 78.3)` |
| `--crema-300` | `#D6CEC2` | `oklch(0.855 0.019 78.2)` |
| `--crema-500` | `#A29A8F` | `oklch(0.690 0.018 76.1)` |

### 2.2 Tokens semánticos

En el código **nunca se usa la escala cruda directamente**. Se usa el token
semántico, que es lo que ya espera shadcn y lo que hace que el dark mode funcione
sin tocar una sola pantalla.

| Semántico | Claro | Oscuro |
|---|---|---|
| `--background` | `arena-200` | `noche-900` |
| `--foreground` | `tinta-900` | `crema-100` |
| `--card` | `arena-50` | `noche-800` |
| `--card-foreground` | `tinta-900` | `crema-100` |
| `--popover` | `arena-50` | `noche-700` |
| `--muted` | `arena-300` | `noche-700` |
| `--muted-foreground` | `tinta-700` | `crema-500` |
| `--primary` | `turquesa-700` | `turquesa-400` |
| `--primary-foreground` | `arena-50` | `noche-900` |
| `--secondary` | `arena-300` | `noche-700` |
| `--secondary-foreground` | `tinta-800` | `crema-100` |
| `--accent` | `ambar-500` | `#F5B95C` |
| `--accent-foreground` | `tinta-900` | `noche-900` |
| `--destructive` | `coral-700` | `#FF8570` |
| `--border` | `mix(turquesa-500 18% + arena-300)` | `noche-600` |
| `--input` | `arena-500` | `noche-500` |
| `--ring` | `turquesa-700` | `turquesa-400` |
| `--chart-1..5` | turquesa-500, ámbar-500, coral-500, cielo-500, tinta-600 | idem aclarados |
| `--tinte-turquesa` / `--tinte-ambar` / `--tinte-neutro` | mezcla del color sobre `--background` (§5.3) | ídem, mezcla más tenue |

> **Actualizado por `docs/plan/2026-08-27-plan-fixes.md` (PR 1).** El modo
> claro original (§1.7 de ese plan) se leía como un blanco plano: `--background`
> en `arena-100` y `--card` en `arena-50` diferían ~1.5 % de luminosidad, y
> `--muted` / `--secondary` compartían tono con el fondo. Cambios: el fondo baja
> a `arena-200` y las superficies mudas a `arena-300` para que se separen de un
> vistazo; `--muted-foreground` pasa a `tinta-700` para conservar AA sobre el
> fondo nuevo; `--border` toma un tinte turquesa (decisión 6) en vez de ser gris
> cálido; y aparecen los tres `--tinte-*`, el color medio de las bandas quietas
> de `<FondoSeccion>`. Los pares de §2.3 medidos "sobre arena-100" siguen
> valiendo como piso: `arena-200` es marginalmente más oscuro, así que el texto
> `tinta-*` gana contraste, no lo pierde. Falta re-medir con herramienta WCAG
> `--input` (`arena-500`) sobre `arena-200` — sigue siendo el borde de control y
> tiene que mantener 3:1.

Dos cosas a notar:

- **`--border` y `--input` son distintos a propósito.** El borde decorativo puede
  ser suave (ahora `arena-300` teñido de turquesa); el borde de un control que el
  usuario tiene que encontrar necesita 3:1 contra el fondo y por eso es
  `arena-500`. Hoy shadcn los tiene iguales y es una falla de accesibilidad
  heredada.
- **`--accent` es ámbar, no un gris.** El default de shadcn usa `accent` como el
  fondo del hover de los ítems de menú. Eso **hay que reasignarlo** a
  `secondary`, o cada hover del interno se va a pintar de ámbar. Es un cambio de
  una línea por componente y es un paso obligatorio del PR de tokens. El
  `<select>` nuevo (`components/ui/select.tsx`) ya lo hace: sus opciones usan
  `--secondary` en `data-highlighted`.

### 2.3 Contrastes verificados

Todos medidos con WCAG 2.1. Estos pares están garantizados y no hay que volver a
chequearlos:

| Par | Ratio | Cumple |
|---|---|---|
| tinta-900 sobre arena-100 | 14.63 | AAA |
| tinta-600 sobre arena-100 | 4.98 | AA |
| turquesa-700 sobre arena-100 | 4.85 | AA |
| arena-50 sobre turquesa-700 | 5.05 | AA |
| tinta-900 sobre ámbar-500 | 7.89 | AAA |
| tinta-900 sobre coral-500 | 5.62 | AA |
| arena-50 sobre coral-700 | 5.32 | AA |
| arena-500 (borde) sobre arena-100 | 3.41 | AA no-texto |
| crema-100 sobre noche-900 | 16.47 | AAA |
| crema-500 sobre noche-900 | 6.77 | AA |
| turquesa-400 sobre noche-900 | 8.76 | AAA |

**Prohibiciones que salen de esto:**

- `turquesa-500` sobre arena da 2.85 → **nunca como texto ni ícono** en modo claro.
  Es un color de decoración, de fondo y de gráfico. Para texto va `turquesa-700`.
- `coral-500` con texto blanco encima da 3.89 → **el texto sobre coral-500 es
  `tinta-900`**, no blanco. Si hace falta blanco, el fondo es `coral-700`.
- `ambar-500` nunca lleva texto claro encima. Siempre `tinta-900`.

### 2.4 La proporción

Aproximadamente, en cualquier pantalla:

- **60% arena** — la superficie.
- **30% tinta** — texto y estructura.
- **7% turquesa** — todo lo que se puede clickear.
- **3% ámbar + coral** — acentos, estados, alertas. Si en una pantalla hay más
  ámbar que turquesa, algo se rompió.

El cielo queda fuera de la cuenta: aparece solo en gráficos y en badges de
información neutra.

---

## 3. Tipografía

**Display: Bricolage Grotesque.** Variable, en Google Fonts, con ejes de ancho y
tamaño óptico. Es una grotesca con quiebres raros que se lee moderna sin ser la
enésima geométrica. Titulares — y desde el PR 1 de la ronda de fixes, también
los títulos de `/app` y `/portal` (antes eran Inter en todo, lo que se leía como
"genérico"; ver §1.8 de `docs/plan/2026-08-27-plan-fixes.md`). El cuerpo sigue
sin tocarla.

**Cuerpo e interfaz: Geist.** Variable, neutra, resuelta en tablas y formularios.
Reemplaza a Inter (PR 1 de la ronda de fixes) para cambiar el par tipográfico
completo sin perder legibilidad en pantallas densas. Es donde el interno vive
ocho horas por día y ahí la personalidad es un costo. Se carga con la variable
`--font-geist`; `--font-sans` la apunta. (Alternativa acordada si no rinde en
`/app`: General Sans vía `next/font/local` — se decidió que Geist alcanzaba.)

**Datos: Geist Mono.** Ya está configurada. Números tabulares, CUIT, fechas,
contadores `0/X`, ids, código. Es la firma de "estudio de ingeniería" sin invadir
el cuerpo.

Bricolage y Geist se cargan con `next/font/google` (`display: "swap"`, subconjunto
latino), que las autoaloja y elimina la petición a Google — importante porque el
CSP del sitio no debería tener que abrirse a `fonts.gstatic.com`.

### Escala

Escala modular de razón 1.25 sobre 16px, con `clamp()` para que el hero respire en
desktop sin explotar en móvil.

| Token | Tamaño | Uso |
|---|---|---|
| `--text-hero` | `clamp(3rem, 9vw, 7rem)` | Solo el H1 del hero. Bricolage 800, tracking `-0.03em` |
| `--text-display` | `clamp(2.25rem, 5vw, 3.75rem)` | H1 de páginas. Bricolage 700 |
| `--text-h2` | `clamp(1.75rem, 3vw, 2.5rem)` | Bricolage 600. H1 de `/portal` |
| `--text-h3` | `1.5rem` | Bricolage 600. H1 de `/app`, subtítulos |
| `--text-lead` | `1.25rem` | Geist 400, `line-height: 1.6` |
| `--text-body` | `1rem` | Geist 400, `line-height: 1.65` |
| `--text-sm` | `0.875rem` | Interfaz, tablas |
| `--text-xs` | `0.75rem` | Badges, metadatos. Nunca para texto que haya que leer |

**Reglas:** el ancho de línea máximo del texto largo es `68ch`. Los titulares en
Bricolage siempre llevan tracking negativo (`-0.02em` a `-0.03em`); Geist, nunca.
Ningún título de `/app` ni `/portal` queda en la fuente de cuerpo — llevan
`font-heading` más `text-h2` / `text-h3` (PR 1 de la ronda de fixes). Las
etiquetas chicas de sección (`text-sm font-medium`) no son títulos y siguen en
Geist.

---

## 4. Forma, espacio y superficie

**Grilla de espacio:** múltiplos de 4px. Los espacios de sección son 96px en
desktop y 64px en móvil; entre bloques, 32px; dentro de un bloque, 16px.

**Radios:** `--radius: 0.75rem`. La escala de shadcn ya deriva el resto. Los
botones usan `--radius-md`, las cards `--radius-lg`, los contenedores grandes y las
superficies vidriadas `--radius-2xl`. El pill (`9999px`) queda solo para badges y
para el chip de filtro.

**Elevación.** No hay sombras negras. Las sombras son **tinta con tinte cálido**,
porque una sombra gris sobre arena se ve sucia:

```
--sombra-sm:  0 1px 2px oklch(0.254 0.009 159.4 / 0.06)
--sombra-md:  0 4px 12px oklch(0.254 0.009 159.4 / 0.08)
--sombra-lg:  0 12px 32px oklch(0.254 0.009 159.4 / 0.10)
--sombra-cal: 0 8px 24px oklch(0.649 0.114 182 / 0.18)   /* glow turquesa, solo en hover de CTA */
```

Cuatro niveles y no más. En dark mode las sombras casi desaparecen y la elevación se
comunica con el color de la superficie (`noche-800` sobre `noche-900`).

**Grano.** Todas las superficies de página grandes llevan una capa de grano SVG
(`feTurbulence`, opacidad 0.025-0.04, `mix-blend-mode: multiply`). Es un solo
elemento en el layout raíz, `pointer-events: none`, y cuesta prácticamente nada.
Es lo que hace que el arena se lea como material y no como un `#FAF6EF` plano.

**Vidrio.** El efecto glass existe pero está racionado: solo en el header al
scrollear, en el diálogo modal y en los controles flotantes del organigrama.
`backdrop-filter: blur(16px) saturate(1.4)` sobre `--background` al 72%, con un
borde de 1px en `--foreground / 8%`. **Nunca vidrio sobre vidrio** y nunca en una
lista de items.

---

## 5. Movimiento

### 5.1 El presupuesto

Esta es la decisión que más aprieta las notas originales, así que va explícita:

> **Hay exactamente un background WebGL en toda la plataforma: el hero de `/`.**
> Todo lo demás se anima con CSS, SVG o canvas 2D.

`Backgrounds.md` lista 45 candidatos. La razón para el techo no es estética sino
física: cada uno de esos componentes arrastra `ogl` o `three`, monta un contexto
WebGL, corre un `requestAnimationFrame` continuo y en un celular de gama media
compite con el hilo principal por el mismo presupuesto. Dos en la misma página
duplican el costo. Cuatro hacen que un sitio que quiere decir "modernidad" se sienta
lento, que es la única forma segura de decir lo contrario.

Los 45 no se descartan: se convierten en un **catálogo de referencia visual** del que
se toman ideas para los fondos baratos. Lo que se descarta es instanciarlos.

### 5.2 El hero: "calor que distorsiona"

Un componente propio, `<EspejismoHero>`, construido a partir de `grid-distortion` y
`waves` de React Bits y reteñido a la paleta.

- **En reposo:** un campo de gradiente arena → turquesa que ondula lento, como aire
  caliente sobre asfalto. Ciclo de 12 segundos, amplitud baja.
- **Con el cursor:** una estela de calor sigue al mouse y deforma lo que hay debajo.
  Cuando pasa cerca del título, las letras se doblan y vuelven. El nombre de la
  empresa se explica solo.
- **En scroll:** la distorsión se apaga y el gradiente se desplaza, cumpliendo lo
  que pide `Inicio.md` — que el hero tenga una dinámica distinta al resto.

**Obligaciones técnicas, todas bloqueantes:**

- `next/dynamic` con `ssr: false` y un `loading` que es el póster estático.
- Se monta solo cuando entra al viewport (`IntersectionObserver`) y **pausa el RAF
  al salir** y con `document.visibilityState === "hidden"`.
- **Fallback obligatorio en tres casos**, y el fallback es un póster CSS (gradiente
  + grano, sin JS): `prefers-reduced-motion: reduce`, viewport `< 768px`, y
  `navigator.hardwareConcurrency <= 4`.
- No participa del LCP: el H1 y el subtítulo son HTML del servidor y se pintan
  antes de que el shader exista.

### 5.3 Las capas baratas

Todo el resto del ambiente:

- **`<CampoArena>`** — la capa de fondo por defecto de toda página que no es el
  hero. Gradiente cónico animado por CSS + grano. Cero JS. Cambia de tinte según la
  sección (arena → arena+turquesa → arena+ámbar) para dar variedad sin cambiar de
  técnica.
- **Page breaks.** Franjas de color contundente que cortan la página. La regla de
  `Inicio.md` se respeta al pie de la letra: **después de un break fuerte se vuelve
  al fondo que había antes**. Un break es una interrupción, no un cambio de tema.
  Máximo dos por página.
- **Revelado al scrollear.** Entradas de 400ms con desplazamiento de 16px y opacidad,
  vía `IntersectionObserver` una sola vez (nunca reversible: reanimar al subir
  marea). Escalonado de 60ms entre hermanos, máximo 6 elementos.

### 5.4 Tiempos y curvas

| Token | Valor | Uso |
|---|---|---|
| `--dur-micro` | 120ms | Hover, focus, cambios de color |
| `--dur-rapida` | 200ms | Botones, chips, tooltips |
| `--dur-media` | 320ms | Paneles, acordeones, drawers |
| `--dur-entrada` | 400ms | Revelado al scrollear |
| `--dur-ambiente` | ≥ 8s | Loops de fondo. Nunca menos |
| `--ease-salida` | `cubic-bezier(0.22, 1, 0.36, 1)` | Lo que aparece |
| `--ease-entrada` | `cubic-bezier(0.55, 0, 1, 0.45)` | Lo que se va |
| `--ease-suave` | `cubic-bezier(0.4, 0, 0.2, 1)` | Todo lo demás |
| `--resorte` | rigidez 170, amortiguación 26 | Organigrama, drag |

### 5.5 `prefers-reduced-motion`

No es una casilla que se tilda al final. Con la preferencia activa:

- El hero WebGL no se monta. Punto.
- Los loops de ambiente se congelan en un fotograma.
- Los revelados al scrollear pasan a opacidad pura de 120ms.
- El organigrama pierde el resorte: los nodos saltan a su posición.
- Todo lo que comunica estado (focus, loading, error) **sigue funcionando**. Reducir
  movimiento no es quitar retroalimentación.

---

## 6. Componentes

### 6.1 Botones

`Button.tsx` ya existe sobre Base UI. Se le agregan variantes, no se reescribe.

| Variante | Reposo | Hover | Uso |
|---|---|---|---|
| `primary` | turquesa-700, texto arena-50 | glare especular que barre + `--sombra-cal` | Una por pantalla |
| `secondary` | arena-200, borde arena-500 | arena-300 | Acciones normales |
| `ghost` | transparente | arena-200 | Barras de herramientas, filas |
| `destructive` | coral-700, texto arena-50 | coral-500 + texto tinta-900 | Borrar, rechazar |
| `link` | turquesa-700 subrayado | subrayado que crece de izquierda | Enlaces en prosa |

El glare especular viene de `specular-button` de React Bits. **Solo en `primary`**;
si todos los botones brillan, ninguno se distingue, que es justo lo contrario de lo
que pide `button.md`.

`click-spark` se reserva para el CTA principal del hero y para el botón de enviar
del formulario de contacto. En ninguna otra parte.

`magnet` y `tilted-card` **no entran** en botones: en una tabla o un formulario del
interno, un botón que se escapa del cursor es un defecto, no un detalle.
`star-border` entra únicamente en el CTA del hero.

Todos los botones: altura mínima 44px en touch, `:focus-visible` con anillo de 2px
en `--ring` y offset de 2px, y estado `:active` que baja 1px.

### 6.2 Header

Un solo componente, tres modos, tal como pide `header.md`:

- **Arriba de todo, en la landing:** completamente transparente, sin borde, texto en
  `crema-100` con sombra sutil para sobrevivir al gradiente del hero. Se mimetiza.
- **Al scrollear (a partir de 80px):** transición de 320ms a vidrio — `--background`
  al 72% con blur, borde inferior en `--border`, texto en `--foreground`, altura
  reducida de 80px a 64px.
- **En el interno y el portal:** siempre en modo sólido. No hay hero del que
  mimetizarse y el estado cambiante distrae cuando se usa todo el día.

En móvil el menú es `staggered-menu` de React Bits: overlay a pantalla completa con
los ítems entrando escalonados. En desktop, nav horizontal común.

**El lanyard.** Un cordón colgando de la esquina superior derecha, solo en desktop y
solo en la landing. Se agarra con el mouse, tiene física de cuerda, y al tirar hacia
abajo hace *click* y cambia el tema — como la cadena de una lámpara. Base:
`lanyard` de React Bits.

Condiciones no negociables:

- Es **un adorno sobre un control real**. El toggle accesible de tema vive en el
  header, es un `<button>` con `aria-label`, y funciona con teclado. El cordón lo
  acompaña, no lo reemplaza.
- No se monta en móvil, ni con `prefers-reduced-motion`, ni si el hero cayó al
  fallback.
- El tema se persiste y se lee antes del primer pintado con un script inline en
  `<head>`, para que no haya flash de tema equivocado.

### 6.3 Footer

Idéntico en las tres superficies. Su trabajo, según `footer.md`, es decir "acá se
terminó": no hay contenido faltante ni nada colgado cargando.

Se logra con una señal visual clara, no con un componente animado: banda en
`--muted` a todo el ancho, borde superior de 1px, y una línea de degradado
horizontal de 2px (turquesa → ámbar → coral) justo arriba del borde. Esa línea es la
firma de la marca y es lo que hace de tope visual.

Contenido: logotipo, tres columnas (Empresa, Servicios, Contacto), datos de contacto
reales, y `Mirage — 2026`. En el interno el footer es una sola línea con la versión
del build.

### 6.4 Cards

Tres tipos y no más:

- **`CardContenido`** — servicios y casos en la landing. Fondo `--card`, borde,
  imagen o campo de color, `--sombra-md`. En hover: elevación a `--sombra-lg` y una
  inclinación de 1.5° máximo. Base: `spotlight-card` de React Bits, con la luz del
  spotlight en `turquesa-200`.
- **`CardProyecto`** — el interno. Más densa: fondo de color o imagen, título,
  descripción de dos líneas, el contador `0/X` arriba a la derecha en Geist Mono, y
  avatares apilados de los inscriptos. Sin inclinación: es una grilla de trabajo.
- **`CardDato`** — métricas y KPIs del inicio del interno. Número grande en Geist
  Mono, etiqueta chica, variación con flecha en turquesa o coral.

`border-glow` se usa en una sola situación: marcar la card del proyecto en el que el
usuario está inscripto.

### 6.5 Formularios

Inputs con fondo `--card`, borde `--input` (arena-500, el que sí se ve), radio
`--radius-md`, altura 44px. En foco: borde `--ring` y anillo exterior de 3px en
`turquesa-200`. Errores en `--destructive` con el texto debajo, **nunca solo con
color**: siempre hay un ícono y una frase.

Etiquetas siempre visibles arriba del campo. Nada de placeholders que hacen de
etiqueta: desaparecen al escribir y dejan al usuario sin saber qué campo llenó.

`curved-input` de React Bits entra solo en el formulario de la página de Contacto,
que es donde el gesto vale.

### 6.6 Tablas y listas

El interno vive acá. Fila de 48px, cabecera pegajosa en `--muted`, filas alternadas
en `--arena-50`, hover en `--secondary`. Números y fechas en Geist Mono con
`font-variant-numeric: tabular-nums`. Orden por columna y filtro por chips.

En móvil, cada fila colapsa a una card de dos líneas. Una tabla con scroll horizontal
en el celular es una tabla que nadie va a leer.

### 6.7 Estados vacíos, carga y error

Toda pantalla que carga datos define los tres. No es opcional y no se deja para
después.

- **Vacío:** ilustración de una sola línea en `arena-400`, una frase que dice qué es
  esto, y el botón para crear el primero. `"Todavía no hay clientes cargados."` sin
  acción es una pantalla que no ayuda.
- **Carga:** skeletons con la forma del contenido real, pulso de 1.6s. Nunca un
  spinner centrado en una página completa.
- **Error:** qué falló en lenguaje humano, qué puede hacer el usuario, y un botón de
  reintentar. Nunca un código de error solo.

### 6.8 El inventario cerrado de React Bits

Estos son los únicos componentes que entran. Cada uno llega en su propio PR,
reteñido a la paleta, probado contra `prefers-reduced-motion` y contra móvil.

| Componente | Dónde | Por qué |
|---|---|---|
| `grid-distortion` + `waves` | Hero de `/` | La firma |
| `specular-button` | Botón primario | El glare |
| `click-spark` | CTA del hero, enviar contacto | Recompensa del click |
| `star-border` | CTA del hero | Distinguir la acción principal |
| `spotlight-card` | Servicios, casos | Hover de las cards |
| `border-glow` | Card de proyecto propio | Marcar pertenencia |
| `staggered-menu` | Header móvil | Menú |
| `lanyard` | Header desktop landing | El interruptor de la lámpara |
| `card-swap` | Sección de capacidades en `/` | Pila de cards que rotan |
| `flowing-menu` | Índice de secciones en `/` | Navegación expresiva |
| `masonry` | Grilla de testimonios en Casos | Alturas desparejas |
| `profile-card` | Ficha de persona | Ya elegido en `Personas.md` |
| `curved-input` | Formulario de contacto | Ya elegido en `Contacto.md` |
| `gradual-blur` | Bordes de zonas con scroll | Insinuar que hay más |

Todo lo demás de las notas queda como catálogo de inspiración. Agregar uno nuevo
requiere sacar otro.

---

## 7. Las tres superficies

| | `/` público | `/app` interno | `/portal` cliente |
|---|---|---|---|
| Registro | Expresivo | Mismo lenguaje, volumen bajo | Intermedio |
| Fondo | Hero WebGL + `CampoArena` | `CampoArena` casi quieto | `CampoArena` suave |
| Densidad | Aire, 96px entre secciones | Densa, 32px | Media, 48px |
| Vidrio | Header, modales | Solo modales | Solo modales |
| Movimiento | Completo | Micro-interacciones y el organigrama | Micro-interacciones |
| Navegación | Header horizontal | Barra lateral colapsable | Header horizontal corto |
| Ancho | Full-bleed con contenido a 1200px | Full-bleed, sin límite | 1000px |

**El interno cambia de navegación.** Hoy es un `<nav>` horizontal con siete enlaces
en el header, que ya está apretado y que no aguanta el octavo. Pasa a una barra
lateral de 240px, colapsable a 64px con solo íconos, con el estado persistido. La
sección activa se marca con una barra de 3px en turquesa a la izquierda, no
pintando el ítem entero.

---

## 8. Pantalla por pantalla

### 8.1 Landing — Inicio (`/`)

1. **Hero.** `<EspejismoHero>` a pantalla completa. H1 "Mirage" en `--text-hero`,
   una bajada de dos frases en `--text-lead`, un CTA primario (`Ver servicios`) con
   `star-border` y `click-spark`, y un secundario (`Contactanos`). Indicador de
   scroll al pie.
2. **Qué hacemos.** Tres capacidades en `card-swap` — la pila rota sola y se puede
   agarrar. Fondo: `CampoArena` en tinte arena+turquesa.
3. **Page break fuerte.** Franja turquesa-700 a todo el ancho con una sola frase
   grande en crema. 40vh.
4. **Cómo trabajamos.** Vuelta al fondo anterior (regla de `Inicio.md`). Cuatro
   pasos en línea de tiempo horizontal que se dibuja al scrollear.
5. **Servicios destacados.** Tres `CardContenido` traídas de la base, con enlace a
   `/servicios`.
6. **Prueba social.** Dos testimonios y los logos de clientes. Con dos clientes
   activos esto es chico a propósito: mejor chico y verdadero que grande e inflado.
7. **Cierre.** `flowing-menu` con las cuatro secciones del sitio, tamaño grande, que
   funciona como índice y como despedida.
8. **Footer.**

### 8.2 Landing — Servicios (`/servicios`)

Cards **alargadas y apiladas**, no lado a lado, como pide `Servicios.md`. La
implementación es scroll-stacking: cada card es `position: sticky` y la siguiente se
monta encima con un desplazamiento de 24px, dejando ver el borde superior de las de
abajo. En móvil se convierte en una lista vertical normal.

Cada card abre a `/servicios/[slug]`: imagen o campo de color, descripción larga en
Markdown (ya hay `contenido-markdown.tsx`), tecnologías como chips, un caso
relacionado si existe, y un CTA de contacto que precarga el asunto.

El contenido sale de `contenido_servicio`, que ya existe. Lo que falta y entra en
este trabajo es el **panel de administración en `/app/contenido`** para que los
usuarios internos creen y publiquen servicios sin un deploy. El formulario
estandariza los campos, que es lo que pedía la nota: nombre, resumen, cuerpo,
imagen o color, orden, activo, proyecto de origen.

### 8.3 Landing — Casos (`/casos`)

Dos mitades.

**Arriba, testimonios** en `masonry` de alturas desparejas, cada uno como una cita
grande en Bricolage con el nombre y la empresa debajo.

**Abajo, el recomendador.** Un cuestionario tipo Akinator: una pregunta por
pantalla, 4 a 6 preguntas, transición lateral entre pasos, barra de progreso. El
árbol de decisión es un archivo de configuración tipado en el repo
(`src/lib/recomendador/arbol.ts`) — sin base de datos, sin backend, editable en cinco
minutos. Termina en una recomendación de servicio con un botón que lleva a
`/contacto` con el contexto ya cargado en el mensaje.

Estado en la URL (`?p=3&r=a,c,b`) para que se pueda compartir y volver atrás con el
botón del navegador.

### 8.4 Landing — Contacto (`/contacto`)

Dos columnas en desktop, apiladas en móvil.

Izquierda: los métodos directos, cada uno como un bloque grande y clickeable —
WhatsApp (`wa.me` con mensaje precargado), mail (`mailto:` a
mirage.software.ar@gmail.com), teléfono (`tel:`). Cada uno con su ícono y con el
dato visible, no escondido detrás del enlace.

Derecha: el formulario con `curved-input`. Nombre, email, tipo de consulta, mensaje.
Envía por Resend, que ya está en las dependencias. Confirmación en la misma página
con `click-spark`, sin redirección.

### 8.5 Inicio de sesión (`/ingresar`)

Layout propio, sin header ni footer del sitio, como pide `InicioSesion.md`. Panel
centrado sobre el `CampoArena` en su versión más oscura.

**Dos entradas separadas**, elegidas con un selector de dos pestañas arriba del
formulario: *Equipo Mirage* → `/app`, *Clientes* → `/portal`. La preferencia se
recuerda. El campo de la contraseña, el "olvidé mi contraseña" y el restablecimiento
ya están implementados y solo se repintan.

### 8.6 Interno — Inicio (`/app`)

El vistazo a los engranajes que pide `Inicio/Inicio.md`.

Fila de `CardDato`: proyectos activos, tareas propias abiertas, solicitudes sin
responder, personas. Debajo, tres columnas: *Mis tareas de hoy*, *Actividad reciente*
(del bus de eventos que ya existe), *Solicitudes que me esperan*. Cada bloque enlaza
a su sección. Al pie, una miniatura del organigrama, no interactiva, que enlaza a la
pantalla completa.

Fondo `CampoArena` casi quieto. Es la pantalla que se ve más veces por día; tiene que
envejecer bien.

### 8.7 Interno — Organigrama (`/app/organigrama`)

El árbol radial con física de resorte.

- **Posición canónica.** Cada nodo tiene un lugar determinado por su anillo
  (profundidad en el árbol) y su rama. Las dos jefaturas — interna y externa — en el
  centro. El anillo sigue significando granularidad y la rama sigue significando
  autoridad, que es lo que dice el modelo de la empresa.
- **La física es diversión, no estructura.** Los nodos se agarran y se arrastran,
  empujan a sus vecinos con colisión real, tiemblan, y vuelven a su lugar con el
  resorte al soltar. Es lo que querías: que sea entretenido tocarlo. La información
  no cambia nunca porque el usuario haya jugado con él.
- **El círculo exterior** encierra el anillo más profundo y crece o se achica con
  animación cuando se agrega o quita un nodo, tal como pide la nota.
- **Color por rama:** turquesa la interna, ámbar la externa. **Tamaño por cantidad de
  personas asignadas.** Un nodo sin nadie asignado se dibuja punteado — se ve de un
  vistazo qué responsabilidad está huérfana.
- **Al clickear un nodo:** panel lateral con la responsabilidad, sus personas, sus
  hijos, y las acciones de edición si el usuario tiene permiso.
- **Rendimiento:** SVG con posiciones calculadas en un `useMemo`, no WebGL. Con 5
  personas y unas decenas de nodos, SVG sobra y se puede leer con lector de pantalla.
  Hay una lista jerárquica equivalente detrás de un botón "Ver como lista", que es la
  versión accesible y la que se imprime.

### 8.8 Interno — Personas (`/app/personas`)

Grilla de `profile-card`: foto, nombre, los nodos del organigrama que ocupa, y un
indicador de carga (cuántos nodos, en verde/ámbar/coral según si son 1-2, 3, o 4+).
Ver a alguien en coral es la señal de sobrecarga que el modelo de la empresa quiere
que se vea.

Buscador y filtro por rama. La ficha individual muestra el detalle y, si el usuario
está por encima en el organigrama, los controles de edición. Los que no puede tocar
se muestran deshabilitados con el motivo en un tooltip, no ocultos: entender la
jerarquía es parte del punto.

### 8.9 Interno — Clientes (`/app/clientes`)

Listado en tabla densa con búsqueda, filtro por estado y orden por columna. Estado
como badge (turquesa activo, tinta-400 inactivo). CUIT en Geist Mono.

**La ficha es la pantalla protagonista.** Cabecera con nombre, estado, y las acciones.
Debajo, cuatro bloques:

1. **Datos y contactos** — con quién se habla y cómo.
2. **Proyectos vinculados** — `CardProyecto` en versión compacta.
3. **Solicitudes abiertas** — las del portal de ese cliente.
4. **Línea de tiempo de interacciones** — vertical, con el tipo de interacción
   (llamada, mail, reunión, WhatsApp), la fecha, quién la registró y la nota. Se
   agrega una interacción desde un campo al pie de la línea.

Ese cuarto bloque es el que justifica la pantalla: es la memoria de la relación que
hoy vive dispersa en WhatsApp y en la cabeza de quien atendió.

### 8.10 Interno — Proyectos (`/app/proyectos`)

Grilla de `CardProyecto` con imagen o campo de color y descripción breve. **Los
proyectos donde el usuario está inscripto van primero**, con `border-glow`.

Cada card lleva arriba a la derecha el contador `0/X` en Geist Mono, con el anillo de
progreso alrededor. El cupo se define al crear el proyecto y el líder lo cambia
cuando quiere. Si hay lugar, la card ofrece "Anotarme"; si está lleno, el contador se
pone en coral y el botón se deshabilita.

Filtros: mis proyectos / todos / por cliente / por estado. Un proyecto puede no tener
cliente y eso es normal, no un dato faltante.

La ficha suma: descripción larga, equipo, fechas, repositorios (ya implementados),
tareas, actividad y solicitudes relacionadas.

### 8.11 Interno — Tareas (`/app/tareas`)

Dos vistas apiladas en la misma pantalla, como pide `Tareas.md`.

**Arriba, el Kanban.** Columnas por estado, tarjetas arrastrables con
`@dnd-kit`. Cada tarjeta: título, proyecto (con su color), responsable, fecha límite y
prioridad. Filtro por proyecto y por persona. Crear una tarea es un compositor inline
al pie de la columna, no un modal. Los permisos de creación y de mover salen del
sistema de roles que ya existe.

**Abajo, el Gantt.** Muestra las tareas con fechas y las barras de los proyectos donde
el usuario está inscripto. Con permiso suficiente:

- Arrastrar el centro de una barra la desplaza entera.
- Arrastrar un extremo la alarga o la acorta.
- Doble click abre la tarea.

**Hitos:** marcadores que se colocan en una fecha, con nombre y color. Se dibujan como
un rombo sobre la línea de tiempo, con una línea vertical punteada que baja por todo
el Gantt. Cuando la fecha se acerca y hay tareas sin terminar antes de ella, el rombo
pasa a coral.

Zoom en tres niveles (semana, mes, trimestre) y el rango se guarda en la URL. Ambas
vistas leen del mismo estado: mover una tarjeta en el Kanban se refleja en el Gantt
sin recargar.

En móvil el Gantt no se dibuja: se ofrece una lista por fecha. Un Gantt en 390px es un
Gantt que nadie usa.

### 8.12 Interno — Solicitudes (`/app/solicitudes`)

Bandeja tipo ticketera. Lista a la izquierda, hilo a la derecha en desktop; navegación
por pantallas en móvil. Estados como chips de color. Sin leer, en negrita con un punto
turquesa.

El filtrado por proyecto ya está implementado en el backend — un usuario solo ve los
tickets de los proyectos donde está inscripto. La UI **muestra explícitamente que está
filtrando** ("Ves las solicitudes de tus 3 proyectos"), porque una bandeja vacía sin
explicación se lee como un error.

El hilo es una conversación: mensajes alternados, el del cliente sobre `--muted`, el
interno sobre `turquesa-50`. Al pie, el compositor y las acciones de estado.

### 8.13 Interno — Notificaciones (`/app/notificaciones`)

Campana en el header con el contador de no leídas. Panel desplegable con las últimas
diez; página completa con el historial, filtros por tipo y marcar todas como leídas.

**Cada notificación es un enlace a su origen**, que es el requisito de la nota. Nunca
hay una notificación que informa de algo y te deja buscando dónde pasó. Ícono por
tipo, texto en una línea, tiempo relativo ("hace 2 h") con la fecha exacta en el
`title`.

La pantalla de administración de plantillas y suscripciones ya existe; se repinta y se
mueve a `/app/ajustes/notificaciones`.

### 8.14 Portal del cliente (`/portal`)

Registro intermedio: más cálido que el interno, más sobrio que la landing. Ancho de
1000px, navegación de tres ítems.

Inicio con el estado de sus proyectos (solo progreso, sin internals, como ya está
resuelto), sus solicitudes abiertas y un botón grande de "Nueva solicitud". El alta y
el hilo de solicitudes ya están implementados y solo se repintan.

Es la pantalla que reemplaza al WhatsApp. Tiene que sentirse ordenada y clara antes
que impresionante.

---

## 9. Accesibilidad y rendimiento

**Presupuestos duros.** Un PR que los rompe no entra:

- LCP en `/` con 4G simulado y CPU 4× ralentizada: **≤ 2.5s**.
- JS enviado en la primera carga de `/`, sin contar el shader: **≤ 180 KB comprimido**.
- El shader del hero: **≤ 120 KB**, siempre `dynamic` y nunca en el bundle inicial.
- CLS: **≤ 0.05**. Toda imagen y todo contenedor de shader con dimensiones reservadas.
- El interno: cualquier pantalla interactiva en **≤ 1.5s** en la red de la oficina.

**Accesibilidad, nivel AA:**

- Los contrastes de §2.3 son los verificados; usar otros pares requiere volver a medir.
- Foco visible en todo lo enfocable. Nunca `outline: none` sin reemplazo.
- El color nunca es el único portador de información: estado = color + texto o ícono.
- Objetivos táctiles ≥ 44×44px.
- El organigrama, el Kanban y el Gantt tienen alternativa por teclado y una vista de
  lista equivalente. Un tablero que solo funciona con mouse excluye a quien no puede
  usarlo, y también a quien está en una tablet.
- Landmarks (`header`, `nav`, `main`, `footer`), un solo `<h1>` por página, jerarquía
  de encabezados sin saltos.
- `prefers-reduced-motion` respetado según §5.5.
- El sitio se navega entero con teclado, empezando por el salto a contenido.

---

## 10. Lo que queda explícitamente afuera

Para que no se cuele por el costado más adelante:

- **Backgrounds WebGL adicionales.** Uno, el del hero. El resto del catálogo de
  `Backgrounds.md` es referencia visual.
- **`magnet` y `tilted-card` en controles funcionales.** Solo decoración, y de momento
  ninguna decoración los necesita.
- **`fluid-glass` y `glass-surface`.** El vidrio se resuelve con `backdrop-filter`
  propio y racionado. Los componentes de React Bits para esto traen WebGL y no
  justifican el costo.
- **Un editor visual de páginas.** El panel de contenido edita servicios y casos con
  campos y Markdown. Un constructor de páginas es otro producto.
- **Multi-idioma.** Todo en español. La estructura de rutas no lo bloquea para después.
- **Personalización de tema por usuario** más allá de claro/oscuro.

---

## 11. Contradicciones con las notas originales

Cinco, todas deliberadas:

1. **`Backgrounds.md` pedía mix and match entre 45 fondos.** Queda uno WebGL y una
   familia de fondos baratos que varían de tinte. Razón: rendimiento en móvil y
   coherencia.
2. **`Organigrama.md` pedía esferas que chocan libremente.** Chocan, pero desde una
   posición canónica y con resorte de vuelta. Razón: el anillo tiene que seguir
   significando granularidad, y vos confirmaste que la física era para divertir, no
   para informar.
3. **`button.md` listaba once efectos.** Entran cuatro y cada uno en un lugar
   determinado. Razón: si todo brilla, nada se distingue, que es lo contrario de lo
   que la nota quería lograr.
4. **`Servicios.md` mencionaba `masonry`.** Masonry sirve para alturas desparejas y las
   cards de servicio son apiladas y uniformes. `masonry` se muda a los testimonios de
   Casos, donde sí hay alturas desparejas.
5. **El nav horizontal del interno.** Pasa a barra lateral. Razón: siete ítems ya
   aprietan y con el panel de contenido y los ajustes son nueve.
