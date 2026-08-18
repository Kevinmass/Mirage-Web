import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { NoAutorizado } from "@/kernel/errores";
import { capacidad, personaRol, rol, rolCapacidad } from "./schema";

describe("kernel/permisos — evaluación", () => {
  let container: StartedPostgreSqlContainer;
  let tienePermiso: (typeof import("./evaluar"))["tienePermiso"];
  let requiere: (typeof import("./evaluar"))["requiere"];
  let db: (typeof import("@/db/client"))["db"];
  let client: (typeof import("@/db/client"))["client"];

  const PERSONA_CON_PERMISO = 1;
  const PERSONA_SIN_ROL = 2;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:17-alpine").start();
    process.env.DATABASE_URL = container.getConnectionUri();

    ({ db, client } = await import("@/db/client"));
    ({ tienePermiso, requiere } = await import("./evaluar"));

    await migrate(db, { migrationsFolder: "./src/db/migrations" });

    await db
      .insert(capacidad)
      .values({ clave: "clientes.ver", modulo: "clientes", descripcion: "d" });
    const [rolCreado] = await db
      .insert(rol)
      .values({ nombre: "vendedor" })
      .returning();
    await db
      .insert(rolCapacidad)
      .values({ rolId: rolCreado!.id, capacidadClave: "clientes.ver" });
    await db
      .insert(personaRol)
      .values({ personaId: PERSONA_CON_PERMISO, rolId: rolCreado!.id });
  });

  afterAll(async () => {
    await client.end();
    await container.stop();
  });

  it("tienePermiso es true para quien tiene un rol con esa capacidad", async () => {
    expect(await tienePermiso(PERSONA_CON_PERMISO, "clientes.ver")).toBe(true);
  });

  it("tienePermiso es false para quien no tiene ningún rol", async () => {
    expect(await tienePermiso(PERSONA_SIN_ROL, "clientes.ver")).toBe(false);
  });

  it("tienePermiso es false para una capacidad que la persona no tiene", async () => {
    expect(await tienePermiso(PERSONA_CON_PERMISO, "clientes.editar")).toBe(
      false,
    );
  });

  it("requiere no tira si la persona tiene la capacidad", async () => {
    await expect(
      requiere(PERSONA_CON_PERMISO, "clientes.ver"),
    ).resolves.toBeUndefined();
  });

  it("requiere tira NoAutorizado si la persona no tiene la capacidad", async () => {
    await expect(requiere(PERSONA_SIN_ROL, "clientes.ver")).rejects.toThrow(
      NoAutorizado,
    );
  });
});
