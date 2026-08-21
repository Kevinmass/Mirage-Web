# Mirage-Web — plan de implementación del frontend

**Fecha:** 21 de agosto de 2026
**Basado en:** `docs/specs/2026-08-21-sistema-visual-mirage.md` (aprobado)
**Ejecutor:** una persona, part-time (~8-10 h/semana), asistida por Claude Code
**Estado:** propuesto

---

## 0. Cómo leer este plan

**12 PRs.** El límite es deliberado y lo pediste vos: no inflar el repositorio con
cuarenta ramas de frontend. La consecuencia es que cada PR es grande — entre 2 y 5
sesiones de trabajo — y eso cambia cómo hay que trabajarlos.

Tres reglas que valen para los doce:

1. **Un PR grande sigue siendo una serie de commits chicos.** Cada commit compila,
   pasa los tipos y deja el árbol usable. Si el PR 11 se abandona a la mitad, lo que
   está commiteado no rompe nada. Esto es lo que reemplaza a tener PRs chicos.
2. **Todo lo que no está terminado va detrás de una ruta que nadie linkea.** Igual
   que en el plan v1. Una pantalla a medio pintar no se enlaza desde la navegación.
3. **La definición de terminado de §2 se aplica a los doce.** No hay un PR de
   accesibilidad ni uno de rendimiento al final: eso se verifica en cada uno. Un PR
   que no pasa la lista no se mergea.

Las estimaciones están en **sesiones** (una sesión ≈ 3-4 h reales). A 8-10 h por
semana son 2-3 sesiones semanales.

### El orden

**Tokens → landing → interno**, como decidiste. El razonamiento:

- El PR 1 es un cuello de botella real: cambia `globals.css`, y cualquier pantalla
  pintada antes de que existan los tokens hay que repintarla. Va solo y va primero.
- La landing es lo que le falta a Mirage para tener credibilidad frente a un
  prospecto. Es también lo que se puede mostrar antes.
- El interno ya funciona en gris. Es feo, pero nadie está bloqueado. Puede esperar.

---

## 1. Las brechas de modelo que aparecieron

Revisando los schemas antes de planificar apareció que **parte de lo que las notas
llaman "frontend" es modelo nuevo**. Está listado acá arriba de todo para que no
sorprenda a mitad de un PR.

### 1.1 No existen las inscripciones a proyectos — **decisión de negocio**

Hoy "mis proyectos" y "mis tareas" se derivan de los nodos del organigrama que la
persona ocupa. `Proyectos.md` pide otra cosa: un contador `0/X` de inscriptos, un
cupo que el líder cambia cuando quiere, y proyectos propios primero en la grilla.
`Solicitudes.md` pide, encima, filtrar los tickets por los inscriptos al proyecto.

Eso requiere una tabla `proyectos_inscripcion` y una columna `cupo`.

**No choca con el organigrama.** Son dos preguntas distintas y las dos hacen falta:

- `nodo_responsable_id` — *qué responsabilidad es dueña de este trabajo.* Sobrevive a
  que la persona se vaya. Es lo que hace que una tarea nunca quede huérfana.
- `proyectos_inscripcion` — *quién lo está haciendo hoy.* Es de quién es la carga, y
  es lo que la UI necesita para decir "tus proyectos".

Entra en el **PR 10**, que por eso es el pivote del plan: el PR 11 y el PR 12
dependen de él.

### 1.2 La bandeja interna de solicitudes no filtra

`modules/solicitudes/api.ts` lo dice explícito: *"Bandeja interna: todas, sin filtrar
por cliente."* El aislamiento que está implementado y probado es el del portal — un
cliente ve solo lo suyo. Lo que pide la nota es un filtro interno que no existe.

Depende de 1.1 y entra en el **PR 12**.

### 1.3 Las migraciones chicas

| Qué falta | Para qué | PR |
|---|---|---|
| `contenido_servicio`: `slug`, `cuerpo`, `imagen_url`, `color`, `proyecto_origen_id` | Página de detalle y campo de color de la card | 4 |
| `contenido_caso`: `testimonio`, `autor`, `cargo_autor`, `imagen_url` | Los testimonios de Casos | 5 |
| `clientes_interaccion.tipo`: agregar `whatsapp` | Es el canal real y hoy cae en "otro" | 9 |
| `proyectos_proyecto`: `cupo`, `color`, `imagen_url` | Cards y contador | 10 |
| `proyectos_inscripcion` (tabla) | §1.1 | 10 |
| `proyectos_tarea.empieza_en` | El Gantt necesita inicio, hoy solo hay `vence_en` | 11 |
| `proyectos_hito` (tabla) | Hitos y alertas del Gantt | 11 |

