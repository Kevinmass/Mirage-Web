# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estado del repo

Las 8 fases del plan v1 (backend + kernel + módulos) están implementadas e
integradas en `main`. Next.js + TypeScript + Drizzle + Postgres andando —
ver `package.json` antes de asumir que un comando no existe.

Lo que el plan v1 dejó pendiente y no está hecho: los chequeos de permisos
de casi todos los módulos — `proyectos.*`, `solicitudes.*` y
`notificaciones.*` están declarados en su `permissions.ts` pero ningún
`api.ts` los verifica todavía. **`clientes` tampoco los verifica** pese a lo
que decía antes esta misma línea — se revisó en el PR 4 del rediseño de
frontend (buscando un ejemplo a imitar para `contenido.editar`) y ningún
`api.ts`, ni siquiera el de `clientes`, llamaba nunca a
`kernel/permisos/evaluar.requiere()`. `contenido.editar` es, desde ese PR,
el primer caso real: `crearServicio`/`actualizarServicio` lo verifican y
`/app/contenido` oculta sus controles de alta/edición sin él.

**El trabajo vigente es la ronda de fixes**
(`docs/plan/2026-08-27-plan-fixes.md`): seis PRs que corrigen lo que quedó
flojo del rediseño (landing y hero, modo claro, tipografía del interno) y lo
que faltaba fuera del frontend (alta con mail verificado, arranque en frío
sin SQL a mano, permisos del organigrama). **Ese documento revierte a
propósito tres reglas escritas más abajo en este archivo y en el sistema
visual** — el único WebGL, el inventario cerrado de React Bits y `CampoArena`
como fondo por defecto. Ver su §0.2: no son restricciones a respetar, son
reglas a actualizar en el PR que corresponde. Leerlo antes de tocar una
pantalla.

