import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq, isNull } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Contra Postgres real en un contenedor efímero (diseño §10). arranque.ts
// importa auth.ts de forma transitoria (lee BETTER_AUTH_SECRET /
// DATABASE_URL al importarse), por eso el import es dinámico y recién pasa
// después de setear las env vars — mismo patrón que auth.integration.test.ts.
describe("kernel/identidad — arranque", () => {
  let container: StartedPostgreSqlContainer;
  let arranque: typeof import("./arranque");
  let db: (typeof import("@/db/client"))["db"];
  let client: (typeof import("@/db/client"))["client"];
  let schema: typeof import("./schema");
  let permisosSchema: typeof import("@/kernel/permisos/schema");
  let organigramaSchema: typeof import("@/kernel/organigrama/schema");

  const DATOS = {
    email: "fundador@mirage.test",
    password: "una-password-de-arranque",
    nombre: "Fun",
    apellido: "Dador",
  };

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:17-alpine").start();
    process.env.DATABASE_URL = container.getConnectionUri();
    process.env.BETTER_AUTH_SECRET = "x".repeat(32);
    process.env.BETTER_AUTH_URL = "http://localhost:3000";

    ({ db, client } = await import("@/db/client"));
    await migrate(db, { migrationsFolder: "./src/db/migrations" });

    arranque = await import("./arranque");
    schema = await import("./schema");
    permisosSchema = await import("@/kernel/permisos/schema");
    organigramaSchema = await import("@/kernel/organigrama/schema");
  });

  afterAll(async () => {
    await client.end();
    await container.stop();
  });

  it("existeAlgunaPersona: false en una base recién migrada", async () => {
    expect(await arranque.existeAlgunaPersona()).toBe(false);
  });

  it("crea el primer empleado completo: persona, usuario verificado, rol, raíces", async () => {
    const resultado = await arranque.crearPrimerEmpleado(DATOS);
    expect(resultado.yaExistia).toBe(false);

    const [p] = await db
      .select()
      .from(schema.persona)
      .where(eq(schema.persona.email, DATOS.email));
    expect(p?.tipo).toBe("empleado");
    expect(p?.usuarioId).not.toBeNull();

    const [u] = await db
      .select()
      .from(schema.usuario)
      .where(eq(schema.usuario.id, p!.usuarioId!));
    expect(u?.emailVerified).toBe(true);

    const roles = await db.select().from(permisosSchema.rol);
    expect(roles.map((r) => r.nombre)).toContain("Dirección");

    const asignaciones = await db
      .select()
      .from(permisosSchema.personaRol)
      .where(eq(permisosSchema.personaRol.personaId, p!.id));
    expect(asignaciones.length).toBe(1);

    const raices = await db
      .select()
      .from(organigramaSchema.nodo)
      .where(isNull(organigramaSchema.nodo.padreId));
    expect(raices.map((n) => n.raiz).sort()).toEqual(["externo", "interno"]);

    // El fundador es titular vigente de las DOS raíces (PR 5): sin eso la
    // rama externa nace muerta.
    const titularidades = await db
      .select()
      .from(organigramaSchema.asignacion)
      .where(eq(organigramaSchema.asignacion.personaId, p!.id));
    const nodosDondeEsTitular = titularidades
      .filter((a) => a.esTitular && a.hasta === null)
      .map((a) => a.nodoId)
      .sort();
    expect(nodosDondeEsTitular).toEqual(raices.map((n) => n.id).sort());

    expect(await arranque.existeAlgunaPersona()).toBe(true);
  });

  it("es idempotente: correrla de nuevo no duplica nada", async () => {
    const resultado = await arranque.crearPrimerEmpleado(DATOS);
    expect(resultado.yaExistia).toBe(true);

    const personas = await db
      .select()
      .from(schema.persona)
      .where(eq(schema.persona.email, DATOS.email));
    expect(personas.length).toBe(1);

    const usuarios = await db.select().from(schema.usuario);
    expect(usuarios.length).toBe(1);

    const rolesDireccion = (await db.select().from(permisosSchema.rol)).filter(
      (r) => r.nombre === "Dirección",
    );
    expect(rolesDireccion.length).toBe(1);

    const raices = await db
      .select()
      .from(organigramaSchema.nodo)
      .where(isNull(organigramaSchema.nodo.padreId));
    expect(raices.length).toBe(2);
  });

  it("rechaza una contraseña de menos de 8 caracteres", async () => {
    const { Validacion } = await import("@/kernel/errores");
    await expect(
      arranque.crearPrimerEmpleado({
        ...DATOS,
        email: "corta@mirage.test",
        password: "corta",
      }),
    ).rejects.toThrow(Validacion);
  });
});