Todas aditivas, como manda el plan v1: agregar columnas y tablas, nunca renombrar ni
borrar en el mismo paso.

### 1.4 Dependencias nuevas

| Paquete | Para qué | PR |
|---|---|---|
| `@dnd-kit/core` + `@dnd-kit/sortable` | Arrastrar tarjetas del Kanban | 11 |
| `next-themes` *(o 20 líneas propias)* | Tema con persistencia sin flash | 2 |
| Componentes de React Bits | Se copian al repo con el CLI de shadcn, no son dependencias | varios |

`ogl` entra como dependencia transitiva del hero en el PR 3 y es la única pieza WebGL
de todo el proyecto.

---

## 2. Definición de terminado

Se aplica a los doce PRs. Va en la plantilla de PR del repositorio para que Claude
Code la tenga a la vista y no haya que recordarla.

**Código**

- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` y `pnpm build` en verde.
- [ ] Cero colores literales fuera de `globals.css`. Todo por token semántico.
- [ ] Ningún componente cliente nuevo que pudiera haber sido de servidor.
- [ ] Migraciones generadas con `drizzle-kit generate`, nunca escritas a mano.

**Visual**

- [ ] Se ve bien en **los dos temas**. No es "funciona": es que el oscuro está
      diseñado, no invertido.
- [ ] Se ve bien a **390px** de ancho. Sin scroll horizontal del `body`.
- [ ] Estados **vacío, cargando y error** definidos en toda pantalla que traiga datos.

**Accesibilidad**

- [ ] Navegable con teclado de punta a punta, con foco visible siempre.
- [ ] Los contrastes salen de la tabla del §2.3 del sistema visual. Un par nuevo se
      mide antes de usarlo.
- [ ] Ningún estado comunicado solo con color.
- [ ] `prefers-reduced-motion` respetado.
- [ ] Objetivos táctiles ≥ 44×44px.

**Rendimiento**

- [ ] En `/`: LCP ≤ 2.5s con 4G simulado y CPU 4× ralentizada.
- [ ] JS de primera carga en `/` ≤ 180 KB comprimido, sin contar el shader.
- [ ] CLS ≤ 0.05.

---

## 3. Mapa de los 12 PRs

| # | PR | Sesiones | Depende de |
|---|---|---|---|
| **A** | **Cimientos** | **6** | |
| 1 | Tokens, tipografía y primitivas | 3 | — |
| 2 | Chasis público: header, footer, tema e ingreso | 3 | 1 |
| **B** | **Landing** | **12** | |
| 3 | El hero y la portada | 4 | 2 |
| 4 | Servicios y el panel de contenido | 3 | 2 |
| 5 | Casos: testimonios y recomendador | 3 | 2 |
| 6 | Contacto | 2 | 2 |
| **C** | **Interno** | **17** | |
| 7 | Chasis interno: barra lateral y tablero | 3 | 1 |
| 8 | Organigrama y personas | 4 | 7 |
| 9 | Clientes: ficha y línea de tiempo | 2 | 7 |
| 10 | Inscripciones y proyectos | 3 | 7 |
| 11 | Tareas: Kanban y Gantt | 5 | 10 |
| **D** | **Cierre** | **3** | |
| 12 | Solicitudes, notificaciones y portal | 3 | 10 |

**Total: 38 sesiones ≈ 14-19 semanas.** A 2-3 sesiones por semana, unos cuatro meses.
La cara pública está terminada alrededor de la semana 7.

### Qué se puede hacer en paralelo

Los PRs 3, 4, 5 y 6 no se tocan entre sí: los cuatro dependen solo del PR 2 y cada uno
vive en su propia ruta. El PR 7 tampoco depende de la landing — solo del PR 1. Si en
algún momento hay dos manos, ahí está el corte.

Los PRs 10 → 11 → 12 son una cadena y no se pueden adelantar.

---

## 4. Fase A — Cimientos

### PR 1 — Tokens, tipografía y primitivas

*3 sesiones. Bloquea todo lo demás.*

El PR más importante y el que menos se ve. Nada acá cambia una pantalla: cambia el
vocabulario con el que se pintan las once siguientes.

**Qué entra**

1. **`globals.css` reescrito.** Las seis rampas del §2.1 del sistema visual como
   variables crudas, los tokens semánticos del §2.2 mapeados encima, y el bloque
   `.dark` completo. Se conserva la estructura de `@theme inline` que ya está.
2. **Los tres arreglos heredados de shadcn.** Van juntos porque son la razón por la
   que este PR no es cosmético:
   - `--accent` pasa a ser ámbar. Hay que **reasignar a `secondary` todos los hovers
     de menú e ítem que hoy usan `accent`**, o cada hover del interno se pinta de
     naranja.
   - `--border` y `--input` dejan de ser el mismo valor. El borde de control es
     `arena-500`, que sí llega a 3:1.
   - Las sombras pasan de negro a tinta cálida. Cuatro niveles, ni uno más.
3. **Tipografía.** `next/font/google` con Bricolage Grotesque, Inter y la mono, todas
   autoalojadas, subconjunto latino, `display: "swap"`. La escala del §3 como tokens.
4. **La capa de grano.** Un `<div>` en el layout raíz con el SVG de `feTurbulence`
   inline, `pointer-events: none`. Es lo que hace que el arena se lea como material.
5. **`<CampoArena>`.** El fondo por defecto de todo lo que no es el hero. Gradiente
   cónico animado por CSS, cero JS, con una prop `tinte` de tres valores.
6. **Primitivas.** `Button` gana sus cinco variantes (el glare especular de
   `specular-button` solo en `primary`). Se agregan `Input`, `Label`, `Badge`,
   `Table`, `Skeleton`, `EstadoVacio` y `EstadoError`. Todo sobre Base UI, que ya está.
7. **`/dev/ui` como vitrina.** La página ya existe. Pasa a mostrar cada rampa, cada
   variante de cada primitiva y los tres estados, en los dos temas. Es la pantalla
   contra la que se revisa visualmente cada PR posterior.

**Criterio de aceptación**

- `/dev/ui` muestra todo el sistema en ambos temas y nada se ve roto.
- Un `grep` de `#[0-9a-f]{6}` fuera de `globals.css` no devuelve nada.
- Las pantallas existentes siguen funcionando, ahora en arena en vez de blanco.

