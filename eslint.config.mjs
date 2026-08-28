import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import fs from "node:fs";
import path from "node:path";

// Frontera de módulos (diseño §5, plan PR 0.2): un archivo dentro de
// src/modules/<A>/ no puede importar de src/modules/<B>/ salvo
// src/modules/<B>/api, ni de src/kernel/<pieza>/internal/. Se genera un
// override por módulo existente porque no-restricted-imports no tiene forma
// de referenciar "el módulo del archivo que se está lintiando" dentro de un
// único patrón: hay que enumerar explícitamente "los otros módulos" por
// cada uno.
//
// No se bloquea todo y se negocia una excepción para /api: el paquete
// `ignore` que usa no-restricted-imports sigue reglas de .gitignore, donde
// una negación no puede "reincluir" un archivo bajo un patrón que ya
// excluyó el directorio entero. En cambio se listan explícitamente los
// puntos de entrada no públicos del contrato de módulo (module.ts,
// schema.ts, events.ts, permissions.ts, ui/, internal/) — la lista es fija
// porque el contrato de módulo también lo es (ver modules/README.md).
const PUNTOS_NO_PUBLICOS = [
  "module",
  "module.ts",
  "schema",
  "schema.ts",
  "events",
  "events.ts",
  "permissions",
  "permissions.ts",
  "ui/**",
  "internal/**",
];

const modulesDir = path.join(import.meta.dirname, "src/modules");
const nombresDeModulos = fs.existsSync(modulesDir)
  ? fs
      .readdirSync(modulesDir, { withFileTypes: true })
      .filter((entrada) => entrada.isDirectory())
      .map((entrada) => entrada.name)
  : [];

const fronterasDeModulo = nombresDeModulos.map((nombre) => {
  const otros = nombresDeModulos.filter((otro) => otro !== nombre);
  return {
    files: [`src/modules/${nombre}/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...otros.map((otro) => ({
              group: PUNTOS_NO_PUBLICOS.map(
                (punto) => `**/modules/${otro}/${punto}`,
              ),
              message: `Un módulo solo puede importar modules/${otro}/api, no su interior. Ver modules/README.md.`,
            })),
            {
              group: ["**/kernel/*/internal", "**/kernel/*/internal/**"],
              message:
                "Un módulo no puede importar de kernel/<pieza>/internal/.",
            },
          ],
        },
      ],
    },
  };
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...fronterasDeModulo,
  {
    rules: {
      // Convención del repo: un parámetro que hay que declarar por firma
      // pero todavía no se usa (stubs como kernel/identidad/sesion.ts,
      // que espera al PR 3.1) se prefija con _ a propósito.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
