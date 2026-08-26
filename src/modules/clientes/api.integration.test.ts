import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Conflicto, NoEncontrado } from "@/kernel/errores";
import { persona } from "@/kernel/identidad/schema";
import { asignacion, nodo } from "@/kernel/organigrama/schema";
import { eventoAuditoria } from "@/kernel/auditoria/schema";
import { clientesContacto, clientesInteraccion } from "./schema";

// Contra Postgres real en un contenedor efímero, no mocks (diseño §10).
describe("modules/clientes api", () => {
  let container: StartedPostgreSqlContainer;
  let api: typeof import("./api");
  let db: (typeof import("@/db/client"))["db"];
  let client: (typeof import("@/db/client"))["client"];

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:17-alpine").start();
    process.env.DATABASE_URL = container.getConnectionUri();

    ({ db, client } = await import("@/db/client"));
    api = await import("./api");

    await migrate(db, { migrationsFolder: "./src/db/migrations" });
  });

  beforeEach(async () => {
    await db.execute(sql`
      truncate table
        evento_auditoria, clientes_interaccion, clientes_contacto,
        clientes_cliente, asignacion, nodo, persona
      restart identity cascade
    `);
  });

  afterAll(async () => {
    await client.end();
    await container.stop();
  });

  async function armarNodoYPersona() {
    const [raiz] = await db
      .insert(nodo)
      .values({ nombre: "Interno", raiz: "interno" })
      .returning();
    const [n] = await db
      .insert(nodo)
      .values({ nombre: "Ventas", padreId: raiz!.id })
      .returning();
    const [p] = await db
      .insert(persona)
      .values({
        nombre: "Responsable",
        apellido: "Uno",
        email: "responsable@mirage.test",
        tipo: "empleado",
      })
      .returning();
    return { nodo: n!, persona: p! };
  }

  it("crearCliente exige un nodo responsable existente", async () => {
    const { persona: p } = await armarNodoYPersona();

    await expect(
      api.crearCliente({
        nombre: "Acme",
        cuit: "30-11111111-1",
        nodoResponsableId: 999_999,
        contactoDirectoId: p.id,
      }),
    ).rejects.toThrow(NoEncontrado);
  });

  it("crearCliente exige un contacto directo existente", async () => {
    const { nodo: n } = await armarNodoYPersona();

    await expect(
      api.crearCliente({
        nombre: "Acme",
        cuit: "30-11111111-1",
        nodoResponsableId: n.id,
        contactoDirectoId: 999_999,
      }),
    ).rejects.toThrow(NoEncontrado);
  });

  it("crearCliente crea el cliente activo y publica cliente.creado", async () => {
    const { nodo: n, persona: p } = await armarNodoYPersona();

    const creado = await api.crearCliente({
      nombre: "Acme",
      cuit: "30-11111111-1",
      nodoResponsableId: n.id,
      contactoDirectoId: p.id,
    });

    expect(creado.estado).toBe("activo");
    expect(await api.obtenerCliente(creado.id)).toMatchObject({
      nombre: "Acme",
    });
  });

  it("crearCliente publica cliente.creado con el titular del nodo responsable como destinatario", async () => {
    const bus = await import("@/kernel/eventos/bus");
    const { nodo: n, persona: p } = await armarNodoYPersona();
    const recibidos: unknown[] = [];
    bus.suscribir("cliente.creado", (payload) => {
      recibidos.push(payload);
    });

    // Sin titular todavía: destinatarioPersonaId debe salir null, no
    // tirar ni inventar un destinatario.
    const sinTitular = await api.crearCliente({
      nombre: "Sin Titular SA",
      cuit: "30-22222222-2",
      nodoResponsableId: n.id,
      contactoDirectoId: p.id,
    });
    expect(recibidos).toContainEqual({
      clienteId: sinTitular.id,
      nombre: "Sin Titular SA",
      destinatarioPersonaId: null,
    });

    await db
      .insert(asignacion)
      .values({ personaId: p.id, nodoId: n.id, esTitular: true });

    const conTitular = await api.crearCliente({
      nombre: "Con Titular SA",
      cuit: "30-33333333-3",
      nodoResponsableId: n.id,
      contactoDirectoId: p.id,
    });
    expect(recibidos).toContainEqual({
      clienteId: conTitular.id,
      nombre: "Con Titular SA",
      destinatarioPersonaId: p.id,
    });

    bus._reiniciarParaTests();
  });

  it("crearCliente rechaza un CUIT duplicado", async () => {
    const { nodo: n, persona: p } = await armarNodoYPersona();
    const datos = {
      nombre: "Acme",
      cuit: "30-11111111-1",
      nodoResponsableId: n.id,
      contactoDirectoId: p.id,
    };
    await api.crearCliente(datos);

    await expect(
      api.crearCliente({ ...datos, nombre: "Otro nombre" }),
    ).rejects.toThrow(/CUIT/);
  });

  it("archivarCliente pasa el estado a inactivo sin borrar la fila", async () => {
    const { nodo: n, persona: p } = await armarNodoYPersona();
    const creado = await api.crearCliente({
      nombre: "Acme",
      cuit: "30-11111111-1",
      nodoResponsableId: n.id,
      contactoDirectoId: p.id,
    });

    await api.archivarCliente(creado.id);

    expect((await api.obtenerCliente(creado.id)).estado).toBe("inactivo");
  });

  it("listarContactosDeCliente trae el nombre y el email de la persona", async () => {
    const { nodo: n, persona: p } = await armarNodoYPersona();
    const creado = await api.crearCliente({
      nombre: "Acme",
      cuit: "30-11111111-1",
      nodoResponsableId: n.id,
      contactoDirectoId: p.id,
    });
    const [contactoPersona] = await db
      .insert(persona)
      .values({
        nombre: "Contacto",
        apellido: "Dos",
        email: "contacto@acme.test",
        tipo: "contacto_cliente",
      })
      .returning();
    await db.insert(clientesContacto).values({
      clienteId: creado.id,
      personaId: contactoPersona!.id,
      cargo: "Gerente",
      esPrincipal: true,
    });

    const contactos = await api.listarContactosDeCliente(creado.id);

    expect(contactos).toMatchObject([
      { nombre: "Contacto", apellido: "Dos", cargo: "Gerente" },
    ]);
  });

  it("listarInteraccionesDeCliente ordena de la más reciente a la más vieja", async () => {
    const { nodo: n, persona: p } = await armarNodoYPersona();
    const creado = await api.crearCliente({
      nombre: "Acme",
      cuit: "30-11111111-1",
      nodoResponsableId: n.id,
      contactoDirectoId: p.id,
    });
    await db.insert(clientesInteraccion).values([
      {
        clienteId: creado.id,
        personaId: p.id,
        tipo: "llamada",
        fecha: new Date("2026-01-01T10:00:00Z"),
        resumen: "Primera",
      },
      {
        clienteId: creado.id,
        personaId: p.id,
        tipo: "mail",
        fecha: new Date("2026-02-01T10:00:00Z"),
        resumen: "Segunda",
      },
    ]);

    const interacciones = await api.listarInteraccionesDeCliente(creado.id);

    expect(interacciones.map((i) => i.resumen)).toEqual(["Segunda", "Primera"]);
  });

  it("crearContacto crea la persona contacto_cliente si no existe", async () => {
    const { nodo: n, persona: p } = await armarNodoYPersona();
    const creado = await api.crearCliente({
      nombre: "Acme",
      cuit: "30-11111111-1",
      nodoResponsableId: n.id,
      contactoDirectoId: p.id,
    });

    await api.crearContacto(creado.id, {
      email: "nuevo@acme.test",
      nombre: "Nuevo",
      apellido: "Contacto",
      cargo: "Compras",
    });

    const contactos = await api.listarContactosDeCliente(creado.id);
    expect(contactos).toMatchObject([
      { nombre: "Nuevo", apellido: "Contacto", cargo: "Compras" },
    ]);
    const [personaCreada] = await db
      .select()
      .from(persona)
      .where(eq(persona.email, "nuevo@acme.test"));
    expect(personaCreada?.tipo).toBe("contacto_cliente");
    expect(personaCreada?.usuarioId).toBeNull();
  });

  it("crearContacto reusa la persona si ya existe con ese email", async () => {
    const { nodo: n, persona: p } = await armarNodoYPersona();
    const creado = await api.crearCliente({
      nombre: "Acme",
      cuit: "30-11111111-1",
      nodoResponsableId: n.id,
      contactoDirectoId: p.id,
    });
    const [existente] = await db
      .insert(persona)
      .values({
        nombre: "Ya",
        apellido: "Existe",
        email: "yaexiste@acme.test",
        tipo: "contacto_cliente",
      })
      .returning();

    await api.crearContacto(creado.id, {
      email: "yaexiste@acme.test",
      nombre: "Ignorado",
      apellido: "Ignorado",
    });

    const totalPersonas = await db.select().from(persona);
    expect(
      totalPersonas.filter((x) => x.email === "yaexiste@acme.test"),
    ).toHaveLength(1);
    const contactos = await api.listarContactosDeCliente(creado.id);
    expect(contactos[0]?.personaId).toBe(existente!.id);
  });

  it("crearContacto rechaza si el email ya es de un empleado", async () => {
    const { nodo: n, persona: p } = await armarNodoYPersona();
    const creado = await api.crearCliente({
      nombre: "Acme",
      cuit: "30-11111111-1",
      nodoResponsableId: n.id,
      contactoDirectoId: p.id,
    });

    await expect(
      api.crearContacto(creado.id, {
        email: p.email,
        nombre: "X",
        apellido: "X",
      }),
    ).rejects.toThrow(Conflicto);
  });

  it("crearContacto rechaza agregar dos veces la misma persona al mismo cliente", async () => {
    const { nodo: n, persona: p } = await armarNodoYPersona();
    const creado = await api.crearCliente({
      nombre: "Acme",
      cuit: "30-11111111-1",
      nodoResponsableId: n.id,
      contactoDirectoId: p.id,
    });
    await api.crearContacto(creado.id, {
      email: "dup@acme.test",
      nombre: "Dup",
      apellido: "Licado",
    });

    await expect(
      api.crearContacto(creado.id, {
        email: "dup@acme.test",
        nombre: "Dup",
        apellido: "Licado",
      }),
    ).rejects.toThrow(Conflicto);
  });

  it("registrarInteraccion crea la fila con la persona y el cliente", async () => {
    const { nodo: n, persona: p } = await armarNodoYPersona();
    const creado = await api.crearCliente({
      nombre: "Acme",
      cuit: "30-11111111-1",
      nodoResponsableId: n.id,
      contactoDirectoId: p.id,
    });

    await api.registrarInteraccion(creado.id, {
      personaId: p.id,
      tipo: "llamada",
      resumen: "Charla de seguimiento",
    });

    const interacciones = await api.listarInteraccionesDeCliente(creado.id);
    expect(interacciones).toMatchObject([
      { tipo: "llamada", resumen: "Charla de seguimiento" },
    ]);
  });

  it("registrarInteraccion admite el tipo whatsapp", async () => {
    const { nodo: n, persona: p } = await armarNodoYPersona();
    const creado = await api.crearCliente({
      nombre: "Acme",
      cuit: "30-11111111-1",
      nodoResponsableId: n.id,
      contactoDirectoId: p.id,
    });

    await api.registrarInteraccion(creado.id, {
      personaId: p.id,
      tipo: "whatsapp",
      resumen: "Consulta rápida por WhatsApp",
    });

    const interacciones = await api.listarInteraccionesDeCliente(creado.id);
    expect(interacciones).toMatchObject([{ tipo: "whatsapp" }]);
  });

  it("registrarInteraccion deja rastro en la auditoría", async () => {
    const { nodo: n, persona: p } = await armarNodoYPersona();
    const creado = await api.crearCliente({
      nombre: "Acme",
      cuit: "30-11111111-1",
      nodoResponsableId: n.id,
      contactoDirectoId: p.id,
    });

    const interaccion = await api.registrarInteraccion(creado.id, {
      personaId: p.id,
      tipo: "llamada",
      resumen: "Charla de seguimiento",
    });

    const eventos = await db
      .select()
      .from(eventoAuditoria)
      .where(eq(eventoAuditoria.entidadId, interaccion.id));
    expect(eventos).toMatchObject([
      {
        personaId: p.id,
        accion: "clientes.interaccion.registrada",
        entidad: "clientes_interaccion",
      },
    ]);
  });
});