**La trampa:** es tentador empezar a rediseñar pantallas acá. No. Este PR toca
`globals.css`, `layout.tsx`, `components/ui/*` y `/dev/ui`. Ninguna página de negocio.

---

### PR 2 — Chasis público: header, footer, tema e ingreso

*3 sesiones. Depende del PR 1.*

Todo lo que envuelve a las cuatro páginas públicas, más el ingreso, que también es
chasis: es la puerta.

**Qué entra**

1. **`<HeaderPublico>` con sus tres modos.** Transparente arriba de la landing, vidrio
   al pasar los 80px, sólido en interno y portal. La transición es de 320ms y la
   altura pasa de 80px a 64px. El scroll se lee con `IntersectionObserver` sobre un
   centinela, **no con un listener de scroll** — un listener acá cuesta cuadros.
2. **Menú móvil** con `staggered-menu` de React Bits, reteñido.
3. **Tema.** Toggle accesible en el header (`<button>` con `aria-label`, funciona con
   teclado), persistencia en `localStorage`, y **script inline en `<head>`** que
   aplica la clase antes del primer pintado. Sin eso hay flash de tema equivocado en
   cada carga.
4. **El lanyard.** El cordón de lámpara de React Bits, esquina superior derecha, que
   al tirarlo cambia el tema. **Solo desktop, solo landing, no se monta con
   `prefers-reduced-motion`.** Es un adorno sobre el toggle real, nunca su reemplazo.
5. **`<FooterMirage>`.** Igual en las tres superficies. Banda en `--muted`, la línea de
   degradado turquesa→ámbar→coral de 2px arriba del borde, tres columnas y los datos
   de contacto reales. En el interno colapsa a una línea con la versión del build.
6. **`/ingresar` rediseñado.** Layout propio sin header ni footer del sitio. Selector
   de dos pestañas — *Equipo Mirage* → `/app`, *Clientes* → `/portal` — con la
   preferencia recordada. El olvido y el restablecimiento de contraseña ya están
   implementados y solo se repintan.

**Criterio de aceptación**

- Recargar en modo oscuro no produce un destello claro.
- El toggle funciona con teclado y el lanyard no aparece en móvil.
- Con `prefers-reduced-motion` el header cambia de estado sin animar.
- Las cuatro páginas públicas siguen funcionando, ahora con el chasis nuevo.

---

## 5. Fase B — Landing

### PR 3 — El hero y la portada

*4 sesiones. Depende del PR 2. El PR más visible del plan.*

