import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { persona } from "@/kernel/identidad/schema";
import { nodo } from "@/kernel/organigrama/schema";
import { proyectosProyecto } from "@/modules/proyectos/schema";

// PR 7.6, criterio de aceptación: "un test extremo a extremo del
// flujo completo" — aceptar una solicitud crea el proyecto de verdad,
// a través del bus de eventos real (kernel/eventos/bus.ts +
// kernel/eventos/registro.ts), no de un suscriptor de prueba armado a
// mano. La diferencia con las pruebas de solicitudes/api.integration
// y proyectos/api.integration (que suscriben un espía a un evento
// puntual): acá nadie llama bus.suscribir() — se deja que
// asegurarSuscripciones() haga exactamente lo que hace en producción
// la primera vez que se publica algo. Es la única prueba de que el
// desacople solicitudes → evento → proyectos funciona de punta a
// punta, no solo que cada mitad por separado hace lo que dice hacer.
describe("kernel/eventos — flujo solicitud.aceptada → proyecto.creado", () => {
  let container: StartedPostgreSqlContainer;
  let solicitudesApi: typeof import("@/modules/solicitudes/api");
  let clientesApi: typeof import("@/modules/clientes/api");
  let db: (typeof import("@/db/client"))["db"];
  let client: (typeof import("@/db/client"))["client"];

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:17-alpine").start();
    process.env.DATABASE_URL = container.getConnectionUri();

    ({ db, client } = await import("@/db/client"));
    solicitudesApi = await import("@/modules/solicitudes/api");
    clientesApi = await import("@/modules/clientes/api");

    await migrate(db, { migrationsFolder: "./src/db/migrations" });
  });

  beforeEach(async () => {
    await db.execute(sql`
      truncate table
        proyectos_tarea, proyectos_proyecto,
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
      cuit: "30-44444444-4",
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

  it("aceptar una solicitud crea el proyecto real y lo linkea de vuelta, sin ningún suscriptor de prueba", async () => {
    const { nodo: n, cliente, personaContactoId } = await armarClienteYContacto();
    const solicitud = await solicitudesApi.crearSolicitud(
      cliente.id,
      personaContactoId,
      {
        titulo: "Rehacer el formulario de contacto",
        descripcion: "El actual no manda los mails de vuelta.",
        tipo: "funcionalidad_nueva",
      },
    );

    await solicitudesApi.aceptarSolicitud(solicitud.id);

    // El bus.publicar de aceptarSolicitud espera a que todos los
    // suscriptores de solicitud.aceptada terminen (incluido el de
    // proyectos, que hace un insert) antes de devolver el control —
    // no hace falta esperar nada más acá.
    const [proyectoCreado] = await db
      .select()
      .from(proyectosProyecto)
      .where(eq(proyectosProyecto.clienteId, cliente.id));

    expect(proyectoCreado).toMatchObject({
      clienteId: cliente.id,
      nombre: "Rehacer el formulario de contacto",
      descripcion: "El actual no manda los mails de vuelta.",
      nodoResponsableId: n.id,
      estado: "propuesto",
    });

    const solicitudActualizada = await solicitudesApi.obtenerSolicitud(
      solicitud.id,
    );
    expect(solicitudActualizada.proyectoId).toBe(proyectoCreado!.id);
  });

  it("rechazar una solicitud nunca crea un proyecto", async () => {
    const { cliente, personaContactoId } = await armarClienteYContacto();
    const solicitud = await solicitudesApi.crearSolicitud(
      cliente.id,
      personaContactoId,
      { titulo: "X", descripcion: "Y", tipo: "otro" },
    );

    await solicitudesApi.rechazarSolicitud(solicitud.id);

    const proyectos = await db
      .select()
      .from(proyectosProyecto)
      .where(eq(proyectosProyecto.clienteId, cliente.id));
    expect(proyectos).toEqual([]);
  });
});
