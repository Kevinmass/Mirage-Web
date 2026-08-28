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

  it("el estado de acceso va sin_acceso → invitada → confirmada", async () => {
    const creada = await personas.crearPersona({
      nombre: "Hernán",
      apellido: "Ruiz",
      email: "hernan@mirage.test",
      tipo: "empleado",
    });

    let estado = (await personas.obtenerPersonaConAcceso(creada.id))
      .estadoAcceso;
    expect(estado).toBe("sin_acceso");

    await personas.invitarPersona(creada.id);
    estado = (await personas.obtenerPersonaConAcceso(creada.id)).estadoAcceso;
    expect(estado).toBe("invitada");

    // Una persona invitada todavía no puede entrar.
    const { auth } = await import("./auth");
    await expect(
      auth.api.signInEmail({
        body: { email: "hernan@mirage.test", password: "cualquier-cosa-mal" },
      }),
    ).rejects.toThrow();

    // Completar el reset del mail de invitación pone la contraseña y deja
    // el mail verificado.
    const [fila] = await db.execute<{ datos: { url: string } }>(
      sql`select datos from notificaciones_notificacion
          where destinatario_persona_id = ${creada.id}
            and plantilla = 'auth.recuperar-password'
          order by id desc limit 1`,
    );
    const token = new URL(fila!.datos.url).pathname.split("/").pop();
    await auth.api.resetPassword({
      body: { newPassword: "contraseña-elegida-por-hernan", token: token! },
    });

    estado = (await personas.obtenerPersonaConAcceso(creada.id)).estadoAcceso;
    expect(estado).toBe("confirmada");

    const resultado = await auth.api.signInEmail({
      body: {
        email: "hernan@mirage.test",
        password: "contraseña-elegida-por-hernan",
      },
    });
    expect(resultado.user.email).toBe("hernan@mirage.test");
  });

  it("reenviarInvitacion encola otro mail de acceso", async () => {
    const creada = await personas.crearPersona({
      nombre: "Irina",
      apellido: "Sosa",
      email: "irina@mirage.test",
      tipo: "empleado",
    });
    await personas.invitarPersona(creada.id);
    await personas.reenviarInvitacion(creada.id);

    const [{ total }] = await db.execute<{ total: number }>(
      sql`select count(*)::int as total from notificaciones_notificacion
          where destinatario_persona_id = ${creada.id}
            and plantilla = 'auth.recuperar-password'`,
    );
    expect(Number(total)).toBe(2);
  });

  it("reenviarInvitacion rechaza si la persona nunca fue invitada", async () => {
    const creada = await personas.crearPersona({
      nombre: "Julia",
      apellido: "Vera",
      email: "julia@mirage.test",
      tipo: "empleado",
    });
    await expect(personas.reenviarInvitacion(creada.id)).rejects.toThrow(
      Conflicto,
    );
  });
});