**Qué entra**

1. **`<EspejismoHero>`.** El único WebGL de la plataforma. Se arma sobre
   `grid-distortion` y `waves` de React Bits, reteñido a arena→turquesa. En reposo
   ondula con un ciclo de 12 segundos; con el cursor, una estela de calor deforma lo
   que hay debajo y roza las letras del título; al scrollear, la distorsión se apaga y
   el gradiente se desplaza.

   **Las obligaciones técnicas son parte del criterio de aceptación, no del "después":**
   - `next/dynamic` con `ssr: false`, y el `loading` es el póster estático.
   - Se monta con `IntersectionObserver` y **pausa el RAF** al salir del viewport y con
     `document.visibilityState === "hidden"`.
   - Cae al póster CSS en tres casos: `prefers-reduced-motion`, viewport `< 768px`, y
     `navigator.hardwareConcurrency <= 4`.
   - **No participa del LCP.** El `<h1>` y la bajada son HTML del servidor.

2. **La portada completa**, en las ocho bandas del §8.1 del sistema visual: hero,
   capacidades en `card-swap`, page break turquesa de 40vh, cómo trabajamos en línea
   de tiempo que se dibuja al scrollear, servicios destacados desde la base, prueba
   social, cierre con `flowing-menu`, footer.

3. **La regla del page break, implementada como tal:** después de un break fuerte se
   vuelve al fondo que había antes. Máximo dos por página. Conviene que
   `<PageBreak>` sea un componente que lo imponga, no una convención que haya que
   recordar.

4. **Revelado al scrollear.** `IntersectionObserver`, una sola vez, nunca reversible.
   Escalonado de 60ms entre hermanos, máximo 6.

**Criterio de aceptación**

- Lighthouse en móvil con CPU 4× ralentizada: LCP ≤ 2.5s, CLS ≤ 0.05.
- Con el WiFi cortado después del primer HTML, la portada se lee entera.
- En un iPhone de gama media el scroll no baja de 50fps.
- Con `prefers-reduced-motion` el shader no se monta — verificado en el panel de red,
  no a ojo.

**Si el hero se come más de dos sesiones,** el póster estático es un final aceptable
para este PR y el shader se mueve a un PR 3b. La portada sin shader es mucho mejor que
no tener portada.

---

### PR 4 — Servicios y el panel de contenido

*3 sesiones. Depende del PR 2.*

Las dos mitades van juntas porque comparten el modelo y separarlas obligaría a
escribir el formulario dos veces.

**Qué entra**

1. **Migración de `contenido_servicio`:** `slug` (único), `cuerpo` (markdown),
   `imagen_url`, `color`, `proyecto_origen_id`. Aditiva; `slug` se llena por backfill
   desde `nombre`.
2. **`/servicios` con cards apiladas.** No lado a lado: scroll-stacking con
   `position: sticky`, cada card montándose sobre la anterior con 24px de
   desplazamiento. En móvil colapsa a lista vertical.
3. **`/servicios/[slug]`:** imagen o campo de color, cuerpo en Markdown con el
   `contenido-markdown.tsx` que ya existe, tecnologías como chips, caso relacionado si
   hay, y CTA a contacto con el asunto precargado.
4. **`/app/contenido`** — el ABM. Formulario estandarizado: nombre, resumen, cuerpo,
   imagen o color, orden, activo, proyecto de origen. Guardado con Server Actions y
   `revalidatePath` sobre `/servicios`. Requiere permiso; se apoya en el módulo de
   permisos que ya existe.
5. **`contenido/api.ts` deja de ser solo lectura.** Las funciones de escritura emiten
   evento y quedan auditadas, como todo el resto.

**Criterio de aceptación**

- Un usuario interno crea un servicio, lo publica, y aparece en `/servicios` sin
  deploy.
- Despublicar lo saca de la web pero no lo borra.
- `/servicios` sigue teniendo `revalidate = 3600` y las escrituras lo invalidan.

---

### PR 5 — Casos: testimonios y recomendador

*3 sesiones. Depende del PR 2.*

**Qué entra**

1. **Migración de `contenido_caso`:** `testimonio`, `autor`, `cargo_autor`,
   `imagen_url`. La columna `cliente_id` sigue siendo nullable a propósito — nombrar al
   cliente requiere autorización que se pide fuera del sistema.
2. **Testimonios** en `masonry` de React Bits, alturas desparejas, cada uno como una
   cita grande en Bricolage. Se editan desde `/app/contenido`, que ya existe desde el
   PR 4.
