import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { persona } from "@/kernel/identidad/schema";

// Contra Postgres real (diseño §10) — el bus de eventos en sí es en
// memoria, no necesita el contenedor, pero encolarNotificacion sí.
describe("modules/notificaciones events — suscripciones", () => {
  let container: StartedPostgreSqlContainer;
  let bus: typeof import("@/kernel/eventos/bus");
  let events: typeof import("./events");
  let api: typeof import("./api");
  let db: (typeof import("@/db/client"))["db"];
  let client: (typeof import("@/db/client"))["client"];

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:17-alpine").start();
    process.env.DATABASE_URL = container.getConnectionUri();

    ({ db, client } = await import("@/db/client"));
    bus = await import("@/kernel/eventos/bus");
    api = await import("./api");
    events = await import("./events");

    await migrate(db, { migrationsFolder: "./src/db/migrations" });
  });

  beforeEach(async () => {
    bus._reiniciarParaTests();
    events.suscribirseAEventos();
    await db.execute(sql`
      truncate table notificaciones_notificacion, persona
      restart identity cascade
    `);
  });

  afterAll(async () => {
    await client.end();
    await container.stop();
  });

  async function crearPersonaDePrueba(email: string) {
    const [creada] = await db
      .insert(persona)
      .values({ nombre: "P", apellido: "P", email, tipo: "empleado" })
      .returning();
    return creada!;
  }

  it("cliente.creado con destinatario encola una notificación con esa plantilla", async () => {
    const p = await crearPersonaDePrueba("a@mirage.test");

    await bus.publicar("cliente.creado", {
      clienteId: 1,
      nombre: "Acme",
      destinatarioPersonaId: p.id,
    });

    const fallidas = await api.listarNotificacionesFallidas();
    expect(fallidas).toEqual([]); // no debería fallar por esto
    const [fila] = await db.execute<{
      destinatario_persona_id: number;
      plantilla: string;
      estado: string;
    }>(
      sql`select destinatario_persona_id, plantilla, estado from notificaciones_notificacion`,
    );
    expect(fila).toMatchObject({
      destinatario_persona_id: p.id,
      plantilla: "cliente.creado",
      estado: "pendiente",
    });
  });

  it("cliente.creado sin destinatario (nodo vacante) no encola nada", async () => {
    await bus.publicar("cliente.creado", {
      clienteId: 1,
      nombre: "Acme",
      destinatarioPersonaId: null,
    });

    const filas = await db.execute(
      sql`select id from notificaciones_notificacion`,
    );
    expect(filas).toHaveLength(0);
  });

  it("tarea.asignada encola con personaId como destinatario", async () => {
    const p = await crearPersonaDePrueba("b@mirage.test");

    await bus.publicar("tarea.asignada", {
      tareaId: 1,
      personaId: p.id,
      titulo: "Maquetar home",
    });

    const [fila] = await db.execute<{
      destinatario_persona_id: number;
      plantilla: string;
    }>(
      sql`select destinatario_persona_id, plantilla from notificaciones_notificacion`,
    );
    expect(fila).toMatchObject({
      destinatario_persona_id: p.id,
      plantilla: "tarea.asignada",
    });
  });

  it("proyecto.creado y proyecto.estado_cambiado encolan con su propia plantilla", async () => {
    const p = await crearPersonaDePrueba("c@mirage.test");

    await bus.publicar("proyecto.creado", {
      proyectoId: 1,
      clienteId: 1,
      nombre: "Sitio",
      destinatarioPersonaId: p.id,
    });
    await bus.publicar("proyecto.estado_cambiado", {
      proyectoId: 1,
      nombre: "Sitio",
      estadoAnterior: "propuesto",
      estadoNuevo: "activo",
      destinatarioPersonaId: p.id,
    });

    const filas = await db.execute<{ plantilla: string }>(
      sql`select plantilla from notificaciones_notificacion order by id`,
    );
    expect(filas.map((f) => f.plantilla)).toEqual([
      "proyecto.creado",
      "proyecto.estado_cambiado",
    ]);
  });
});
