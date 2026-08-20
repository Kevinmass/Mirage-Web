import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Conflicto, NoEncontrado } from "@/kernel/errores";
import { persona } from "@/kernel/identidad/schema";
import { nodo } from "@/kernel/organigrama/schema";

// Contra Postgres real en un contenedor efímero, no mocks (diseño §10).
describe("modules/solicitudes api", () => {
  let container: StartedPostgreSqlContainer;
  let api: typeof import("./api");
  let clientesApi: typeof import("@/modules/clientes/api");
  let db: (typeof import("@/db/client"))["db"];
  let client: (typeof import("@/db/client"))["client"];

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:17-alpine").start();
    process.env.DATABASE_URL = container.getConnectionUri();

    ({ db, client } = await import("@/db/client"));
    api = await import("./api");
    clientesApi = await import("@/modules/clientes/api");

    await migrate(db, { migrationsFolder: "./src/db/migrations" });
  });

  beforeEach(async () => {
    await db.execute(sql`
      truncate table
        solicitudes_mensaje, solicitudes_solicitud,
        clientes_contacto, clientes_cliente,
        asignacion, nodo, persona
      restart identity cascade
    `);
  });

  afterAll(async () => {
    await client.end();
    await container.stop();
  });

  async function armarClienteYContacto() {
    const [raiz] = await db
      .insert(nodo)
      .values({ nombre: "Interno", raiz: "interno" })
      .returning();
    const [n] = await db
      .insert(nodo)
      .values({ nombre: "Desarrollo", padreId: raiz!.id })
      .returning();
    const [contactoDirecto] = await db
      .insert(persona)
      .values({
        nombre: "Contacto",
        apellido: "Directo",
        email: "directo@acme.test",
        tipo: "empleado",
      })
      .returning();
    const cliente = await clientesApi.crearCliente({
      nombre: "Acme",
      cuit: "30-11111111-1",
      nodoResponsableId: n!.id,
      contactoDirectoId: contactoDirecto!.id,
    });
    const contactoCliente = await clientesApi.crearContacto(cliente.id, {
      email: "contacto@acme.test",
      nombre: "Cliente",
      apellido: "Contacto",
    });
    return { nodo: n!, cliente, personaContactoId: contactoCliente.personaId };
  }

  it("crearSolicitud exige un cliente y una persona existentes", async () => {
    const { personaContactoId } = await armarClienteYContacto();

    await expect(
      api.crearSolicitud(999_999, personaContactoId, {
        titulo: "X",
        descripcion: "Y",
        tipo: "consulta",
      }),
    ).rejects.toThrow(NoEncontrado);
  });

  it("crearSolicitud hereda el nodo responsable del cliente y arranca en recibida", async () => {
    const { nodo: n, cliente, personaContactoId } = await armarClienteYContacto();

    const creada = await api.crearSolicitud(cliente.id, personaContactoId, {
      titulo: "Necesitamos un formulario nuevo",
      descripcion: "Para el sitio de contacto",
      tipo: "funcionalidad_nueva",
    });

    expect(creada.nodoResponsableId).toBe(n.id);
    expect(creada.estado).toBe("recibida");
    expect(creada.proyectoId).toBeNull();
  });

  it("crearSolicitud publica solicitud.creada con el titular del nodo como destinatario", async () => {
    const bus = await import("@/kernel/eventos/bus");
    const { nodo: n, cliente, personaContactoId } = await armarClienteYContacto();
    const { asignarPersona } = await import("@/kernel/organigrama/arbol");
    const [titular] = await db
      .insert(persona)
      .values({
        nombre: "Titular",
        apellido: "Uno",
        email: "titular@mirage.test",
        tipo: "empleado",
      })
      .returning();
    await asignarPersona(titular!.id, n.id, true);

    const recibidos: unknown[] = [];
    bus.suscribir("solicitud.creada", (payload) => {
      recibidos.push(payload);
    });

    const creada = await api.crearSolicitud(cliente.id, personaContactoId, {
      titulo: "Título",
      descripcion: "Descripción",
      tipo: "bug",
    });

    expect(recibidos).toEqual([
      {
        solicitudId: creada.id,
        clienteId: cliente.id,
        titulo: "Título",
        destinatarioPersonaId: titular!.id,
      },
    ]);
    bus._reiniciarParaTests();
  });

  it("listarSolicitudesDeCliente nunca devuelve solicitudes de otro cliente", async () => {
    const a = await armarClienteYContacto();
    const b = await clientesApi.crearCliente({
      nombre: "Beta",
      cuit: "30-22222222-2",
      nodoResponsableId: a.nodo.id,
      contactoDirectoId: a.personaContactoId,
    });
    const contactoB = await clientesApi.crearContacto(b.id, {
      email: "contacto@beta.test",
      nombre: "Beta",
      apellido: "Contacto",
    });

    await api.crearSolicitud(a.cliente.id, a.personaContactoId, {
      titulo: "De Acme",
      descripcion: "...",
      tipo: "consulta",
    });
    await api.crearSolicitud(b.id, contactoB.personaId, {
      titulo: "De Beta",
      descripcion: "...",
      tipo: "consulta",
    });

    const deAcme = await api.listarSolicitudesDeCliente(a.cliente.id);
    expect(deAcme.map((s) => s.titulo)).toEqual(["De Acme"]);

    const deBeta = await api.listarSolicitudesDeCliente(b.id);
    expect(deBeta.map((s) => s.titulo)).toEqual(["De Beta"]);
  });

  // Contrato de aislamiento del portal (PR 7.1, ítem 2 de
  // aislamiento-portal.contrato.test.ts): un contacto no puede leer
  // una solicitud de otro cliente pidiéndola por id — ni con el id
  // exacto. El mismo NoEncontrado para "no existe" y para "es de otro
  // cliente": la ficha de /portal/solicitudes/[id] nunca puede
  // distinguir uno de otro (mismo criterio que 404-no-403 entre /app
  // y /portal).
  it("obtenerSolicitudDeCliente tira NoEncontrado si la solicitud es de otro cliente", async () => {
    const a = await armarClienteYContacto();
    const b = await clientesApi.crearCliente({
      nombre: "Beta",
      cuit: "30-33333333-3",
      nodoResponsableId: a.nodo.id,
      contactoDirectoId: a.personaContactoId,
    });

    const deA = await api.crearSolicitud(a.cliente.id, a.personaContactoId, {
      titulo: "De Acme",
      descripcion: "...",
      tipo: "consulta",
    });

    await expect(
      api.obtenerSolicitudDeCliente(b.id, deA.id),
    ).rejects.toThrow(NoEncontrado);

    const propia = await api.obtenerSolicitudDeCliente(a.cliente.id, deA.id);
    expect(propia.id).toBe(deA.id);
  });

  it("marcarEnEvaluacion solo funciona desde recibida", async () => {
    const { cliente, personaContactoId } = await armarClienteYContacto();
    const creada = await api.crearSolicitud(cliente.id, personaContactoId, {
      titulo: "X",
      descripcion: "Y",
      tipo: "otro",
    });

    const enEvaluacion = await api.marcarEnEvaluacion(creada.id);
    expect(enEvaluacion.estado).toBe("en_evaluacion");

    await expect(api.marcarEnEvaluacion(creada.id)).rejects.toThrow(Conflicto);
  });

  it("aceptarSolicitud y rechazarSolicitud rechazan una solicitud ya resuelta", async () => {
    const { cliente, personaContactoId } = await armarClienteYContacto();
    const creada = await api.crearSolicitud(cliente.id, personaContactoId, {
      titulo: "X",
      descripcion: "Y",
      tipo: "otro",
    });
    await api.aceptarSolicitud(creada.id);

    await expect(api.aceptarSolicitud(creada.id)).rejects.toThrow(Conflicto);
    await expect(api.rechazarSolicitud(creada.id)).rejects.toThrow(Conflicto);
  });

  it("aceptarSolicitud marca resueltoEn y publica solicitud.aceptada con el creador como destinatario", async () => {
    const bus = await import("@/kernel/eventos/bus");
    const { nodo: n, cliente, personaContactoId } = await armarClienteYContacto();
    const creada = await api.crearSolicitud(cliente.id, personaContactoId, {
      titulo: "Título",
      descripcion: "Descripción",
      tipo: "bug",
    });

    const recibidos: unknown[] = [];
    bus.suscribir("solicitud.aceptada", (payload) => {
      recibidos.push(payload);
    });

    const aceptada = await api.aceptarSolicitud(creada.id);

    expect(aceptada.estado).toBe("aceptada");
    expect(aceptada.resueltoEn).not.toBeNull();
    expect(recibidos).toEqual([
      {
        solicitudId: creada.id,
        clienteId: cliente.id,
        nodoResponsableId: n.id,
        titulo: "Título",
        descripcion: "Descripción",
        destinatarioPersonaId: personaContactoId,
      },
    ]);
    bus._reiniciarParaTests();
  });

  it("rechazarSolicitud marca resueltoEn y publica solicitud.rechazada", async () => {
    const bus = await import("@/kernel/eventos/bus");
    const { cliente, personaContactoId } = await armarClienteYContacto();
    const creada = await api.crearSolicitud(cliente.id, personaContactoId, {
      titulo: "Título",
      descripcion: "Descripción",
      tipo: "bug",
    });

    const recibidos: unknown[] = [];
    bus.suscribir("solicitud.rechazada", (payload) => {
      recibidos.push(payload);
    });

    const rechazada = await api.rechazarSolicitud(creada.id);

    expect(rechazada.estado).toBe("rechazada");
    expect(rechazada.resueltoEn).not.toBeNull();
    expect(recibidos).toEqual([
      {
        solicitudId: creada.id,
        clienteId: cliente.id,
        titulo: "Título",
        destinatarioPersonaId: personaContactoId,
      },
    ]);
    bus._reiniciarParaTests();
  });

  it("vincularProyectoPendiente completa proyectoId de la solicitud aceptada más reciente, y no toca las que ya lo tienen", async () => {
    const { cliente, personaContactoId } = await armarClienteYContacto();
    const primera = await api.crearSolicitud(cliente.id, personaContactoId, {
      titulo: "Primera",
      descripcion: "...",
      tipo: "otro",
    });
    await api.aceptarSolicitud(primera.id);
    await api.vincularProyectoPendiente(cliente.id, 111);

    const segunda = await api.crearSolicitud(cliente.id, personaContactoId, {
      titulo: "Segunda",
      descripcion: "...",
      tipo: "otro",
    });
    await api.aceptarSolicitud(segunda.id);
    await api.vincularProyectoPendiente(cliente.id, 222);

    expect((await api.obtenerSolicitud(primera.id)).proyectoId).toBe(111);
    expect((await api.obtenerSolicitud(segunda.id)).proyectoId).toBe(222);
  });

  it("vincularProyectoPendiente no hace nada si no hay ninguna solicitud aceptada pendiente de proyecto", async () => {
    const { cliente } = await armarClienteYContacto();
    await expect(
      api.vincularProyectoPendiente(cliente.id, 999),
    ).resolves.toBeUndefined();
  });

  it("agregarMensaje: listarMensajesDeSolicitud ve todo, listarMensajesVisiblesParaCliente solo lo visible", async () => {
    const { cliente, personaContactoId } = await armarClienteYContacto();
    const [empleado] = await db
      .insert(persona)
      .values({
        nombre: "Empleado",
        apellido: "Uno",
        email: "empleado@mirage.test",
        tipo: "empleado",
      })
      .returning();
    const creada = await api.crearSolicitud(cliente.id, personaContactoId, {
      titulo: "Título",
      descripcion: "Descripción",
      tipo: "consulta",
    });

    await api.agregarMensaje(
      creada.id,
      personaContactoId,
      "Mensaje del cliente",
      true,
    );
    await api.agregarMensaje(
      creada.id,
      empleado!.id,
      "Nota interna, ojo con esto",
      false,
    );

    const todos = await api.listarMensajesDeSolicitud(creada.id);
    expect(todos.map((m) => m.cuerpo)).toEqual([
      "Mensaje del cliente",
      "Nota interna, ojo con esto",
    ]);

    const visibles = await api.listarMensajesVisiblesParaCliente(creada.id);
    expect(visibles.map((m) => m.cuerpo)).toEqual(["Mensaje del cliente"]);
  });

  it("agregarMensaje publica solicitud.mensaje_agregado con destinatario null si el mensaje es interno", async () => {
    const bus = await import("@/kernel/eventos/bus");
    const { cliente, personaContactoId } = await armarClienteYContacto();
    const [empleado] = await db
      .insert(persona)
      .values({
        nombre: "Empleado",
        apellido: "Uno",
        email: "empleado2@mirage.test",
        tipo: "empleado",
      })
      .returning();
    const creada = await api.crearSolicitud(cliente.id, personaContactoId, {
      titulo: "Título",
      descripcion: "Descripción",
      tipo: "consulta",
    });

    const recibidos: unknown[] = [];
    bus.suscribir("solicitud.mensaje_agregado", (payload) => {
      recibidos.push(payload);
    });

    await api.agregarMensaje(creada.id, empleado!.id, "Nota interna", false);

    expect(recibidos).toEqual([
      {
        solicitudId: creada.id,
        clienteId: cliente.id,
        personaId: empleado!.id,
        visibleParaCliente: false,
        destinatarioPersonaId: null,
      },
    ]);
    bus._reiniciarParaTests();
  });
});
