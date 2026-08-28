import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { persona, usuario } from "./schema";

describe("kernel/identidad — obtenerSesion", () => {
  let container: StartedPostgreSqlContainer;
  let auth: (typeof import("./auth"))["auth"];
  let obtenerSesion: (typeof import("./sesion"))["obtenerSesion"];
  let db: (typeof import("@/db/client"))["db"];
  let client: (typeof import("@/db/client"))["client"];

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:17-alpine").start();
    process.env.DATABASE_URL = container.getConnectionUri();
    process.env.BETTER_AUTH_SECRET = "x".repeat(32);
    process.env.BETTER_AUTH_URL = "http://localhost:3000";

    ({ db, client } = await import("@/db/client"));
    await migrate(db, { migrationsFolder: "./src/db/migrations" });

    ({ auth } = await import("./auth"));
    ({ obtenerSesion } = await import("./sesion"));
  });

  afterAll(async () => {
    await client.end();
    await container.stop();
  });

  // requireEmailVerification está activo (PR 4): sin esto signInEmail tira
  // EMAIL_NOT_VERIFIED. Estos tests son sobre obtenerSesion, no sobre la
  // verificación, así que marcan el mail a mano.
  async function iniciarSesion(email: string, password: string) {
    await db
      .update(usuario)
      .set({ emailVerified: true })
      .where(eq(usuario.email, email));
    const { headers } = await auth.api.signInEmail({
      body: { email, password },
      returnHeaders: true,
    });
    const cookie = headers.get("set-cookie");
    if (!cookie) throw new Error("sign-in no devolvió set-cookie");
    return new Request("http://localhost/", {
      headers: { cookie: cookie.split(";")[0]! },
    });
  }

  it("sin cookie de sesión devuelve null", async () => {
    const sesion = await obtenerSesion(new Request("http://localhost/"));
    expect(sesion).toBeNull();
  });

  it("con sesión pero sin persona vinculada devuelve null", async () => {
    await auth.api.signUpEmail({
      body: {
        email: "sinpersona@mirage.test",
        password: "contraseña-123",
        name: "Sin persona",
      },
    });
    const request = await iniciarSesion(
      "sinpersona@mirage.test",
      "contraseña-123",
    );

    expect(await obtenerSesion(request)).toBeNull();
  });

  it("con sesión y persona empleado devuelve tipo empleado", async () => {
    const { user } = await auth.api.signUpEmail({
      body: {
        email: "empleada@mirage.test",
        password: "contraseña-123",
        name: "Empleada",
      },
    });
    const [personaCreada] = await db
      .insert(persona)
      .values({
        nombre: "Empleada",
        apellido: "Prueba",
        email: "empleada@mirage.test",
        tipo: "empleado",
        usuarioId: user.id,
      })
      .returning();

    const request = await iniciarSesion(
      "empleada@mirage.test",
      "contraseña-123",
    );
    const sesion = await obtenerSesion(request);

    expect(sesion).toEqual({ personaId: personaCreada!.id, tipo: "empleado" });
  });

  it("con sesión y persona contacto_cliente devuelve tipo contacto_cliente", async () => {
    const { user } = await auth.api.signUpEmail({
      body: {
        email: "contacto@mirage.test",
        password: "contraseña-123",
        name: "Contacto",
      },
    });
    const [personaCreada] = await db
      .insert(persona)
      .values({
        nombre: "Contacto",
        apellido: "Prueba",
        email: "contacto@mirage.test",
        tipo: "contacto_cliente",
        usuarioId: user.id,
      })
      .returning();

    const request = await iniciarSesion(
      "contacto@mirage.test",
      "contraseña-123",
    );
    const sesion = await obtenerSesion(request);

    expect(sesion).toEqual({
      personaId: personaCreada!.id,
      tipo: "contacto_cliente",
    });
  });
});
