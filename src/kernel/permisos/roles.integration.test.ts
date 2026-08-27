import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Conflicto } from "@/kernel/errores";
import { capacidad, personaRol } from "./schema";

describe("kernel/permisos — roles", () => {
  let container: StartedPostgreSqlContainer;
  let roles: typeof import("./roles");
  let db: (typeof import("@/db/client"))["db"];
  let client: (typeof import("@/db/client"))["client"];

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:17-alpine").start();
    process.env.DATABASE_URL = container.getConnectionUri();

    ({ db, client } = await import("@/db/client"));
    await migrate(db, { migrationsFolder: "./src/db/migrations" });

    roles = await import("./roles");

    // identidad.administrar ya viene sembrada por la migración 0020.
    await db
      .insert(capacidad)
      .values([
        { clave: "clientes.ver", modulo: "clientes", descripcion: "d" },
        { clave: "clientes.editar", modulo: "clientes", descripcion: "d" },
        { clave: "identidad.administrar", modulo: "kernel", descripcion: "d" },
      ])
      .onConflictDoNothing();
  });

  afterAll(async () => {
    await client.end();
    await container.stop();
  });

  it("crea un rol y rechaza el nombre duplicado con Conflicto", async () => {
    const creado = await roles.crearRol("Ventas", "Equipo comercial");
    expect(creado.nombre).toBe("Ventas");
    await expect(roles.crearRol("Ventas")).rejects.toThrow(Conflicto);
  });

  it("fijarCapacidadesDeRol reemplaza el conjunto entero e ignora claves inválidas", async () => {
    const rol = await roles.crearRol("Soporte");

    await roles.fijarCapacidadesDeRol(rol.id, [
      "clientes.ver",
      "clientes.editar",
      "no.existe",
    ]);
    expect((await roles.capacidadesDeRol(rol.id)).sort()).toEqual([
      "clientes.editar",
      "clientes.ver",
    ]);

    // La segunda llamada es la lista final, no un delta.
    await roles.fijarCapacidadesDeRol(rol.id, ["clientes.ver"]);
    expect(await roles.capacidadesDeRol(rol.id)).toEqual(["clientes.ver"]);

    await roles.fijarCapacidadesDeRol(rol.id, []);
    expect(await roles.capacidadesDeRol(rol.id)).toEqual([]);
  });

  it("asigna y quita un rol de una persona", async () => {
    const rol = await roles.crearRol("Lectura");
    const PERSONA = 42;

    await roles.asignarRolAPersona(PERSONA, rol.id);
    await roles.asignarRolAPersona(PERSONA, rol.id); // idempotente
    expect((await roles.rolesDePersona(PERSONA)).map((r) => r.id)).toEqual([
      rol.id,
    ]);

    await roles.quitarRolDePersona(PERSONA, rol.id);
    expect(await roles.rolesDePersona(PERSONA)).toEqual([]);

    const filas = await db
      .select()
      .from(personaRol)
      .where(eq(personaRol.personaId, PERSONA));
    expect(filas).toEqual([]);
  });
});