3. **El recomendador.** Una pregunta por pantalla, 4 a 6 preguntas, transición lateral,
   barra de progreso. **El árbol es un archivo tipado en el repo**
   (`src/lib/recomendador/arbol.ts`) — sin base de datos, sin backend, editable en
   cinco minutos.
4. **Estado en la URL** (`?p=3&r=a,c,b`): compartible, y el botón de atrás del
   navegador vuelve una pregunta, no sale de la página.
5. **El desenlace** es un servicio recomendado con un botón a `/contacto` que precarga
   el contexto en el mensaje.

**Criterio de aceptación**

- El recomendador se completa con teclado.
- Cada pregunta anuncia su cambio a un lector de pantalla (región `aria-live`).
- Con 2 testimonios cargados la sección se ve intencional, no vacía.

**Tarea no-código, y va antes del PR:** conseguir dos testimonios reales, escritos y
autorizados. Con dos clientes activos, dos citas verdaderas valen más que seis
inventadas — y esta pantalla no se puede terminar sin ellas.

---

### PR 6 — Contacto

*2 sesiones. Depende del PR 2. El más chico del plan.*

**Qué entra**

1. **Los métodos directos** como bloques grandes y clickeables, cada uno con el dato
   visible: WhatsApp (`wa.me` con mensaje precargado), mail (`mailto:`), teléfono
   (`tel:`). El dato a la vista, no escondido detrás del enlace.
2. **El formulario** con `curved-input` de React Bits — el único lugar donde entra.
   Nombre, email, tipo de consulta, mensaje.
3. **Envío por Resend**, que ya está en las dependencias. Server Action, validación en
   servidor, y un límite de tasa por IP: un formulario público sin límite es un
   formulario que va a recibir spam.
4. **Confirmación en la misma página**, con `click-spark`. Sin redirección.
5. **`/contacto?asunto=…`** precarga el tipo de consulta, que es lo que usan el PR 4 y
   el PR 5 para pasar contexto.

**Criterio de aceptación**

- El formulario funciona con JavaScript deshabilitado (Server Action progresiva).
- Los errores de validación se anuncian y el foco va al primer campo con error.
- Un envío fallido no pierde lo que el usuario escribió.

---

## 6. Fase C — Interno

### PR 7 — Chasis interno: barra lateral y tablero

*3 sesiones. Depende del PR 1, no del PR 2.*

**Qué entra**

1. **La barra lateral.** 240px, colapsable a 64px con solo íconos, estado persistido en
   cookie (así el servidor la renderiza en el estado correcto y no hay salto). La
   sección activa se marca con una barra de 3px en turquesa a la izquierda, no
   pintando el ítem entero. En móvil es un drawer.

   Reemplaza al `<nav>` de siete enlaces del `layout.tsx` actual, que ya aprieta y que
   con contenido y ajustes serían nueve.

2. **`/app` como tablero.** Fila de `CardDato` — proyectos activos, tareas propias
   abiertas, solicitudes sin responder, personas. Debajo, tres columnas: mis tareas de
   hoy, actividad reciente (del bus de eventos, que ya existe), solicitudes que me
   esperan. Al pie, miniatura no interactiva del organigrama con enlace a la pantalla
   completa.

3. **Repintado de los listados simples** con las primitivas del PR 1: personas,
   clientes, proyectos y solicitudes pasan a la `Table` nueva con cabecera pegajosa,
   filas de 48px, mono tabular en números y fechas, y colapso a card en móvil. Es
   repintado, no rediseño: cada una recibe su tratamiento propio en su PR.

4. **`<TableroVacio>` y `<TableroCargando>`** genéricos, para no reescribir estados
   vacíos en cinco pantallas.

**Criterio de aceptación**

- La barra lateral colapsada y expandida funciona con teclado, y el estado sobrevive a
  una recarga sin salto visual.
- El tablero de `/app` carga en ≤ 1.5s con datos reales.
- Ninguna tabla del interno scrollea horizontalmente a 390px.

---

### PR 8 — Organigrama y personas

*4 sesiones. Depende del PR 7.*

Van juntos porque son la misma pregunta vista de dos lados: el organigrama muestra las
responsabilidades, personas muestra quién las ocupa.

**Qué entra**

1. **El organigrama radial.** SVG, **no WebGL**. Posiciones canónicas calculadas en un
   `useMemo` a partir del anillo (profundidad) y la rama. Las dos jefaturas al centro.
