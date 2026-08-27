# Plan de fixes — 27 de agosto de 2026

Documento **ejecutable**: está escrito para que Claude Code lo corra PR por
PR. Cierra la ronda que abrió `2026-08-21-plan-frontend.md` (12 PRs, ya
integrados en `staging`). Seis PRs, ni uno más: si algo no entra, se
planifica en una ronda aparte en vez de estirar esta.

Estado del que parte: la app corre en Render, rama `deploy-staging-test`,
plan free, base free. Hay una sola cuenta con rol (la de Kevin, creada a mano
contra la base) y una segunda persona (Joaquin) sin rol y sin acceso real.

---

## 0. Cómo se corre este documento

Una sesión de Claude Code por PR, en este orden. El prompt de arranque de
cada una:

```
Leé docs/plan/2026-08-27-plan-fixes.md completo (sobre todo las secciones 1,
2 y 3) e implementá el PR N. Seguí las reglas de la sección 0.1. Al terminar,
escribí la bitácora que pide la sección 5 y pará: no sigas con el PR N+1.
```

No correr dos PRs en la misma sesión. Al terminar cada uno, Kevin revisa el
diff y la bitácora antes de seguir.

### 0.1 Reglas de ejecución (para el agente)

1. **Rama y base.** Cada PR sale de `staging` actualizado:
   `git fetch origin && git switch staging && git pull && git switch -c <rama>`.
   Nunca se commitea a `main` ni a `staging` directo. PR contra `staging`.
2. **Commits chicos y ordenados, cada uno compilando.** Es lo que reemplaza a
   tener PRs chicos (regla heredada del plan de frontend).
3. **Definición de terminado**, la misma del §2 del plan de frontend, para
   los seis PRs sin excepción: `pnpm lint`, `pnpm typecheck`, `pnpm test` y
   `pnpm build` en verde; cero color literal fuera de `globals.css`; ambos
   temas revisados; 390 px sin scroll horizontal; estados vacío / carga /
   error; navegación por teclado.
4. **No inventar datos.** Ningún teléfono, ningún caso de éxito, ningún
   testimonio, ningún número de cliente que no esté ya en la base o en el
   repo.
5. **Parar y preguntar** en vez de decidir solo, si aparece: una migración
   destructiva (renombrar o borrar columnas), un cambio de modelo de datos no
   previsto acá, la necesidad de una dependencia nueva que no sea React Bits
   ni shadcn, o una contradicción entre este plan y el código real.
6. **Verificar en el navegador lo que es visual.** `pnpm dev` +
   `docker compose up -d` (copiar `.env.example` a `.env` primero) y, en base
   nueva, `db:migrate` → `db:seed` → `db:bootstrap`. `/dev/ui` es la vitrina
   contra la que se revisa cualquier cambio de tokens o componentes.
   Corregir antes `.claude/launch.json`, que apunta a un worktree que ya no
   existe.
7. **Bitácora obligatoria** al final de cada PR (sección 5).

### 0.2 Contradicciones deliberadas con CLAUDE.md y el sistema visual

Este plan **revierte a propósito** tres reglas que hoy están escritas como
duras. El agente no debe "respetarlas" ni frenar por ellas: debe
**actualizarlas** en el PR que corresponde, dejando escrito el porqué.

| Regla vigente | Dónde | Qué pasa a decir | PR |
|---|---|---|---|
| "Un solo fondo WebGL en toda la plataforma" | `CLAUDE.md` y §5.2 del sistema visual | Presupuesto por página: uno en el hero de `/`, hasta dos en el resto de la landing, **cero** en `/app` y `/portal` | 2 |
| "Inventario cerrado de componentes de React Bits (agregar uno requiere sacar otro)" | `CLAUDE.md` y §6.8 | Inventario abierto para la landing, con el presupuesto de rendimiento como único límite | 2 |
| `CampoArena` como fondo por defecto de toda página que no es el hero | §5.3 | Bandas de sección quietas (`FondoSeccion`) o fondo React Bits, nunca un cónico rotando | 1 y 2 |

Además, el bloque "Estado del repo" de `CLAUDE.md` quedó viejo (dice que van
4 PRs del plan de frontend; están los 12). El PR 1 lo actualiza de paso.

---

## 1. Diagnóstico

