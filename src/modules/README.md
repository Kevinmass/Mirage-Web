# Contrato de módulo

Copiado de `docs/specs/2026-08-14-plataforma-mirage-design.md` §5. No se
reabre sin motivo nuevo.

Todo módulo es una carpeta con forma fija:

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

**La regla que sostiene la arquitectura:**

> Un módulo nunca importa de `modules/<otro>/` salvo `modules/<otro>/api`.

Se impone con la regla `no-restricted-imports` de ESLint y **falla el build
en CI** (PR 0.2). No es una convención de buena voluntad: sin bloqueo
automático, en seis meses queda un monolito enredado con carpetas prolijas.
Ese es el modo de fracaso característico de esta arquitectura y la única
defensa efectiva es mecánica.

Los módulos se comunican de dos formas y ninguna otra: llamando al `api.ts`
del otro, o publicando y escuchando eventos.

Módulos de v1 (ver diseño §6): `contenido`, `clientes`, `proyectos`,
`solicitudes`, `notificaciones`.
