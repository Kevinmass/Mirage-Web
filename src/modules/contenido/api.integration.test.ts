import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { contenidoCaso, contenidoPagina, contenidoServicio } from "./schema";

// Contra Postgres real en un contenedor efímero, no mocks (diseño §10).
//
// api.ts importa el cliente singleton @/db/client, que lee DATABASE_URL al
// cargarse. Por eso ese import (y el de api.ts, que lo arrastra) es
// dinámico y recién pasa DESPUÉS de levantar el contenedor y setear la
// variable — un import estático arriba del archivo se resolvería antes de
// que el contenedor exista.
describe("modules/contenido api", () => {
  let container: StartedPostgreSqlContainer;
  let api: typeof import("./api");
  let db: (typeof import("@/db/client"))["db"];
  let client: (typeof import("@/db/client"))["client"];

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:17-alpine").start();
    process.env.DATABASE_URL = container.getConnectionUri();

    ({ db, client } = await import("@/db/client"));
    api = await import("./api");

    await migrate(db, { migrationsFolder: "./src/db/migrations" });

    await db.insert(contenidoPagina).values([
      {
        slug: "inicio",
        titulo: "Mirage",
        cuerpo: "# Mirage",
        publicada: true,
      },
      {
        slug: "borrador",
        titulo: "Sin publicar",
        cuerpo: "shh",
        publicada: false,
      },
    ]);
    await db.insert(contenidoServicio).values([
      { nombre: "Activo, primero", descripcion: "d", orden: 1, activo: true },
      { nombre: "Activo, segundo", descripcion: "d", orden: 2, activo: true },
      { nombre: "Inactivo", descripcion: "d", orden: 0, activo: false },
    ]);
    await db.insert(contenidoCaso).values([
      { titulo: "Publicado", resumen: "r", publicado: true, clienteId: null },
      {
        titulo: "Sin publicar",
        resumen: "r",
        publicado: false,
        clienteId: null,
      },
    ]);
  });

  afterAll(async () => {
    await client.end();
    await container.stop();
  });

  it("obtenerPaginaPorSlug devuelve una página publicada", async () => {
    const pagina = await api.obtenerPaginaPorSlug("inicio");
    expect(pagina?.titulo).toBe("Mirage");
  });

  it("obtenerPaginaPorSlug no devuelve una página sin publicar", async () => {
    const pagina = await api.obtenerPaginaPorSlug("borrador");
    expect(pagina).toBeUndefined();
  });

  it("obtenerPaginaPorSlug no devuelve nada si el slug no existe", async () => {
    const pagina = await api.obtenerPaginaPorSlug("no-existe");
    expect(pagina).toBeUndefined();
  });

  it("listarServiciosActivos filtra inactivos y ordena por orden", async () => {
    const servicios = await api.listarServiciosActivos();
    expect(servicios.map((s) => s.nombre)).toEqual([
      "Activo, primero",
      "Activo, segundo",
    ]);
  });

  it("listarCasosPublicados filtra los no publicados", async () => {
    const casos = await api.listarCasosPublicados();
    expect(casos).toHaveLength(1);
    expect(casos[0]?.titulo).toBe("Publicado");
  });
});
