import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { eventoAuditoria } from "@/kernel/auditoria/schema";
import { cuenta, persona, usuario } from "./schema";

// Contra Postgres real en un contenedor efímero (diseño §10). auth.ts lee
// BETTER_AUTH_SECRET y DATABASE_URL al importarse — por eso el import es
// dinámico y recién pasa después de setearlos, mismo patrón que
// modules/contenido/api.integration.test.ts con @/db/client.
describe("kernel/identidad — better-auth", () => {
  let container: StartedPostgreSqlContainer;
  let auth: (typeof import("./auth"))["auth"];
  let db: (typeof import("@/db/client"))["db"];
  let client: (typeof import("@/db/client"))["client"];

  const EMAIL = "prueba@mirage.test";
  const CONTRASENA = "contraseña-segura-123";

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:17-alpine").start();
    process.env.DATABASE_URL = container.getConnectionUri();
    process.env.BETTER_AUTH_SECRET = "x".repeat(32);
    // Sin esto, better-auth no puede derivar el origin (acá no hay una
    // request HTTP entrante de la que sacarlo, se llama a auth.api.*
    // directo) y las URLs que arma (como la de reset-password) salen
    // relativas en vez de absolutas — rompe el parseo más abajo. En
    // producción esto lo pone render.yaml.
    process.env.BETTER_AUTH_URL = "http://localhost:3000";

    ({ db, client } = await import("@/db/client"));
    await migrate(db, { migrationsFolder: "./src/db/migrations" });

    ({ auth } = await import("./auth"));
  });

  afterAll(async () => {
    await client.end();
    await container.stop();
  });

  it("el alta crea el usuario y guarda la contraseña hasheada, no en texto plano", async () => {
    await auth.api.signUpEmail({
      body: { email: EMAIL, password: CONTRASENA, name: "Prueba" },
    });

    const [fila] = await db
      .select({ password: cuenta.password })
      .from(cuenta)
      .innerJoin(usuario, eq(usuario.id, cuenta.userId))
      .where(eq(usuario.email, EMAIL));

    expect(fila?.password).toBeDefined();
    expect(fila?.password).not.toBe(CONTRASENA);
  });

  it("el login funciona con la contraseña correcta", async () => {
    const resultado = await auth.api.signInEmail({
      body: { email: EMAIL, password: CONTRASENA },
    });

    expect(resultado.user.email).toBe(EMAIL);
  });

  it("el login falla con la contraseña incorrecta", async () => {
    await expect(
      auth.api.signInEmail({
        body: { email: EMAIL, password: "lo-que-sea-mal" },
      }),
    ).rejects.toThrow();
  });

  it("el login queda registrado en auditoría", async () => {
    const antes = await db.select().from(eventoAuditoria);

    await auth.api.signInEmail({
      body: { email: EMAIL, password: CONTRASENA },
    });

    const despues = await db.select().from(eventoAuditoria);
    expect(despues.length).toBeGreaterThan(antes.length);
    const ultimo = despues[despues.length - 1];
    expect(ultimo).toMatchObject({ accion: "login", entidad: "sesion" });
  });

  it("el login de una persona vinculada registra su personaId en auditoría", async () => {
    const { user } = await auth.api.signUpEmail({
      body: {
        email: "vinculada@mirage.test",
        password: CONTRASENA,
        name: "Vinculada",
      },
    });

    const [personaCreada] = await db
      .insert(persona)
      .values({
        nombre: "Vinculada",
        apellido: "Prueba",
        email: "vinculada@mirage.test",
        tipo: "empleado",
        usuarioId: user.id,
      })
      .returning();

    await auth.api.signInEmail({
      body: { email: "vinculada@mirage.test", password: CONTRASENA },
    });

    const [ultimoEvento] = await db
      .select()
      .from(eventoAuditoria)
      .where(eq(eventoAuditoria.personaId, personaCreada!.id));

    expect(ultimoEvento).toMatchObject({
      accion: "login",
      personaId: personaCreada!.id,
    });
  });

  it("recuperación: pedir el reset, usar el token y loguear con la contraseña nueva", async () => {
    const enviarReset = vi.fn();
    // sendResetPassword se configura una sola vez en auth.ts; para probar
    // que el flujo entero funciona, se dispara vía requestPasswordReset y
    // se confirma con resetPassword usando el token capturado en el mock
    // de console.log (auth.ts loguea la URL con el token porque no hay
    // RESEND_API_KEY todavía — ver comentario en auth.ts).
    const logSpy = vi
      .spyOn(console, "log")
      .mockImplementation((...args) => enviarReset(...args));

    await auth.api.requestPasswordReset({
      body: { email: EMAIL, redirectTo: "http://localhost:3000/reset" },
    });

    const mensaje = enviarReset.mock.calls
      .map((args) => String(args[0]))
      .find((linea) => linea.includes("recuperar contraseña"));
    expect(mensaje).toBeDefined();
    const token = new URL(mensaje!.split(": ").slice(1).join(": ")).pathname
      .split("/")
      .pop();

    await auth.api.resetPassword({
      body: { newPassword: "otra-contraseña-nueva-456", token: token! },
    });

    const resultado = await auth.api.signInEmail({
      body: { email: EMAIL, password: "otra-contraseña-nueva-456" },
    });
    expect(resultado.user.email).toBe(EMAIL);

    logSpy.mockRestore();
  });
});
