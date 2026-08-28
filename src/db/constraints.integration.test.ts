import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Prueba de la andamiaje de tests de integración (PR 0.5), no de una
// invariante real: todavía no hay tablas propias con constraints (las
// primeras llegan en kernel/organigrama, PR 3.3). Contra Postgres real en
// un contenedor efímero — no un doble — porque las invariantes de este
// proyecto viven en índices de la base y un mock no las prueba (ver
// diseño §10).
describe("Postgres real vía testcontainers", () => {
  let container: StartedPostgreSqlContainer;
  let sql: ReturnType<typeof postgres>;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:17-alpine").start();
    sql = postgres(container.getConnectionUri());
    await sql`CREATE TABLE prueba_unicidad (token text UNIQUE NOT NULL)`;
  });

  afterAll(async () => {
    await sql.end();
    await container.stop();
  });

  it("un índice único rechaza el duplicado", async () => {
    await sql`INSERT INTO prueba_unicidad (token) VALUES ('a')`;

    await expect(
      sql`INSERT INTO prueba_unicidad (token) VALUES ('a')`,
    ).rejects.toThrow();
  });
});
