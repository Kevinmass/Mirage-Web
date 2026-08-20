import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { persona } from "@/kernel/identidad/schema";
import { nodo } from "@/kernel/organigrama/schema";

// La pieza central del aislamiento del portal (diseño §8, PR 7.1):
// obtenerClienteDeContacto y el índice único que la respalda. Esto no
// se puede probar simulando una sesión de better-auth acá (no hay
// cookies reales en un test de integración de api), así que se prueba
// un nivel más abajo: dada una persona contacto_cliente, ¿resuelve
// siempre a un único cliente, nunca a otro?
describe("modules/clientes api — aislamiento del portal", () => {
  let container: StartedPostgreSqlContainer;
  let clientesApi: typeof import("@/modules/clientes/api");
  let db: (typeof import("@/db/client"))["db"];
  let client: (typeof import("@/db/client"))["client"];
  // Una sola raíz "interno" por test (invariante del organigrama) —
  // se crea la primera vez que hace falta y se reusa después.
  let raizId: number | undefined;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:17-alpine").start();
    process.env.DATABASE_URL = container.getConnectionUri();

    ({ db, client } = await import("@/db/client"));
    clientesApi = await import("@/modules/clientes/api");

    await migrate(db, { migrationsFolder: "./src/db/migrations" });
  });

  beforeEach(async () => {
    raizId = undefined;
    await db.execute(sql`
      truncate table
        clientes_contacto, clientes_cliente,
        nodo, persona
      restart identity cascade
    `);
  });

  afterAll(async () => {
    await client.end();
    await container.stop();
  });

  async function obtenerORaizDeprueba(): Promise<number> {
    if (raizId === undefined) {
      const [raiz] = await db
        .insert(nodo)
        .values({ nombre: "Interno", raiz: "interno" })
        .returning();
      raizId = raiz!.id;
    }
    return raizId;
  }

  async function armarClienteConContacto(nombreCliente: string, cuit: string) {
    const raiz = { id: await obtenerORaizDeprueba() };
    const [responsable] = await db
      .insert(persona)
      .values({
        nombre: "Responsable",
        apellido: nombreCliente,
        email: `responsable-${cuit}@mirage.test`,
        tipo: "empleado",
      })
      .returning();
    const cliente = await clientesApi.crearCliente({
      nombre: nombreCliente,
      cuit,
      nodoResponsableId: raiz!.id,
      contactoDirectoId: responsable!.id,
    });
    const contacto = await clientesApi.crearContacto(cliente.id, {
      email: `contacto-${cuit}@${nombreCliente.toLowerCase()}.test`,
      nombre: "Contacto",
      apellido: nombreCliente,
    });
    return { cliente, contactoPersonaId: contacto.personaId };
  }

  it("obtenerClienteDeContacto devuelve null para una persona que no es contacto de nadie", async () => {
    const [p] = await db
      .insert(persona)
      .values({
        nombre: "Nadie",
        apellido: "Contacto",
        email: "nadie@mirage.test",
        tipo: "empleado",
      })
      .returning();

    expect(await clientesApi.obtenerClienteDeContacto(p!.id)).toBeNull();
  });

  it("cada contacto resuelve al cliente correcto, nunca al del otro", async () => {
    const a = await armarClienteConContacto("ClienteA", "30-11111111-1");
    const b = await armarClienteConContacto("ClienteB", "30-22222222-2");

    expect(
      await clientesApi.obtenerClienteDeContacto(a.contactoPersonaId),
    ).toBe(a.cliente.id);
    expect(
      await clientesApi.obtenerClienteDeContacto(b.contactoPersonaId),
    ).toBe(b.cliente.id);
    // Ninguno de los dos resuelve al cliente del otro — el corazón de
    // la garantía de aislamiento.
    expect(
      await clientesApi.obtenerClienteDeContacto(a.contactoPersonaId),
    ).not.toBe(b.cliente.id);
  });

  it("el índice único impide que un contacto quede ligado a dos clientes", async () => {
    const a = await armarClienteConContacto("ClienteC", "30-33333333-3");
    const clienteB = await clientesApi.crearCliente({
      nombre: "ClienteD",
      cuit: "30-44444444-4",
      nodoResponsableId: await obtenerORaizDeprueba(),
      contactoDirectoId: a.cliente.contactoDirectoId,
    });

    // Intentar agregar el contacto de A también como contacto de B:
    // rechazado por el índice único de personaId, envuelto en
    // Conflicto por crearContacto (crearContacto ya lo prueba con el
    // mismo cliente; esto prueba que la misma protección cubre
    // clientes distintos).
    const [personaDeA] = await db
      .select()
      .from(persona)
      .where(eq(persona.id, a.contactoPersonaId));
    await expect(
      clientesApi.crearContacto(clienteB.id, {
        email: personaDeA!.email,
        nombre: personaDeA!.nombre,
        apellido: personaDeA!.apellido,
      }),
    ).rejects.toThrow(/ya es contacto/);
  });
});