2. **La física de resorte.** Los nodos se agarran y se arrastran, empujan a los vecinos
   con colisión real, y vuelven a su lugar al soltar (rigidez 170, amortiguación 26).
   **La física entretiene; no informa.** La información no cambia nunca porque el
   usuario haya jugado.
3. **El círculo exterior** encierra el anillo más profundo y crece o se achica con
   animación al agregar o quitar un nodo.
4. **La codificación visual:** color por rama (turquesa la interna, ámbar la externa),
   tamaño por cantidad de personas asignadas, y **punteado si no tiene a nadie**. Ver
   de un vistazo qué responsabilidad está huérfana es medio motivo de la pantalla.
5. **Panel lateral al clickear:** la responsabilidad, sus personas, sus hijos, y las
   acciones de edición si hay permiso.
6. **"Ver como lista"** — el árbol jerárquico en HTML. Es la versión accesible, la que
   se imprime, y la que funciona si el SVG falla. No es opcional.
7. **`/app/personas`** en grilla de `profile-card`: foto, nombre, nodos que ocupa, e
   **indicador de carga** — verde 1-2 nodos, ámbar 3, coral 4+. Ver a alguien en coral
   es la señal de sobrecarga que el modelo de la empresa quiere que se vea.
8. **Los controles que el usuario no puede tocar se muestran deshabilitados con el
   motivo en un tooltip, no ocultos.** Entender la jerarquía es parte del punto.

**Criterio de aceptación**

- Con `prefers-reduced-motion` los nodos saltan a su posición sin resorte y todo lo
  demás funciona igual.
- El organigrama es navegable con teclado: `Tab` entre nodos, `Enter` abre el panel.
- Arrastrar un nodo y soltarlo no persiste nada. Recargar devuelve todo a su lugar.

---

### PR 9 — Clientes: ficha y línea de tiempo

*2 sesiones. Depende del PR 7.*

Sale barato porque `clientes_interaccion` **ya existe** con tipo, fecha, persona y
resumen. Falta la pantalla, no el modelo.

**Qué entra**

1. **Migración mínima:** agregar `whatsapp` al enum de `clientes_interaccion.tipo`. Hoy
   el canal real cae en "otro", que es perder la información que más se va a consultar.
2. **Listado** en tabla densa con búsqueda, filtro por estado y orden por columna.
   Estado como badge, CUIT en mono.
3. **La ficha, que es la pantalla protagonista.** Cabecera con nombre, estado y
   acciones, y cuatro bloques: datos y contactos; proyectos vinculados en
   `CardProyecto` compacta; solicitudes abiertas; y la línea de tiempo.
4. **La línea de tiempo de interacciones.** Vertical, con ícono por tipo, fecha, quién
   la registró y la nota. Se agrega una interacción desde un campo al pie, sin modal.
5. **`clientes/api.ts`** gana `listarInteraccionesDeCliente` y `registrarInteraccion`,
   con evento y auditoría.

**Criterio de aceptación**

- Registrar una interacción no recarga la página y aparece arriba de la línea.
- La ficha de un cliente sin proyectos ni interacciones muestra tres estados vacíos
  útiles, cada uno con su acción.

---

### PR 10 — Inscripciones y proyectos

*3 sesiones. Depende del PR 7. **El pivote del plan.***

Acá entra el modelo nuevo de §1.1. Los PRs 11 y 12 dependen de esto.

**Qué entra**

1. **`proyectos_inscripcion`** — `proyecto_id`, `persona_id`, `rol` (`lider` |
   `miembro`), `inscripto_en`. Único por par, para que nadie se anote dos veces.
2. **`proyectos_proyecto`** gana `cupo` (entero, nullable = sin límite), `color` e
   `imagen_url`.
3. **`proyectos/api.ts`** gana: `inscribirPersona`, `desinscribirPersona`,
   `cambiarCupo`, `listarInscriptos`, `listarProyectosDePersona`. Las invariantes —
   no pasarse del cupo, solo el líder cambia el cupo, un proyecto tiene como máximo un
   líder — se prueban acá, en el test de `api.ts`, no en la UI. **El PR que agrega un
   módulo agrega también su test**, igual que en el plan v1.
4. **La grilla de proyectos.** `CardProyecto` con imagen o campo de color, contador
   `0/X` en mono arriba a la derecha con anillo de progreso alrededor, y avatares
   apilados. **Los proyectos donde el usuario está inscripto van primero**, con
   `border-glow`.
5. **Anotarse y desanotarse** desde la card. Si está lleno, el contador se pone coral y
   el botón se deshabilita con el motivo visible.