Cada síntoma con su causa en el código, para no arreglar por síntoma.

### Landing

**1.1 — El hero parece estático si no movés el mouse.**
`src/components/espejismo-hero/canvas-hero.tsx`. La ondulación ambiente
existe (`uTime` avanza siempre), pero es imperceptible: `snoise` a escala
1.6, velocidad `uTime * 0.05` y amplitud 0.18 sobre un `mix()` vertical de
dos colores. Todo lo que se ve moverse depende de `uMouseFuerza`. Y el campo
es un degradé vertical: no hay refracción, no hay capas, no hay nada que se
lea como "luz doblándose sobre aire caliente".

**1.2 — En buena parte de los equipos el hero ni siquiera es WebGL.**
`fondo-hero.tsx` exige `min-width: 768px` **y** más de 4 núcleos
(`navigator.hardwareConcurrency`). Abajo de eso cae a `PosterHero`, que es un
degradé CSS quieto. En un notebook modesto o en el celular, el hero es una
imagen fija.

**1.3 — El fondo que gira y se ve horrible tiene nombre.**
`src/components/campo-arena.tsx`: un `conic-gradient` animado con
`@property --campo-angulo` de 0 a 360° cada 12 s, instanciado en **cinco**
secciones de la portada (`(publico)/(con-chasis)/page.tsx`). Un cónico
girando se lee siempre como una hélice de ventilador. No es un bug: es la
técnica que la regla del §5.3 dejaba disponible, y está mal elegida.

**1.4 — En modo claro "no se ve el fondo que gira" porque es invisible, no
porque no esté.** Los stops de `CampoArena` son `--background` y `--muted`,
que en claro son `arena-100` y `arena-200`: 3 % de diferencia de luminosidad.
Sigue girando y sigue gastando GPU; simplemente no se distingue del blanco.

**1.5 — Las cards de "Qué hacemos" no parecen tocables y se mueven solas.**
`(publico)/(con-chasis)/_inicio/capacidades.tsx` es un card-swap hecho a
mano: rota sola cada 5 s, las cartas de atrás quedan 14 px más abajo y
**tapadas** por la de adelante (mismo tamaño, fondo opaco), y no hay puntos,
flechas, borde ni cursor que diga que se puede clickear. De ahí las dos
quejas juntas: "no parecen interactuables" y "la interacción parece rota y
random".

**1.6 — El bloque de email de Contacto sí es un link.**
`contacto/metodos-directos.tsx` lo envuelve en `mailto:`. Lo que falta es la
señal: su único cambio en hover es una sombra de `sm` a `md`. Al lado de un
botón con animación real, parece un cartel.

**1.7 — El modo claro es blanco porque los tokens están casi pegados.**
`--background: arena-100` y `--card: arena-50` difieren en ~1.5 % de
luminosidad; `--border: arena-300` es gris cálido. La paleta tiene turquesa,
ámbar, coral y cielo declarados y prácticamente sin uso fuera de los botones.

**1.8 — El interno es 100 % Inter.** Bricolage está cargada y usada en la
landing, el portal y la sidebar, pero **ningún** componente de `/app` la
toca. Inter en todo, mismo peso, sin escala tipográfica: eso es lo que se lee
como "fea y genérica".

### Sistema interno

**1.9 — Formularios crudos.** 13 inputs/selects con
`className="rounded-md border px-2 py-1"` (sin tokens, sin foco, sin estados)
y **25 `<select>` nativos** en `/app`. No existe `components/ui/select.tsx`.
El formulario de crear tarea de la ficha de proyecto es uno de esos.

**1.10 — Crear la primera tarea desde `/app/proyectos/[id]` falla.**
No se reproduce leyendo el código: `crearTareaAction` y
`crearTareaEnColumnaAction` (`(interno)/app/proyectos/actions.ts`) terminan
en el mismo `proyectos.crearTarea()` con los mismos datos. **Hace falta el
texto exacto del error** — el rojo debajo del formulario o el stack en los
logs de Render — antes de tocar nada. Sospechas ordenadas por probabilidad:

  1. El `<select>` de nodo responsable llega vacío y `Number("")` da `0`,
     que revienta contra la foreign key con un error que `manejarError` no
     traduce y sube como 500 de server action.
  2. `venceEn` con un `<input type="date">` vacío contra un `timestamp`.
  3. Un `NoAutorizado` de `requiere(personaId, "proyectos.editar")`.

