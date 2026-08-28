import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { asignacion, nodo } from "./schema";
import { persona } from "@/kernel/identidad/schema";

// Contra Postgres real (diseño §10): estas tres invariantes viven en
// índices de la base, no en código de aplicación — un doble no las
// prueba. Cada test intenta violar una y confirma que la base la
// rechaza (criterio de aceptación del PR 3.3).
describe("kernel/organigrama — invariantes en la base", () => {
  let container: StartedPostgreSqlContainer;
  let db: (typeof import("@/db/client"))["db"];
  let client: (typeof import("@/db/client"))["client"];

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:17-alpine").start();
    process.env.DATABASE_URL = container.getConnectionUri();

    ({ db, client } = await import("@/db/client"));
    await migrate(db, { migrationsFolder: "./src/db/migrations" });
  });

  // Cada test arma su propia raíz "interno": sin esto, el segundo test
  // chocaría contra la invariante del primero (que sigue viva en la
  // misma base) en vez de contra la que quiere probar.
  beforeEach(async () => {
    await db.execute(
      sql`truncate table asignacion, nodo, persona restart identity cascade`,
    );
  });

  afterAll(async () => {
    await client.end();
    await container.stop();
  });

  // drizzle-orm envuelve el error del driver en DrizzleQueryError; el
  // nombre de la constraint violada queda en `.cause`, no en el mensaje
  // de arriba ("Failed query: ...").
  async function nombreDeConstraintViolada(
    promesa: Promise<unknown>,
  ): Promise<string | undefined> {
    try {
      await promesa;
      return undefined;
    } catch (error) {
      const causa = (error as { cause?: unknown }).cause;
      return (causa as { constraint_name?: string } | undefined)
        ?.constraint_name;
    }
  }

  it("exactamente dos raíces: una tercera con la misma raiz es rechazada", async () => {
    await db.insert(nodo).values({ nombre: "Interno", raiz: "interno" });
    await db.insert(nodo).values({ nombre: "Externo", raiz: "externo" });

    const constraint = await nombreDeConstraintViolada(
      db.insert(nodo).values({ nombre: "Interno 2", raiz: "interno" }),
    );
    expect(constraint).toBe("nodo_raiz_unica");
  });

  it("dos nodos no-raíz sin raiz conviven sin problema (la invariante es solo sobre padre_id null)", async () => {
    const [raizInterno] = await db
      .insert(nodo)
      .values({ nombre: "Interno", raiz: "interno" })
      .returning();

    await db
      .insert(nodo)
      .values({ nombre: "Hijo A", padreId: raizInterno!.id });
    await db
      .insert(nodo)
      .values({ nombre: "Hijo B", padreId: raizInterno!.id });

    const hijos = await db.select().from(nodo);
    expect(hijos.length).toBeGreaterThanOrEqual(3);
  });

  it("un titular vigente por nodo: un segundo titular vigente en el mismo nodo es rechazado", async () => {
    const [raiz] = await db
      .insert(nodo)
      .values({ nombre: "Interno", raiz: "interno" })
      .returning();
    const [nodoHijo] = await db
      .insert(nodo)
      .values({ nombre: "Un nodo", padreId: raiz!.id })
      .returning();
    const [personaA] = await db
      .insert(persona)
      .values({
        nombre: "A",
        apellido: "A",
        email: "titular-a@mirage.test",
        tipo: "empleado",
      })
      .returning();
    const [personaB] = await db
      .insert(persona)
      .values({
        nombre: "B",
        apellido: "B",
        email: "titular-b@mirage.test",
        tipo: "empleado",
      })
      .returning();

    await db.insert(asignacion).values({
      personaId: personaA!.id,
      nodoId: nodoHijo!.id,
      esTitular: true,
    });

    const constraint = await nombreDeConstraintViolada(
      db.insert(asignacion).values({
        personaId: personaB!.id,
        nodoId: nodoHijo!.id,
        esTitular: true,
      }),
    );
    expect(constraint).toBe("asignacion_titular_vigente_unico");
  });

  it("un titular anterior (hasta no nulo) no bloquea a un titular nuevo", async () => {
    const [raiz] = await db
      .insert(nodo)
      .values({ nombre: "Interno", raiz: "interno" })
      .returning();
    const [nodoHijo] = await db
      .insert(nodo)
      .values({ nombre: "Otro nodo", padreId: raiz!.id })
      .returning();
    const [personaA] = await db
      .insert(persona)
      .values({
        nombre: "C",
        apellido: "C",
        email: "titular-c@mirage.test",
        tipo: "empleado",
      })
      .returning();
    const [personaB] = await db
      .insert(persona)
      .values({
        nombre: "D",
        apellido: "D",
        email: "titular-d@mirage.test",
        tipo: "empleado",
      })
      .returning();

    await db.insert(asignacion).values({
      personaId: personaA!.id,
      nodoId: nodoHijo!.id,
      esTitular: true,
      hasta: new Date(),
    });

    // No debe rechazar: el titular anterior ya no está vigente.
    await expect(
      db.insert(asignacion).values({
        personaId: personaB!.id,
        nodoId: nodoHijo!.id,
        esTitular: true,
      }),
    ).resolves.toBeDefined();
  });

  it("dos asignaciones no-titular vigentes en el mismo nodo conviven sin problema", async () => {
    const [raiz] = await db
      .insert(nodo)
      .values({ nombre: "Interno", raiz: "interno" })
      .returning();
    const [nodoHijo] = await db
      .insert(nodo)
      .values({ nombre: "Nodo con equipo", padreId: raiz!.id })
      .returning();
    const [personaA] = await db
      .insert(persona)
      .values({
        nombre: "E",
        apellido: "E",
        email: "miembro-e@mirage.test",
        tipo: "empleado",
      })
      .returning();
    const [personaB] = await db
      .insert(persona)
      .values({
        nombre: "F",
        apellido: "F",
        email: "miembro-f@mirage.test",
        tipo: "empleado",
      })
      .returning();

    await expect(
      db.insert(asignacion).values([
        { personaId: personaA!.id, nodoId: nodoHijo!.id, esTitular: false },
        { personaId: personaB!.id, nodoId: nodoHijo!.id, esTitular: false },
      ]),
    ).resolves.toBeDefined();
  });
});