6. **Filtros:** mis proyectos / todos / por cliente / por estado. Un proyecto sin
   cliente es normal, no un dato faltante — la UI no lo marca como error.
7. **La ficha de proyecto** suma equipo, fechas y cupo a lo que ya tiene.

**Criterio de aceptación**

- El test de `api.ts` cubre: cupo lleno rechaza, doble inscripción rechaza, cambiar el
  cupo por debajo de los ya inscriptos rechaza, y un no-líder no puede cambiar el cupo.
- "Mis proyectos" usa la inscripción, no los nodos del organigrama.
- Un proyecto con `cupo = null` muestra la cantidad de inscriptos sin denominador.

**La decisión que hay que tomar antes de escribir el código:** ¿"mis tareas" sigue
saliendo de los nodos del organigrama, o pasa a salir de las inscripciones? La
recomendación es **dejar las tareas en los nodos y usar la inscripción solo para
proyectos y solicitudes.** Razón: una tarea tiene `nodo_responsable_id` obligatorio y
persona opcional justamente para que no quede huérfana cuando alguien se va; hacerla
depender de la inscripción reintroduce ese problema.

---

### PR 11 — Tareas: Kanban y Gantt

*5 sesiones. Depende del PR 10. El PR más grande del plan.*

Es el candidato natural a partirse en dos si se descontrola. El corte limpio es
**Kanban primero, Gantt después**: el Kanban solo ya es útil, y el Gantt sin Kanban no.

**Qué entra**

1. **Migración:** `proyectos_tarea.empieza_en` (el Gantt necesita inicio y hoy solo hay
   `vence_en`), y la tabla `proyectos_hito` — `proyecto_id`, `nombre`, `fecha`,
   `color`.
2. **`@dnd-kit`** como dependencia.
3. **El Kanban.** Columnas por estado (`pendiente`, `en_curso`, `bloqueada`, `hecha`),
   tarjetas arrastrables. Cada tarjeta: título, proyecto con su color, responsable,
   fecha límite y prioridad. Crear una tarea es un **compositor inline al pie de la
   columna, no un modal**.
4. **Los permisos salen del módulo que ya existe.** Quién puede crear y quién puede
   mover no se decide en el componente.
5. **El Gantt, debajo, leyendo del mismo estado.** Barras de tareas con fecha y barras
   de los proyectos donde el usuario está inscripto. Mover una tarjeta en el Kanban se
   refleja en el Gantt sin recargar.
6. **Manipulación directa, si hay permiso:** arrastrar el centro desplaza la barra
   entera, arrastrar un extremo la alarga o acorta, doble click abre la tarea.
7. **Hitos.** Rombo sobre la línea de tiempo con una línea vertical punteada que baja
   por todo el Gantt. **Cuando la fecha se acerca y hay tareas sin terminar antes de
   ella, el rombo pasa a coral.** Esa es la señal que justifica la función.
8. **Zoom de tres niveles** (semana, mes, trimestre), con el rango en la URL.
9. **En móvil el Gantt no se dibuja.** Se ofrece una lista por fecha. Un Gantt en 390px
   es un Gantt que nadie usa.

**Criterio de aceptación**

- Toda acción de arrastre tiene equivalente de teclado. `@dnd-kit` lo trae; hay que
  usarlo, no desactivarlo.
- Arrastrar es optimista y **revierte visiblemente si el servidor rechaza**.
- Cambiar fechas desde el Gantt queda auditado igual que hacerlo desde el formulario.
- Con 200 tareas el Gantt no baja de 50fps al hacer zoom.

---

## 7. Fase D — Cierre

### PR 12 — Solicitudes, notificaciones y portal

*3 sesiones. Depende del PR 10.*

Las tres piezas van juntas porque comparten el hilo de conversación y el enlace desde
la notificación a su origen.

**Qué entra**

1. **El filtro que falta (§1.2).** `listarSolicitudes` pasa a filtrar por los proyectos
   donde la persona está inscripta. **Con un test de aislamiento**, del mismo tipo que
   el que ya existe para el portal — es la misma clase de invariante y merece la misma
   red.
2. **La UI dice que está filtrando.** "Ves las solicitudes de tus 3 proyectos." Una
   bandeja vacía sin explicación se lee como un error.
3. **La bandeja.** Lista a la izquierda, hilo a la derecha en desktop; navegación por
   pantallas en móvil. Estados como chips de color. Sin leer, en negrita con punto
   turquesa.
