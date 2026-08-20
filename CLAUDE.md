# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estado del repo

En implementación siguiendo el plan (Fase 0 completa, Fase 1 en curso).
Next.js + TypeScript + Drizzle + Postgres ya están andando — ver
`package.json` antes de asumir que un comando no existe.

Comandos:

```
pnpm dev                # levanta las tres superficies en localhost:3000
pnpm build / lint / typecheck / test / format:check
pnpm db:generate         # genera una migración a partir de src/db/schema.ts
pnpm db:migrate          # la aplica (drizzle-kit, requiere DATABASE_URL)
pnpm db:migrate:deploy   # variante para producción (Docker), sin drizzle-kit
pnpm db:seed             # carga contenido/datos base (tsx src/db/seed.ts)
docker compose up -d     # Postgres local — copiar .env.example a .env primero
```

Los tests de integración (`*.integration.test.ts`) levantan su propio
Postgres efímero vía testcontainers — no dependen de `docker compose`.

Documentos de referencia, en orden de lectura:

1. [`docs/specs/2026-08-14-plataforma-mirage-design.md`](docs/specs/2026-08-14-plataforma-mirage-design.md) —
   diseño aprobado: kernel, contrato de módulo, schema de cada módulo, flujos,
   manejo de errores, testing, deploy.
2. [`docs/plan/2026-08-18-plan-de-implementacion-v1.md`](docs/plan/2026-08-18-plan-de-implementacion-v1.md) —
   38 PRs en 8 fases, con criterio de aceptación por PR. Es el plan de trabajo
   vigente; seguirlo en orden salvo que el usuario indique lo contrario.

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
solo lectura, org), `RESEND_API_KEY`, `TZ=America/Argentina/Buenos_Aires`.

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
