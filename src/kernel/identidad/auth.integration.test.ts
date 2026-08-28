import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
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

  // requireEmailVerification está activo (PR 4): sin esto, signInEmail tira
  // EMAIL_NOT_VERIFIED. Estos tests no son sobre la verificación en sí, así
  // que marcan el mail como verificado a mano — el flujo real de
  // verificación tiene sus propios tests más abajo.
  async function marcarVerificado(email: string) {
    await db
      .update(usuario)
      .set({ emailVerified: true })
      .where(eq(usuario.email, email));
  }

  it("el alta crea el usuario y guarda la contraseña hasheada, no en texto plano", async () => {
    await auth.api.signUpEmail({
      body: { email: EMAIL, password: CONTRASENA, name: "Prueba" },
    });
    await marcarVerificado(EMAIL);

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
    await marcarVerificado("vinculada@mirage.test");

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

  it("recuperación: pedir el reset encola el mail, y con el token se loguea con la contraseña nueva", async () => {
    // sendResetPassword (auth.ts, PR 7.2) encola vía notificaciones en
    // vez de mandar el mail acá mismo — hace falta una persona
    // vinculada para tener a quién encolarle (EMAIL, de arriba, no
    // tiene una).
    const EMAIL_RECUPERACION = "recupera@mirage.test";
    const { user } = await auth.api.signUpEmail({
      body: {
        email: EMAIL_RECUPERACION,
        password: CONTRASENA,
        name: "Recupera",
      },
    });
    await db.insert(persona).values({
      nombre: "Recupera",
      apellido: "Prueba",
      email: EMAIL_RECUPERACION,
      tipo: "empleado",
      usuarioId: user.id,
    });

    await auth.api.requestPasswordReset({
      body: {
        email: EMAIL_RECUPERACION,
        redirectTo: "http://localhost:3000/reset",
      },
    });

    const [notificacion] = await db.execute<{ datos: { url: string } }>(
      sql`select datos from notificaciones_notificacion where plantilla = 'auth.recuperar-password' order by id desc limit 1`,
    );
    expect(notificacion).toBeDefined();
    const token = new URL(notificacion!.datos.url).pathname.split("/").pop();

    await auth.api.resetPassword({
      body: { newPassword: "otra-contraseña-nueva-456", token: token! },
    });

    // Completar el reset deja el mail verificado (auth.ts, onPasswordReset):
    // el link llegó al inbox, clickearlo prueba lo mismo que "verificar".
    const [trasReset] = await db
      .select({ emailVerified: usuario.emailVerified })
      .from(usuario)
      .where(eq(usuario.id, user.id));
    expect(trasReset?.emailVerified).toBe(true);

    const resultado = await auth.api.signInEmail({
      body: {
        email: EMAIL_RECUPERACION,
        password: "otra-contraseña-nueva-456",
      },
    });
    expect(resultado.user.email).toBe(EMAIL_RECUPERACION);
  });

  it("una persona sin el mail verificado no puede entrar", async () => {
    const EMAIL_SIN_VERIFICAR = "sin-verificar@mirage.test";
    await auth.api.signUpEmail({
      body: {
        email: EMAIL_SIN_VERIFICAR,
        password: CONTRASENA,
        name: "Sin Verificar",
      },
    });

    await expect(
      auth.api.signInEmail({
        body: { email: EMAIL_SIN_VERIFICAR, password: CONTRASENA },
      }),
    ).rejects.toThrow();

    await marcarVerificado(EMAIL_SIN_VERIFICAR);
    const resultado = await auth.api.signInEmail({
      body: { email: EMAIL_SIN_VERIFICAR, password: CONTRASENA },
    });
    expect(resultado.user.email).toBe(EMAIL_SIN_VERIFICAR);
  });
});