4. **El hilo como conversación:** mensajes alternados, el del cliente sobre `--muted`,
   el interno sobre `turquesa-50`. Compositor y acciones de estado al pie.
5. **Notificaciones.** Campana en la barra lateral con contador, panel con las últimas
   diez, y la página completa con historial y filtros. **Cada notificación es un enlace
   a su origen** — nunca una que informa y te deja buscando. Tiempo relativo visible,
   fecha exacta en el `title`.
6. **La administración de plantillas y suscripciones** se repinta y se muda a
   `/app/ajustes/notificaciones`.
7. **El portal.** Registro intermedio, 1000px, tres ítems de navegación. Inicio con el
   estado de los proyectos (solo progreso), las solicitudes abiertas y un botón grande
   de "Nueva solicitud". El alta y el hilo ya están implementados y se repintan.

**Criterio de aceptación**

- El test de aislamiento interno pasa: una persona no inscripta a ningún proyecto ve
  una bandeja vacía, no todas las solicitudes.
- Los tests de aislamiento del portal que ya existen siguen en verde.
- Toda notificación lleva a la pantalla correcta.

---

## 8. Las tareas que no son código

Van fuera de los PRs pero los bloquean. Conviene arrancarlas ya, porque dependen de
terceros y no de vos.

| Tarea | Bloquea | Cuándo |
|---|---|---|
| Conseguir 2 testimonios reales, escritos y autorizados | PR 5 | **Ahora.** Depende de que dos clientes contesten |
| Escribir el árbol del recomendador — 4-6 preguntas y sus ramas | PR 5 | Antes del PR 5 |
| Definir color o imagen de cada proyecto y servicio | PRs 4 y 10 | Antes de cada uno |
| Fotos de perfil del equipo | PR 8 | Antes del PR 8 |
| Verificar el dominio en Resend, si no está | PR 6 | **Ahora.** Es calendario, no trabajo |
| Decidir si "mis tareas" sale de nodos o de inscripciones | PR 10 | Antes del PR 10 |

---

## 9. Riesgos

**El PR 11 se descontrola.** Cinco sesiones es la estimación optimista de un Kanban con
arrastre más un Gantt con manipulación directa. *Mitigación:* partirlo en Kanban y
Gantt en cuanto pase de tres sesiones. El corte está diseñado para eso.

**El hero se come el presupuesto de rendimiento.** Un shader es fácil de escribir y
difícil de hacer barato. *Mitigación:* el póster estático es un final aceptable del PR
3 y el shader se mueve a un PR aparte. Está mejor definido como fallback obligatorio
que como plan B.

**Los PRs grandes se vuelven irrevisables.** Doce PRs significa que algunos tocan
treinta archivos. *Mitigación:* commits chicos y ordenados dentro de cada rama, y
revisar commit por commit en vez de ver el diff completo.

**Las inscripciones se filtran a lugares donde no corresponden.** Es un concepto nuevo
que se parece a los nodos del organigrama y es fácil confundirlos. *Mitigación:* la
regla del PR 10 — inscripción para proyectos y solicitudes, nodos para tareas y
autoridad — escrita en `modules/proyectos/README.md` cuando se agregue la tabla.

**El interno queda a mitad de camino.** La landing termina en la semana 7 y el interno
recién en la 19; en el medio hay pantallas nuevas al lado de pantallas repintadas.
*Mitigación:* el PR 7 repinta los listados simples de todas las secciones justamente
para que nada quede en el gris viejo mientras espera su turno.

---

## 10. Para agregar al registro de decisiones

Al cerrar el PR 1 y el PR 10 conviene agregar estas dos entradas a
`mirage-empresa/03-decisiones/registro-de-decisiones.md`:

**2026-08-21 · Identidad visual "Espejismo cálido"**
Paleta de arena, turquesa, ámbar y coral sobre base clara, con dark mode cálido.
Un solo background WebGL en toda la plataforma. La razón del techo es física, no
estética: cada shader arrastra un contexto WebGL y un RAF continuo, y en móvil un
sitio que quiere decir "modernidad" no puede sentirse lento.

**2026-08-21 · Las inscripciones a proyectos son un concepto distinto del organigrama**
`nodo_responsable_id` responde *qué responsabilidad es dueña del trabajo* y sobrevive a
que la persona se vaya. `proyectos_inscripcion` responde *quién lo está haciendo hoy* y
es lo que la UI usa para "mis proyectos" y para filtrar la bandeja de solicitudes. Las
tareas siguen colgando del nodo, no de la inscripción, para que no queden huérfanas.
