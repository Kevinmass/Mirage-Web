import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Mismo alias que tsconfig.json ("@/*" -> "./src/*"); Vitest no lo lee
    // solo de ahí.
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    // Los tests de integración levantan un contenedor de Postgres real
    // (testcontainers): descargar la imagen y arrancarlo tarda más que el
    // timeout por defecto de Vitest.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
