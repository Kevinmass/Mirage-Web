# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estado del repo

**No hay código todavía.** Este repo contiene solo el diseño y el plan de
implementación de la v1. El primer PR de código es "PR 0.1 — Esqueleto de
Next.js" (ver plan). Antes de asumir que existe algo (`package.json`,
`src/`, tests, CI), verificar con `ls` — este documento se queda desactualizado
rápido apenas arranque la implementación, y en ese momento hay que actualizarlo
con los comandos reales de build/lint/test.

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
`modules/<otro>/` salvo `modules/<otro>/api.ts`. Se comunican solo llamando al
`api.ts` ajeno o vía el bus de eventos en proceso. Esto se impone con
`no-restricted-imports` de ESLint, bloqueante en CI (PR 0.2) — no es una
convención, es mecánico. Si aparece un `eslint-disable` sobre esa regla, es
señal de que el límite entre módulos está mal puesto; el arreglo es rediseñar
el límite, no silenciar la regla.

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
- **Mails nunca dentro del request** — se escribe la fila en `notificacion` y
  un worker la toma, con hasta 5 reintentos y backoff exponencial.
- **Bus de eventos: si un suscriptor falla, el publicador no se entera** — se
  registra el error y sigue. Si la falla del suscriptor debería invalidar la
  operación del publicador, no es un evento: es una llamada a `api.ts`.
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
