import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { capacidad } from "./schema";

describe("kernel/permisos — registro de capacidades", () => {
  let container: StartedPostgreSqlContainer;
  let registrarCapacidades: (typeof import("./registro"))["registrarCapacidades"];
  let db: (typeof import("@/db/client"))["db"];
  let client: (typeof import("@/db/client"))["client"];

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:17-alpine").start();
    process.env.DATABASE_URL = container.getConnectionUri();

    ({ db, client } = await import("@/db/client"));
    ({ registrarCapacidades } = await import("./registro"));

    await migrate(db, { migrationsFolder: "./src/db/migrations" });
  });

  afterAll(async () => {
    await client.end();
    await container.stop();
  });

  it("registra capacidades nuevas", async () => {
    await registrarCapacidades([
      { clave: "a.uno", modulo: "a", descripcion: "uno" },
      { clave: "a.dos", modulo: "a", descripcion: "dos" },
    ]);

    const filas = await db.select().from(capacidad);
    expect(filas.map((f) => f.clave).sort()).toEqual(["a.dos", "a.uno"]);
    expect(filas.every((f) => !f.huerfana)).toBe(true);
  });

  it("una capacidad que un módulo dejó de declarar queda huérfana, no se borra", async () => {
    await registrarCapacidades([
      { clave: "b.uno", modulo: "b", descripcion: "uno" },
      { clave: "b.dos", modulo: "b", descripcion: "dos" },
    ]);

    // El módulo b ahora solo declara b.uno.
    await registrarCapacidades([
      { clave: "b.uno", modulo: "b", descripcion: "uno" },
    ]);

    const [uno] = await db
      .select()
      .from(capacidad)
      .where(eq(capacidad.clave, "b.uno"));
    const [dos] = await db
      .select()
      .from(capacidad)
      .where(eq(capacidad.clave, "b.dos"));

    expect(uno?.huerfana).toBe(false);
    // Sigue existiendo — no se borró — pero marcada.
    expect(dos).toBeDefined();
    expect(dos?.huerfana).toBe(true);
  });

  it("una capacidad huérfana que vuelve a declararse deja de estarlo", async () => {
    await registrarCapacidades([
      { clave: "c.uno", modulo: "c", descripcion: "uno" },
    ]);
    await registrarCapacidades([]); // c.uno queda huérfana
    await registrarCapacidades([
      { clave: "c.uno", modulo: "c", descripcion: "uno, de nuevo" },
    ]);

    const [fila] = await db
      .select()
      .from(capacidad)
      .where(eq(capacidad.clave, "c.uno"));

    expect(fila?.huerfana).toBe(false);
    expect(fila?.descripcion).toBe("uno, de nuevo");
  });
});
