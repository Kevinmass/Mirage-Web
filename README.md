# Plataforma Mirage

Web pública + sistema interno + portal de clientes, en un monolito modular.

> **Estado: v1 implementada.** Las 8 fases del plan están en `main`. Falta el
> panel de edición de contenido (la web pública se sirve del seed) y ajustar
> permisos: hoy solo `clientes.*` se verifica de verdad.

| Superficie | Ruta | Acceso |
|---|---|---|
| Web pública | `/` | Sin sesión |
| Sistema interno | `/app` | Sesión + `persona.tipo = 'empleado'` |
| Portal de clientes | `/portal` | Sesión + `tipo = 'contacto_cliente'`, restringido a su cliente |

Las tres comparten base de datos, sesión y kernel. Cada una tiene su layout, su
navegación y sus reglas de acceso.

## Arrancar en local

Requiere Node 20+, pnpm 10 y Docker (solo para el Postgres).

```bash
pnpm install
cp .env.example .env          # editá BETTER_AUTH_SECRET: openssl rand -base64 32
docker compose up -d          # Postgres en localhost:5432

pnpm db:migrate:deploy        # crea las tablas
pnpm db:seed                  # contenido de la web pública
pnpm db:bootstrap tu@email.com "una-password-larga" Nombre Apellido

pnpm dev                      # http://localhost:3000
```

**`db:bootstrap` no es opcional en una base nueva.** No hay registro público —
el alta de personas vive dentro de `/app`, y `/app` exige ser un empleado que ya
existe. Sin ese primer empleado la base recién migrada es un callejón sin
salida: la web pública anda, pero a `/app` y `/portal` no entra nadie nunca. El
script crea la persona, su usuario, y un rol con todas las capacidades. Es
idempotente; correrlo dos veces no duplica nada ni pisa la contraseña.

Después de eso, entrá por `/ingresar`. Los contactos de cliente **no** se crean
con este script: se dan de alta desde `/app/clientes` y se los invita por mail.

## Comandos

```
pnpm dev / build / start
pnpm lint / typecheck / test / format:check
pnpm db:generate          # genera una migración desde src/db/schema.ts
pnpm db:migrate           # la aplica (drizzle-kit, necesita DATABASE_URL)
pnpm db:migrate:deploy    # variante para producción (Docker), sin drizzle-kit
pnpm db:seed              # contenido de la web pública
pnpm db:bootstrap         # primer empleado (ver arriba)
```

Los tests de integración (`*.integration.test.ts`) levantan su propio Postgres
efímero con testcontainers — no usan el `docker compose` de arriba.

## Ramas

`main` es el código vigente. `staging` es la rama de pre-producción y hoy
apunta al mismo commit. Las ramas `fase-*` fueron el vehículo de implementación
(una por fase del plan, encadenadas) y ya están integradas: no queda nada
pendiente de mergear en ellas.

## Stack

Next.js 16 (App Router) · TypeScript · Drizzle · PostgreSQL · pnpm · Render

**Sin Bun.** Ver `../mirage-empresa/04-tecnologia/stack.md`.

## Arquitectura en una frase

Un **kernel** chico y estable —identidad, organigrama, permisos, auditoría,
eventos— con **módulos** enchufados encima. Cada módulo expone un único `api.ts`
y todo lo demás es privado; ESLint hace fallar el build si alguien cruza ese
límite.

## Contexto

Las decisiones de negocio y arquitectura, con su justificación, están en
[`../mirage-empresa/`](../mirage-empresa/README.md). En particular:

- `02-estructura/organigrama.md` — el modelo organizacional que la app implementa
- `03-decisiones/registro-de-decisiones.md` — qué se decidió y qué se descartó

El diseño y el plan de implementación viven en [`docs/`](docs/).
