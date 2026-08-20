import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Conflicto, NoEncontrado, Validacion } from "@/kernel/errores";

describe("kernel/identidad — personas", () => {
  let container: StartedPostgreSqlContainer;
  let personas: typeof import("./personas");
  let db: (typeof import("@/db/client"))["db"];
  let client: (typeof import("@/db/client"))["client"];

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:17-alpine").start();
    process.env.DATABASE_URL = container.getConnectionUri();
    process.env.BETTER_AUTH_SECRET = "x".repeat(32);
    process.env.BETTER_AUTH_URL = "http://localhost:3000";

    ({ db, client } = await import("@/db/client"));
    await migrate(db, { migrationsFolder: "./src/db/migrations" });

    personas = await import("./personas");
  });

  afterAll(async () => {
    await client.end();
    await container.stop();
  });

  it("crea una persona sin usuario", async () => {
    const creada = await personas.crearPersona({
      nombre: "Ana",
      apellido: "Pérez",
      email: "ana@mirage.test",
      tipo: "empleado",
    });

    expect(creada.usuarioId).toBeNull();
    expect(creada.activo).toBe(true);
  });

  it("rechaza un teléfono que no está en E.164", async () => {
    await expect(
      personas.crearPersona({
        nombre: "Beto",
        apellido: "Gómez",
        email: "beto@mirage.test",
        telefono: "011 4444-5555",
        tipo: "empleado",
      }),
    ).rejects.toThrow(Validacion);
  });

  it("acepta un teléfono en E.164", async () => {
    const creada = await personas.crearPersona({
      nombre: "Cami",
      apellido: "López",
      email: "cami@mirage.test",
      telefono: "+5491122334455",
      tipo: "empleado",
    });
    expect(creada.telefono).toBe("+5491122334455");
  });

  it("rechaza un email duplicado con Conflicto, no con el error crudo de Postgres", async () => {
    await personas.crearPersona({
      nombre: "Dani",
      apellido: "Ruiz",
      email: "dani@mirage.test",
      tipo: "empleado",
    });

    await expect(
      personas.crearPersona({
        nombre: "Dani",
        apellido: "Otra",
        email: "dani@mirage.test",
        tipo: "empleado",
      }),
    ).rejects.toThrow(Conflicto);
  });

  it("obtenerPersona tira NoEncontrado para un id inexistente", async () => {
    await expect(personas.obtenerPersona(999_999)).rejects.toThrow(
      NoEncontrado,
    );
  });

  it("archivarPersona hace baja lógica, no borra la fila", async () => {
    const creada = await personas.crearPersona({
      nombre: "Eli",
      apellido: "Suárez",
      email: "eli@mirage.test",
      tipo: "empleado",
    });

    await personas.archivarPersona(creada.id);

    const releida = await personas.obtenerPersona(creada.id);
    expect(releida.activo).toBe(false);
  });

  it("invitarPersona crea el usuario, lo vincula y encola el mail de acceso", async () => {
    const creada = await personas.crearPersona({
      nombre: "Fede",
      apellido: "Molina",
      email: "fede@mirage.test",
      tipo: "empleado",
    });

    await personas.invitarPersona(creada.id);

    const releida = await personas.obtenerPersona(creada.id);
    expect(releida.usuarioId).not.toBeNull();
    // sendResetPassword (auth.ts, PR 7.2) encola vía notificaciones —
    // ya está vinculada en este punto (invitarPersona vincula antes de
    // pedir el reset), así que tiene a quién encolarle.
    const [notificacion] = await db.execute<{
      destinatario_persona_id: number;
      plantilla: string;
    }>(
      sql`select destinatario_persona_id, plantilla from notificaciones_notificacion where destinatario_persona_id = ${creada.id}`,
    );
    expect(notificacion).toMatchObject({
      destinatario_persona_id: creada.id,
      plantilla: "auth.recuperar-password",
    });
  });

  it("invitarPersona rechaza si la persona ya tiene acceso", async () => {
    const creada = await personas.crearPersona({
      nombre: "Gaby",
      apellido: "Torres",
      email: "gaby@mirage.test",
      tipo: "empleado",
    });
    await personas.invitarPersona(creada.id);

    await expect(personas.invitarPersona(creada.id)).rejects.toThrow(Conflicto);
  });
});
