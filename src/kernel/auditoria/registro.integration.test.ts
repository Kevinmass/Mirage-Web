import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eventoAuditoria } from "./schema";

// Contra Postgres real en un contenedor efímero (diseño §10): append-only
// es una invariante de la base (un trigger, ver
// db/migrations/0002_revocar_update_delete_evento_auditoria.sql), no del
// código de aplicación — un doble no la prueba.
describe("kernel/auditoria — append-only", () => {
  let container: StartedPostgreSqlContainer;
  let registrarEvento: (typeof import("./registro"))["registrarEvento"];
  let db: (typeof import("@/db/client"))["db"];
  let client: (typeof import("@/db/client"))["client"];

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:17-alpine").start();
    process.env.DATABASE_URL = container.getConnectionUri();

    ({ db, client } = await import("@/db/client"));
    ({ registrarEvento } = await import("./registro"));

    await migrate(db, { migrationsFolder: "./src/db/migrations" });
  });

  afterAll(async () => {
    await client.end();
    await container.stop();
  });

  it("registrarEvento inserta una fila", async () => {
    await registrarEvento({ accion: "creo", entidad: "prueba" });

    const filas = await db.select().from(eventoAuditoria);
    expect(filas).toHaveLength(1);
    expect(filas[0]).toMatchObject({ accion: "creo", entidad: "prueba" });
  });

  it("un UPDATE con el rol de aplicación es rechazado por la base", async () => {
    await registrarEvento({ accion: "creo", entidad: "prueba" });
    const [fila] = await db.select().from(eventoAuditoria).limit(1);

    await expect(
      client`UPDATE evento_auditoria SET accion = 'hackeado' WHERE id = ${fila!.id}`,
    ).rejects.toThrow(/append-only/);
  });

  it("un DELETE con el rol de aplicación es rechazado por la base", async () => {
    await registrarEvento({ accion: "creo", entidad: "prueba" });
    const [fila] = await db.select().from(eventoAuditoria).limit(1);

    await expect(
      client`DELETE FROM evento_auditoria WHERE id = ${fila!.id}`,
    ).rejects.toThrow(/append-only/);
  });
});