**1.11 — Por qué no se puede poner a Joaquin en "actividades externas".**
Son dos problemas encimados:

  - `nodosControladosPorPersona()` (`kernel/organigrama/arbol.ts:311`) deriva
    el permiso **del árbol**: controlás los nodos que ocupás y sus
    descendientes. `db/bootstrap.ts` deja al fundador titular de la raíz
    **interna** solamente. Toda la rama externa queda deshabilitada para todo
    el mundo, para siempre, sin forma de destrabarla desde la UI. Además
    contradice la regla 4 del organigrama ("los permisos van aparte, en
    capacidades agrupadas en roles").
  - Joaquin **no tiene ningún rol**, y no hay pantalla para dárselo:
    `persona_rol` se escribe únicamente desde `db/bootstrap.ts`. Sin rol no
    pasa ni un `requiere()`: no puede crear un cliente, ni un proyecto, ni
    una tarea. Aunque se lo asignara al nodo, el sistema seguiría vacío para
    él.

**1.12 — `asignarPersonaAction` valida mal.**
`(interno)/app/organigrama/actions.ts`: `Number("")` es `0` y
`Number.isInteger(0)` es `true`, así que el guardia "Elegí una persona" no
atrapa el caso que dice atrapar.

**1.13 — Los mails no salen.** Falta `RESEND_API_KEY` en Render (por eso las
dos notificaciones fallidas de `auth.recuperar-password` con
`new Resend("re_123")`). Falta `GITHUB_TOKEN`: de ahí el 403 de la actividad
de GitHub.

**1.14 — La primera cuenta.** `pnpm db:bootstrap` existe y hace lo correcto,
pero el plan free de Render no da shell ni pre-deploy command: por eso
terminó insertándose a mano.

**1.15 — El worker de notificaciones vive en el proceso web**
(`instrumentation.ts`, `setInterval`). En el free tier el servicio duerme a
los ~15 min sin tráfico: la cola sólo avanza mientras alguien usa la app. No
es un bug, es una consecuencia del plan; conviene saberlo antes de culpar al
worker.

---

## 2. Decisiones tomadas (27/08/2026)

1. **React Bits se usa de verdad.** No había nada en contra: el §5.2 del
   sistema visual cerró el inventario en 14 componentes y prohibió más de un
   WebGL en toda la plataforma, y por esa regla varios se reimplementaron a
   mano y salieron flojos (el card-swap sin física, `CampoArena`). Se levanta
   la regla y se instalan los componentes reales con el CLI, retiñidos a la
   paleta.
2. **Cambia el par tipográfico completo**, y el interno también usa la
   display en sus títulos.
3. **El alta sigue siendo por invitación**, sin registro público, pero con
   mail real y verificación obligatoria: la cuenta no entra hasta confirmar.
4. **La primera cuenta se crea desde una ruta `/setup` protegida**, que sólo
   existe si la base no tiene ninguna persona y además pide un token de
   variable de entorno.
5. **El permiso del organigrama pasa a ser una capacidad de rol**
   (`organigrama.administrar`), como manda la regla 4. El control por árbol
   queda como camino por defecto para el resto.
6. **El modo claro sube la temperatura**: superficies arena de verdad, bandas
   de sección tintadas y bordes con color.
7. **La auditoría es completa** (pública, `/app`, `/portal`) y sus arreglos
   entran en estos PRs.

---

## 3. Los seis PRs

### PR 1 — Base visual: tipografía, modo claro y el fin de CampoArena

**Rama:** `fix-01-base-visual` · **Depende de:** nada · **Bloquea a:** 2, 3, 6

Cuello de botella deliberado, igual que el PR 1 del plan anterior: toca
tokens y primitivos, y todo lo demás se construye encima.

**Pasos**

1. **Tipografía.** En `src/app/layout.tsx`, reemplazar `Inter` por `Geist`
   (`next/font/google`), manteniendo `Bricolage_Grotesque` como display y
   `Geist_Mono` para datos. Renombrar la variable a `--font-geist` y
   actualizar `--font-sans` en `globals.css`. Si `Geist` no rinde bien en
   pantallas densas de `/app`, la alternativa acordada es `General Sans`
   (Fontshare) — decidirlo mirando `/dev/ui`, no de memoria.
2. **La display llega al interno.** Aplicar `font-heading` y la escala
   (`text-h2` / `text-h3`) a los títulos de `/app` y `/portal`. Punto de
   partida: `grep -rn "text-2xl font-semibold\|text-lg font-semibold"
   "src/app/(interno)" "src/app/(portal)"`. Ningún título debe quedar con la
   fuente de cuerpo.
3. **Modo claro con temperatura.** En `:root`:
   - `--background` pasa de `arena-100` a `arena-200` (o `arena-300` si en
     pantalla sigue leyéndose blanco), y `--card` queda en `arena-50`: la
     separación card/fondo tiene que verse sin forzar la vista.
   - `--border` deja de ser gris: `color-mix(in oklch, var(--turquesa-500)
     18%, var(--arena-300))`. `--input` conserva su contraste 3:1.
   - `--muted` / `--secondary` recalibrados contra el fondo nuevo.
   - Tokens nuevos para las bandas: `--tinte-turquesa`, `--tinte-ambar`,
     `--tinte-neutro`, definidos en claro y en oscuro.
   - Verificar contraste de texto sobre cada superficie nueva (AA), y que
     turquesa-500 siga sin usarse como texto en claro (§2.1).
4. **`FondoSeccion`.** Componente nuevo en `src/components/`, con prop
   `tinte` (`turquesa` / `ambar` / `neutro`) y **sin animación**: un degradé
   lineal suave más la capa de grano que ya existe. Reemplaza a `CampoArena`
   en las cinco secciones de `(publico)/(con-chasis)/page.tsx` y donde más
   aparezca (`grep -rn "CampoArena" src`).
5. **Borrar `campo-arena.tsx`**, el `@keyframes campo-arena-girar` y el
   `@property --campo-angulo` de `globals.css`. No dejarlo "por las dudas".
6. **Primitivos que faltan.** `npx shadcn@latest add select textarea` y
   adaptarlos a los tokens. No migrar todavía los 25 `<select>` nativos: eso
   es el PR 6.
7. **Vitrina.** Actualizar `src/app/dev/ui/page.tsx` con la tipografía nueva,
   los tres tintes de `FondoSeccion` y los primitivos nuevos.
8. **Documentación.** Actualizar §2.2 (tokens) y §3 (tipografía) del sistema
   visual, y el bloque "Estado del repo" de `CLAUDE.md` (los 12 PRs del plan
   de frontend están hechos, no 4).

**Aceptación**

- Ningún fondo de la landing rota ni gira.
- En claro y en oscuro se distingue card de fondo de un vistazo.
- Ningún título de `/app` o `/portal` usa la fuente de cuerpo.
- `grep -rn "CampoArena" src` no devuelve nada.
- Definición de terminado (§0.1.3) en verde.

---

### PR 2 — React Bits de verdad: hero y fondos

**Rama:** `fix-02-fondos-react-bits` · **Depende de:** PR 1

**Pasos**

1. **Habilitar el registro.** React Bits se instala con el CLI de shadcn.
   O se agrega a `registries` en `components.json`
   (`"@react-bits": "https://reactbits.dev/r/{name}"`) y se usa
   `npx shadcn@latest add @react-bits/<Componente>-TS-TW`, o se pasa la URL
   completa. **Verificar la forma exacta en reactbits.dev antes de correrlo**
   — la doc cambia. Los componentes se copian al repo, no son dependencia.
2. **Elegir el fondo del hero comparándolo en vivo**, no de memoria. Terna a
   probar, de `diseño-frontend/Backgrounds.md`: `silk`, `dark-veil`, `prism`.
   Alternativas: `soft-aurora`, `light-rays`, `ripple-distortion`. Criterios,
   en orden: (a) se mueve solo, visiblemente, con el mouse quieto; (b)
   reacciona al cursor; (c) se lee como aire caliente que dobla la luz; (d)
   entra en el presupuesto de rendimiento. Dejar en la bitácora cuál se
   eligió y por qué.
3. **Retiñir a la paleta.** El componente instalado no se usa con sus colores
   de demo: arena / turquesa / ámbar del §2.1. Los literales del shader son
   la única excepción permitida a "cero color literal", y van comentados,
   igual que hoy en `canvas-hero.tsx`.
4. **Dos fondos más para secciones de la landing**, de la misma familia de
   color, montados sobre `FondoSeccion` del PR 1 — que pasa a aceptar un
   fondo animado opcional además de sus tres tintes quietos.
5. **Lo que se conserva del §5.2, porque no era el problema:**
   `next/dynamic({ ssr: false })`, pausa al salir del viewport y al ocultarse
   la pestaña, corte por `prefers-reduced-motion`, y póster estático de
   fallback. **Lo que cambia:** el póster deja de dispararse por
   `hardwareConcurrency <= 4` y por ancho de pantalla; en móvil se sirve una
   variante más liviana (menos capas / menor DPR), no una foto.
6. **Borrar** `canvas-hero.tsx` y `poster-hero.tsx` si el componente
   instalado los reemplaza.
7. **Medir.** LCP y peso de JS de `/` antes y después (Lighthouse en
   `pnpm build && pnpm start`, y una pasada en el Render free, que es el peor
   caso realista). Presupuesto: LCP ≤ 2.5 s, JS inicial ≤ 180 KB sin contar
   el shader, y no empeorar el LCP actual en más de 200 ms.
8. **Documentación.** Corregir §5.2 y §6.8 del sistema visual y las líneas
   correspondientes de `CLAUDE.md` según la tabla de §0.2, dejando escrito el
   motivo del cambio (no borrar la regla vieja sin explicar por qué se cae).

**Aceptación**

- El hero se mueve de forma visible con el mouse quieto, en desktop y en
  móvil.
- `/app` y `/portal` no cargan un solo byte de WebGL (verificar en la pestaña
  Network).
- Con `prefers-reduced-motion: reduce` no anima nada.
- Números de rendimiento anotados en la bitácora, antes y después.

---

### PR 3 — Landing: afordancias e interacción

**Rama:** `fix-03-landing-interaccion` · **Depende de:** PR 1 (y conviene
después del 2)

**Pasos**

1. **"Qué hacemos" (`_inicio/capacidades.tsx`).** Reemplazar el card-swap
   casero. Dos caminos, se decide al implementar y se anota en la bitácora:
   el `card-swap` real de React Bits (con la física que al nuestro le falta),
   o las tres cards visibles a la vez con hover propio. En cualquiera de los
   dos: puntos de navegación clickeables, las cartas de atrás **asomando** de
   verdad, pausa al hover (ya está) y foco visible por teclado.
2. **Contacto (`contacto/metodos-directos.tsx`).** Afordancia real: borde que
   se ilumina, ícono de acción, desplazamiento en hover, foco visible. Que se
   lea igual de tocable que "Enviar mensaje".
3. **Revelados.** `revelado.tsx` usa `threshold: 0.2`: una sección más alta
   que el viewport nunca llega a ese umbral y puede quedarse en `opacity-0`.
   Cambiar a `rootMargin` negativo o a un umbral que no dependa de la altura,
   y probarlo en 390 px.
4. **Barrido de la landing completa** en claro y oscuro: `PageBreak`,
   Servicios, `/servicios/[slug]`, Casos, el recomendador, el menú móvil y el
   footer. Todo elemento clickeable con estado de hover y de foco.

**Aceptación**

- Ningún elemento clickeable de la landing sin hover ni foco visible.
- La sección de capacidades se entiende sin esperar a que rote.
- Ninguna sección queda invisible por el revelado, a ningún ancho.

---

### PR 4 — Identidad: `/setup` y alta con mail verificado

**Rama:** `fix-04-alta-verificada` · **Depende de:** nada (se puede hacer en
paralelo a 1-3)

**Pasos**

1. **Extraer la lógica de arranque.** Hoy vive en `src/db/bootstrap.ts` como
   script. Mover el cuerpo a una función reutilizable (p. ej.
   `kernel/identidad/arranque.ts: crearPrimerEmpleado()`), idempotente, y que
   tanto el script como la ruta nueva la llamen. No duplicar la lógica.
2. **Ruta `/setup`** en `(publico)/(sin-chasis)/setup/`: responde **sólo** si
   la tabla `persona` está vacía **y** el request trae el token de
   `SETUP_TOKEN` (variable de entorno). En cualquier otro caso, `notFound()`
   — 404, no 403, mismo criterio que el resto del sistema. Formulario de
   mail + contraseña + nombre + apellido. Al terminar deja de existir sola,
   porque ya hay una persona.
3. **Verificación de mail obligatoria.** En `kernel/identidad/auth.ts`:
   `emailAndPassword.requireEmailVerification: true` y un bloque
   `emailVerification` cuyo `sendVerificationEmail` **encola** en
   notificaciones, igual que hace hoy `sendResetPassword` — nunca manda
   dentro del request (§6.5 del diseño). Plantilla nueva en
   `modules/notificaciones/internal/plantillas.ts`. Verificar la forma exacta
   de la config contra el paquete instalado, no contra la doc pública (ya
   pasó con el adapter de Drizzle).
4. **Excepción para el primer empleado:** la cuenta que crea `/setup` nace
   verificada, o no habría forma de entrar en una base nueva sin mail
   configurado.
5. **Invitación.** `invitarPersona()` (`kernel/identidad/personas.ts`) pasa a
   mandar verificación + alta de contraseña en un solo mail. En
   `/app/personas` y `/app/personas/[id]`, mostrar el estado de cada persona
   — sin acceso / invitada / confirmada — con botón de reenviar.
6. **Configuración real.** Documentar y dejar listo: `RESEND_API_KEY` en
   Render, dominio verificado en Resend para mandar desde
   `no-reply@miragesoftware.com.ar` (con una casilla de Gmail como remitente,
   Resend sólo entrega a la propia casilla), `SETUP_TOKEN`, y `GITHUB_TOKEN`
   para el 403 de la actividad. Actualizar `.env.example`, la sección
   "Variables de entorno" de `CLAUDE.md`, el README y los comentarios de
   `render.yaml`.
7. **Tests de integración:** `/setup` refuse cuando ya hay una persona;
   `crearPrimerEmpleado()` idempotente; una persona invitada no puede iniciar
   sesión hasta verificar.

**Aceptación**

- Una base recién migrada pasa de cero a una cuenta usable sin tocar SQL.
- Una persona invitada no entra hasta hacer click en el mail.
- La pantalla de notificaciones fallidas queda vacía (reintentar las dos
  viejas ya con key, o purgarlas).

---

### PR 5 — Permisos: roles administrables y organigrama

**Rama:** `fix-05-permisos-roles` · **Depende de:** PR 4

**Pasos**

1. **Capacidades del kernel.** Hoy `capacidades-declaradas.ts` sólo agrega
   las de los módulos y el kernel no declara ninguna. Agregar un
   `kernel/permisos/capacidades-kernel.ts` (mismo patrón) con
   `organigrama.ver`, `organigrama.editar`, `organigrama.administrar` e
   `identidad.administrar`, y sumarlo al agregador.
2. **`organigrama.administrar` saltea el árbol.** Permite asignar y
   desasignar en **cualquier** nodo, se ocupe o no esa rama.
   `nodosControladosPorPersona()` sigue existiendo como camino por defecto;
   la capacidad lo saltea. Con eso la rama externa deja de ser inalcanzable.
3. **Pantalla de roles.** En `/app/personas/[id]`, ver y cambiar los roles de
   una persona (protegida por `identidad.administrar`), y una pantalla de
   roles / capacidades para Dirección. Es lo que hoy obliga a ir a la base a
   mano.
4. **Las dos raíces.** `crearPrimerEmpleado()` deja al fundador de titular de
   la raíz interna **y** de la externa, para que ninguna base nueva nazca con
   una rama muerta.
5. **Arreglar la validación** de `asignarPersonaAction` (§1.12) y buscar el
   mismo patrón `Number("")` en el resto de las server actions:
   `grep -rn "Number(formData.get" src`.
6. **Mensajes de permiso.** Que el motivo del botón deshabilitado diga qué
   capacidad falta, no sólo "no tenés permiso".
7. **Tests:** asignar persona a un nodo de otra rama con y sin
   `organigrama.administrar`; dar y quitar un rol desde la UI.

**Aceptación**

- Desde la UI, Kevin le da un rol a Joaquin y lo asigna a "actividades
  externas" sin una sola query.
- Joaquin entra a `/app` y ve lo que su rol le habilita.

---

### PR 6 — Interno: auditoría, arreglos y tests

**Rama:** `fix-06-interno-qa` · **Depende de:** PR 1 y PR 5

**Pasos**

1. **Auditoría pantalla por pantalla** de las tres superficies, guardada en
   `docs/qa/2026-08-27-auditoria.md`: qué anda, qué está roto, qué está mal
   planteado, con severidad (crítico / molesto / cosmético) y la pantalla
   exacta. Recorrer también `/portal`, que no se probó desde el PR 12.
2. **Reproducir y arreglar** el fallo de crear la primera tarea desde la
   ficha de proyecto (§1.10). Primero reproducirlo y anotar el error real;
   recién después el arreglo. Si no se reproduce, decirlo en la bitácora en
   vez de parchear a ciegas.
3. **Migrar los formularios crudos** a los primitivos del PR 1: los 13 usos
   de `rounded-md border px-2 py-1` y los 25 `<select>` nativos
   (`tareas-formularios.tsx`, `organigrama-formularios.tsx`,
   `repositorios-formulario.tsx`, `proyectos/[id]/page.tsx`, y los del
   Kanban y el Gantt).
4. **Ningún error de dominio que se escape como 500.** Revisar que todas las
   server actions pasen por su `manejarError` y que los errores de
   infraestructura muestren algo legible en vez de romper la pantalla.
5. **Tests de integración de los flujos críticos** que hoy no tienen red:
   crear tarea desde las dos pantallas, asignar persona a nodo, invitar
   persona y verificar, inscribir a un proyecto con el cupo lleno.

**Aceptación**

- Los flujos marcados como críticos en la auditoría pasan a mano y con test.
- Lo que no llegue a entrar queda listado con prioridad al final del
  documento de auditoría, para la ronda siguiente. **No se abre un PR 7.**

---

## 4. Orden y dependencias

```
PR 1 ──> PR 2 ──> PR 3        (visual, en cadena)
PR 4 ──> PR 5                 (identidad y permisos, en cadena)
                  PR 6        (necesita el PR 1 y el PR 5)
```

Las dos cadenas son independientes entre sí: si una semana no da para tocar
shaders, se avanza por el lado de identidad. El PR 6 va último porque
auditar una pantalla que va a cambiar en el PR 1 no sirve de mucho.

Ramas encadenadas, PR contra `staging`, nunca a `main` directo.

---

## 5. Bitácora (obligatoria al cerrar cada PR)

Escribir `docs/qa/bitacora-fix-0N.md` con estas secciones, en este orden.
Es lo que Kevin le devuelve a Claude para el doble chequeo, así que tiene que
poder leerse **sin** el diff al lado:

1. **Qué se hizo**, paso por paso del plan, marcando lo que quedó afuera.
2. **Decisiones que tomé yo** — todo lo que el plan dejaba abierto (qué
   fuente, qué fondo de React Bits, qué camino para las cards) con el motivo
   en una línea cada una.
3. **Desviaciones del plan**: qué decía el plan, qué hice en cambio, por qué.
4. **Archivos tocados**, agrupados por intención, no `git diff --stat` pelado.
5. **Qué verifiqué y cómo** — comandos corridos con su resultado, qué miré en
   el navegador, en qué temas y a qué anchos. Números si el PR los pide.
6. **Dudas y sospechas**: lo que no me cerró, lo que arreglé sin estar seguro
   de la causa, lo que puede haber roto algo que no probé.
7. **Deuda que dejo**, con una línea de por qué no entró.

---

## 6. Lo que este plan no hace

- No toca el registro público ni el portal como superficie de alta: sigue sin
  haber signup abierto.
- No migra Render a un plan pago ni saca el worker de notificaciones del
  proceso web (§1.15). Si los mails empiezan a importar de verdad, eso es la
  ronda siguiente.
- No rediseña el organigrama circular ni sus cuatro reglas: el PR 5 deja de
  contradecir la regla 4, nada más.
- No agrega facturación ni registro de horas, fuera del alcance de la v1.
- No implementa los chequeos de permisos pendientes de `solicitudes.*` y
  `notificaciones.*` (deuda del plan v1) salvo lo que toque el PR 5.
