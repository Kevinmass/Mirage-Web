# Plataforma Mirage

Web pública + sistema interno + portal de clientes, en un monolito modular.

> **Estado: en diseño.** Todavía no hay código. El diseño se está definiendo y
> quedará en `docs/specs/` antes de escribir la primera línea.

## Qué va a ser

| Superficie | Ruta | Para quién |
|---|---|---|
| Web pública | `/` | Cualquiera que quiera conocer Mirage |
| Sistema interno | `/app` | Empleados de Mirage |
| Portal de clientes | `/portal` | Clientes de Mirage |

Las tres comparten base de datos, sesión y kernel. Cada una tiene su layout, su
navegación y sus reglas de acceso.

## Stack

Next.js (App Router) · TypeScript · Drizzle · PostgreSQL · npm/pnpm · Render

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