Los 12 PRs del rediseño de frontend
(`docs/plan/2026-08-21-plan-frontend.md`) están hechos e integrados en
`staging`: reemplazaron el shadcn por defecto ("en gris") por el sistema
visual "Espejismo cálido", orden tokens → landing → interno. Queda como
referencia histórica, no como trabajo pendiente. La sección
[Rediseño de frontend](#rediseño-de-frontend-plan-vigente) más abajo
también quedó vieja en varios puntos — la ronda de fixes la corrige PR por
PR; leer el plan de fixes, no esa sección, antes de tocar una pantalla.

Las ramas `fase-*` (plan v1) y `fase-frontend-0N-*` (rediseño) fueron los
vehículos de esos dos planes: encadenadas entre sí, mergeadas a `staging` y
de ahí a `main`. Ya están todas integradas: no buscar trabajo pendiente ahí.
Los PRs de la ronda de fixes son `fix-0N-*`, cada uno saliendo de `staging`
actualizado (no apilados entre sí salvo la cadena 1→2→3; ver §0.1 y §4 del
plan de fixes), PR contra `staging`.

Comandos:

```
pnpm dev                # levanta las tres superficies en localhost:3000
pnpm build / lint / typecheck / test / format:check
pnpm db:generate         # genera una migración a partir de src/db/schema.ts
pnpm db:migrate          # la aplica (drizzle-kit, requiere DATABASE_URL)
pnpm db:migrate:deploy   # variante para producción (Docker), sin drizzle-kit
pnpm db:seed             # carga contenido/datos base (tsx src/db/seed.ts)
pnpm db:bootstrap <email> <password> [nombre] [apellido]
                         # primer empleado — obligatorio en una base nueva:
                         # sin él no hay forma de entrar a /app (no hay
                         # registro público y el ABM de personas está adentro)
docker compose up -d     # Postgres local — copiar .env.example a .env primero
```

Los tests de integración (`*.integration.test.ts`) levantan su propio
Postgres efímero vía testcontainers — no dependen de `docker compose`.

Documentos de referencia, en orden de lectura:

1. [`docs/specs/2026-08-14-plataforma-mirage-design.md`](docs/specs/2026-08-14-plataforma-mirage-design.md) —
   diseño aprobado: kernel, contrato de módulo, schema de cada módulo, flujos,
   manejo de errores, testing, deploy.
2. [`docs/plan/2026-08-18-plan-de-implementacion-v1.md`](docs/plan/2026-08-18-plan-de-implementacion-v1.md) —
   38 PRs en 8 fases del backend/kernel, ya integrados. Queda como referencia
   histórica, no como trabajo por hacer.
3. [`docs/specs/2026-08-21-sistema-visual-mirage.md`](docs/specs/2026-08-21-sistema-visual-mirage.md) —
   sistema visual aprobado: paleta y tokens semánticos, tipografía, movimiento,
   inventario cerrado de componentes, pantalla por pantalla de las tres
   superficies. Normativo: "solo", "nunca" y "máximo" son restricciones duras.
4. [`docs/plan/2026-08-21-plan-frontend.md`](docs/plan/2026-08-21-plan-frontend.md) —
   plan de implementación del rediseño, 12 PRs, orden tokens → landing → interno.
   Es el plan de trabajo vigente para UI; seguirlo en orden salvo que el
   usuario indique lo contrario.

El contexto de negocio (por qué existe Mirage, organigrama real, registro de
decisiones) vive en el repo hermano `../mirage-empresa/`, fuera de este
repositorio.

## Cuando se empiece a escribir código

Seguir el plan de implementación al pie: cada PR es una unidad — entra a
`main` solo, con CI en verde, sin dejar nada a medias. Las reglas que valen
para todos los PRs (sección 0 del plan):

- Un PR no rompe `main`.
- Migraciones aditivas por defecto (agregar columnas/tablas; renombrar y
  borrar son operaciones de dos pasos, aparte).
- El PR que agrega un módulo agrega también el test de su `api.ts`. No hay
  "los tests después".

## Arquitectura (kernel + módulos)

Monolito modular en Next.js (App Router) + TypeScript + Drizzle + PostgreSQL.
Tres superficies, un solo deploy, misma base de datos y sesión:

| Superficie | Ruta | Acceso |
|---|---|---|
| Web pública | `/` | Sin sesión |
| Sistema interno | `/app` | Sesión + `persona.tipo = 'empleado'` |
| Portal de clientes | `/portal` | Sesión + `tipo = 'contacto_cliente'`, restringido a su cliente |

Un **kernel** chico y estable (identidad, organigrama, permisos, auditoría,
eventos) con **módulos** enchufados encima (`contenido`, `clientes`,
`proyectos`, `solicitudes`, `notificaciones`).

**La regla que sostiene todo:** un módulo nunca importa de
`modules/<otro>/` salvo `modules/<otro>/api.ts`, ni de `kernel/<pieza>/internal/`.
Se comunican solo llamando al `api.ts` ajeno o vía el bus de eventos en
proceso. Esto se impone con `no-restricted-imports` de ESLint, bloqueante en
CI (PR 0.2) — no es una convención, es mecánico. Si aparece un
`eslint-disable` sobre esa regla, es señal de que el límite entre módulos está
mal puesto; el arreglo es rediseñar el límite, no silenciar la regla.

Forma fija de cada módulo:

```
modules/<nombre>/
  module.ts        manifiesto y registro
  schema.ts        sus tablas (prefijadas con el nombre del módulo)
  api.ts           ÚNICA superficie pública
  events.ts        qué publica y a qué se suscribe
  permissions.ts   capacidades que declara
  ui/              pantallas y entradas de navegación
  internal/        todo lo demás — privado
```

Estructura de carpetas planeada para PR 0.1 (fija desde ese PR, no se
reabre después):

```
src/
  app/
    (publico)/          → /
    (interno)/app/      → /app
    (portal)/portal/    → /portal
  kernel/
    identidad/ organigrama/ permisos/ auditoria/ eventos/
  modules/
    <nombre>/ module.ts schema.ts api.ts events.ts permissions.ts ui/ internal/
  db/
    schema.ts migrations/ client.ts
```

### Puntos de diseño no obvios (para no repetirlos por error)

- **El anillo del organigrama se calcula, no se guarda** (profundidad vía
  `WITH RECURSIVE`). Guardarlo garantiza desincronización al mover un nodo.
- **Los nodos se archivan, no se borran** — hay trabajo histórico colgando.
- **`nodo_responsable_id` (obligatorio) + `persona_asignada_id` (opcional)**
  en `tarea`: el nodo dice qué responsabilidad es dueña del trabajo, la
  persona quién lo hace hoy. Se repite el mismo patrón nodo/persona en
  `cliente` (`nodo_responsable_id` + `contacto_directo_id`).
- **Progreso ≠ actividad.** Progreso = tareas hechas / totales, declarado por
  alguien. Actividad = commits/PRs/contribuyentes de GitHub. Nunca se mezclan
  en el mismo número, y el cliente en `/portal` solo ve progreso.
- **Sync de GitHub nunca en el request** — job cada 30 min que escribe
  `repositorio_snapshot`; las pantallas solo leen esa tabla.
- **Multi-dominio por host, no por variable de entorno.** Un solo deploy
  sirve `miragesoftware.com.ar` (canónico), `.online` (staging) y `.store`
  (solo redirige). `src/lib/dominio.ts` + `robots.ts` (noindex si el host
  no es el canónico) + `proxy.ts` (301 desde `.store`) deciden según
  el header `Host` de cada request, no un env var por deploy — así hace
  falta un solo servicio de Render con los tres dominios apuntados.
- **Mails nunca dentro del request** — se escribe la fila en `notificacion` y
  un worker la toma, con hasta 5 reintentos y backoff exponencial.
- **Bus de eventos: si un suscriptor falla, el publicador no se entera** — se
  registra el error y sigue. Si la falla del suscriptor debería invalidar la
  operación del publicador, no es un evento: es una llamada a `api.ts`.
- **Bus de eventos: `suscribir()` en `instrumentation.ts` no funciona.**
  Next.js empaqueta ese archivo en un chunk de servidor separado del que
  corre cada Server Action — un módulo que se suscribe ahí, una sola vez al
  arrancar, no comparte estado con la copia de `kernel/eventos/bus.ts` que
  termina llamando a `publicar()` de verdad (cada chunk se lleva su propia
  copia del array de suscripciones). Encontrado en producción real (PR 6.2):
  las notificaciones no salían y no había ningún error, porque el bus
  publicaba contra un array vacío en silencio. El arreglo es que `bus.ts` se
  auto-inicializa solo, la primera vez que `publicar()` corre en cada chunk,
  importando `kernel/eventos/registro.ts` (agregador de los `events.ts` de
  cada módulo, mismo patrón que `capacidades-declaradas.ts`) — así cada
  chunk termina con sus propias suscripciones completas, sin depender de que
  algo externo las haya cargado antes. `destinatarioPersonaId` en los
  payloads de `cliente.creado` / `proyecto.*` se resuelve en el módulo que
  publica (vía `kernel/organigrama/arbol.obtenerTitularDeNodo`), no en
  notificaciones — que no puede importar `modules/<otro>` ni para esto.
- **Auditoría append-only por trigger, no por rol.** `REVOKE UPDATE, DELETE
  ... FROM CURRENT_USER` es un no-op: Postgres no aplica el ACL al dueño de
  la tabla, y acá migración y app comparten un solo rol. Lo hace un trigger
  (`evento_auditoria_bloquear_modificacion`) que rechaza sin condición.
- **Permisos: el kernel no conoce a los módulos, un agregador sí.**
  `kernel/permisos/registro.ts` es genérico; `capacidades-declaradas.ts`
  agrega el `permissions.ts` de cada módulo (mismo patrón que
  `db/schema.ts` con las tablas). El registro real corre en
  `instrumentation.ts` (`register()` de Next, una vez al arrancar el
  server node) — si falla, se loguea y el server arranca igual.
- **Sesión: real desde el PR 3.1.** `obtenerSesion()` lee la sesión de
  better-auth (`auth.api.getSession`) y la resuelve a la `persona`
  vinculada por `usuario_id`; sin persona vinculada, `null` — un usuario
  de better-auth sin persona no es nadie para el resto del sistema.
  `proxy.ts` corre esto en cada request; funciona porque el "proxy" de
  Next 16 (antes "middleware") corre en runtime node, no edge — con edge
  no se podría tocar la base acá. `reglas-acceso.ts` sigue siendo la
  función pura que decide permitir/no-encontrado; no cambió.
- **`obtenerSesionActual()` no sirve para leer la sesión que se acaba
  de crear en la misma Server Action.** `headers()` de `next/headers`
  devuelve las cabeceras de la request ENTRANTE, de solo lectura — la
  cookie que `signInEmail` fija (vía el plugin `nextCookies()`) es de
  la respuesta que todavía no volvió al navegador. Llamar
  `obtenerSesionActual()` justo después de `signInEmail`, en la misma
  acción, resuelve la sesión VIEJA (quien estaba logueado antes en ese
  navegador, si había alguien) — no la nueva. Encontrado en vivo (PR
  7.2), verificando el login real en el navegador con dos cuentas
  seguidas: la segunda te mandaba según la cuenta anterior, no la que
  acababas de poner. La cookie en sí se fija bien (confirmado con
  `/api/auth/get-session` después de que la acción termina); el
  problema es solo leerla de vuelta demasiado pronto. El arreglo:
  `signInEmail` ya devuelve `user.id` — resolver el `tipo` de la
  persona con ese id directo (una consulta a `persona`), sin pasar por
  la cookie. Ningún test de integración lo agarra (no hay ciclo
  request/response real ahí); solo aparece con Server Actions de
  verdad, en el navegador.
- **better-auth: tablas en español, campos en inglés (default de la
  librería).** El diseño pide `usuario`/`sesion`/`cuenta` como nombres de
  tabla literales (backticks en el doc) — se cumple vía `modelName` en la
  config. Los CAMPOS (`name`, `email`, `emailVerified`...) se dejan sin
  traducir a propósito: better-auth los referencia por esa clave exacta
  cuando se le pasa un schema propio, y traducirlos es superficie para un
  mapeo mal hecho sin beneficio real (no son texto que vea un usuario).
  Verificado contra el paquete instalado (`getAuthTables` de
  `better-auth/db`), no contra la documentación pública — para esto
  puntualmente la doc en `better-auth.com` dio información contradictoria
  sobre la forma del adapter de Drizzle.
- **Aislamiento del portal:** toda consulta de `/portal` se filtra por
  `cliente_id` derivado de la sesión, nunca de un parámetro de URL. Es la
  superficie de mayor riesgo del sistema; tiene tests dedicados que se
  escriben antes que la funcionalidad (PR 7.1).
- Un `contacto_cliente` que pide una ruta de `/app` recibe **404, no 403**
  (un 403 confirma que la ruta existe).
- Errores tipados por módulo: `NoAutorizado`, `NoEncontrado`, `Validacion`,
  `Conflicto`. Nunca se filtra detalle interno al portal.

### Convenciones de nombres

Dominio en español (`persona`, `nodo`, `cliente`, `solicitud`...). Tablas en
`snake_case` singular; las de un módulo prefijadas con su nombre
(`clientes_cliente`, `proyectos_tarea`); las del kernel sin prefijo
(`persona`, `nodo`). Teléfonos en E.164 (`+5491122334455`).

## Rediseño de frontend (plan vigente)

El diseño completo vive en `docs/specs/2026-08-21-sistema-visual-mirage.md`
y el plan de ejecución en `docs/plan/2026-08-21-plan-frontend.md` — leerlos
antes de tocar una pantalla, no resumir de memoria. Lo que sigue es lo que
no es obvio releyéndolos sueltos:

- **El orden importa y está en el nombre del juego: tokens → landing →
  interno.** El PR 1 (tokens) es cuello de botella deliberado — toca
  `src/app/globals.css`, `components/ui/*` y nada más. Pintar una pantalla
  de negocio antes de que el PR 1 esté mergeado significa repintarla.
- **Ya existe andamiaje que el plan reusa, no crea de cero:**
  `src/components/ui/{button,card}.tsx` (sobre Base UI/shadcn) y
  `src/app/dev/ui/page.tsx` — la vitrina visual contra la que se revisa cada
  PR posterior. El PR 1 la expande, no la inaugura.
- **Presupuesto de WebGL por página** (revisado en el PR 2 de la ronda de
  fixes; antes era "un solo fondo WebGL en toda la plataforma"): uno en el
  hero de `/` (Prism), hasta dos activos a la vez en el resto de la landing
  (auroras de sección, montadas/desmontadas por viewport), **cero** en
  `/app` y `/portal`. El resto del ambiente (`FondoSeccion`/`FondoContinuo`,
  page breaks, revelados) es CSS/SVG. El límite es de rendimiento —cada
  contexto WebGL + RAF compite por el hilo principal en un celular de gama
  media—, y lo que cuenta es cuántos contextos activos hay a la vez. Ver
  §5.1-5.3 del sistema visual.
- **`--accent` de shadcn pasa a ser ámbar.** Su default (hover de menú/ítem)
  hay que reasignarlo a `secondary` en el PR 1, o cada hover del interno
  queda naranja. `--border` y `--input` dejan de compartir valor por la
  misma razón: accesibilidad de contraste, no estética.
- **Inventario de React Bits** (§6.8 del sistema visual): **abierto para
  los fondos de la landing** (el único límite es el presupuesto de
  rendimiento de arriba), cerrado para el resto —botones, cards, menús son
  superficie de negocio—. Revisado en el PR 2 de la ronda de fixes; antes
  era cerrado para todo. Hoy montados: `Prism` (hero) y `SoftAurora`
  (fondos de sección). `card-swap` salió (la sección de capacidades de `/`
  son tres cards sin rotación).
- **El plan expuso una brecha de modelo, no solo de UI:** no existen
  inscripciones a proyectos (`proyectos_inscripcion`, con `cupo`). Hoy "mis
  proyectos"/"mis tareas" salen de los nodos del organigrama;
  `proyectos_inscripcion` responde una pregunta distinta (quién lo hace
  hoy, no qué responsabilidad es dueña) y sin ella el PR 10 no puede
  empezar. Los PRs 11 y 12 dependen a su vez del 10 — es una cadena, no se
  adelantan. Las tareas siguen colgando del nodo, nunca de la inscripción,
  para no quedar huérfanas si la persona se va.
- **La "definición de terminado" del plan (§2) se aplica a los 12 PRs, sin
  excepción:** tipos/lint/test/build en verde, cero color literal fuera de
  `globals.css`, ambos temas, 390px sin scroll horizontal, estados
  vacío/carga/error, navegación por teclado, y los presupuestos de
  rendimiento del hero (LCP ≤ 2.5s, JS inicial ≤ 180 KB sin el shader).
- **`.claude/launch.json`** ya está corregido: corre `pnpm dev` en el puerto
  3000, sin apuntar a ningún worktree. (La nota vieja decía que apuntaba a
  `.worktrees/fase-7-solicitudes-portal`; se verificó en el PR 1 de la ronda
  de fixes y ya no es así.)

## Decisiones ya cerradas (no reabrir sin motivo nuevo)

- **Auth:** better-auth (con adaptador de Drizzle), no Auth.js v5 ni Clerk.
  Dueño de `usuario`/`sesion`/`cuenta`; `persona` es el modelo de dominio
  aparte, con `usuario_id` nullable.
- **UI:** Tailwind CSS v4 + shadcn/ui (componentes copiados al repo, no
  dependencia) + Lucide. Las tres superficies comparten primitivos, **no**
  layout ni densidad (`/app` denso, `/portal` amplio y explicativo).
- **Sin Bun** — npm o pnpm. Ver decisión en `mirage-empresa`.
- **Sin cola externa de eventos en v1**, sin GitHub App/webhooks, sin
  multi-empresa. Ver `docs/specs/.../§14` para el resto de lo fuera de
  alcance.

## Testing (cuando exista código)

Integración contra PostgreSQL real en contenedor efímero, no mocks — las
invariantes (dos raíces únicas, un titular vigente por nodo, sin ciclos) viven
en índices y constraints de la base, y un doble no las prueba.

## CI (desde PR 0.2)

GitHub Actions corre `lint`, `typecheck`, `test` y `build` en cada PR; merge
bloqueado si falla alguno. El chequeo de frontera de módulos (ESLint) es parte
de ese pipeline, no una revisión manual aparte.

## Variables de entorno

`DATABASE_URL`, `BETTER_AUTH_SECRET` (32+ caracteres — `openssl rand -base64
32`; sin ella better-auth arranca con un secreto default inseguro y lo
loguea fuerte, no rompe el build), `BETTER_AUTH_URL`, `GITHUB_TOKEN` (fino,
solo lectura, org — sin él la actividad de GitHub de los proyectos da 403),
`RESEND_API_KEY` (envío de mails: invitación, verificación, recuperar
contraseña — sin él quedan encoladas y fallan al salir, el resto anda),
`SETUP_TOKEN` (habilita `/setup`, el arranque en frío desde el navegador;
la ruta responde solo si la tabla `persona` está vacía **y** el request
trae `?token=` con este valor — dejarla vacía deshabilita la ruta),
`TZ=America/Argentina/Buenos_Aires`.

En Render, `RESEND_API_KEY` / `SETUP_TOKEN` / `GITHUB_TOKEN` van con
`sync: false` en `render.yaml` y se cargan a mano en el dashboard.

## Ramas

`main` no recibe pushes directos — está protegida en GitHub (requiere PR,
incluso para el admin). Todo el trabajo va a `staging` vía PR: rama de
feature/PR → PR contra `staging`. La promoción de `staging` a `main` es,
a su vez, otro PR (`staging` → `main`), no un push directo.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
