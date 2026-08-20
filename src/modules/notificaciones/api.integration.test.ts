import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { NoEncontrado } from "@/kernel/errores";
import { persona } from "@/kernel/identidad/schema";
import type { Enviador } from "./api";

// Contra Postgres real en un contenedor efímero, no mocks (diseño §10).
// El envío de mail se inyecta (Enviador) — nunca contra la red real de
// Resend en un test automatizado, ni con datos reales ni con una key
// inválida: sería frágil y no hace falta para probar el backoff, que
// es puramente lógica de la base + el reloj.
describe("modules/notificaciones api", () => {
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

  function enviadorQueFalla(): Enviador {
    return async () => {
      throw new Error("API key inválida");
    };
  }

  function enviadorQueFunciona(): Enviador {
    return async () => {};
  }

  it("encolarNotificacion la deja pendiente con 0 intentos", async () => {
    const p = await crearPersonaDePrueba("a@mirage.test");

    const creada = await api.encolarNotificacion({
      destinatarioPersonaId: p.id,
      plantilla: "prueba",
      datos: { foo: "bar" },
    });

    expect(creada.estado).toBe("pendiente");
    expect(creada.intentos).toBe(0);
  });

  it("procesarNotificacion en éxito pasa a enviada", async () => {
    const p = await crearPersonaDePrueba("b@mirage.test");
    const creada = await api.encolarNotificacion({
      destinatarioPersonaId: p.id,
      plantilla: "prueba",
      datos: {},
    });

    const procesada = await api.procesarNotificacion(
      creada.id,
      enviadorQueFunciona(),
    );

    expect(procesada.estado).toBe("enviada");
    expect(procesada.enviadoEn).not.toBeNull();
    expect(procesada.error).toBeNull();
  });

  // Criterio de aceptación del PR: con la API key inválida, la
  // notificación queda pendiente con intentos creciendo y termina en
  // fallida — nunca se pierde.
  it("con envíos que fallan siempre, queda pendiente con intentos creciendo y termina en fallida", async () => {
    const p = await crearPersonaDePrueba("c@mirage.test");
    const creada = await api.encolarNotificacion({
      destinatarioPersonaId: p.id,
      plantilla: "prueba",
      datos: {},
    });
    const enviador = enviadorQueFalla();

    const intento1 = await api.procesarNotificacion(creada.id, enviador);
    expect(intento1.estado).toBe("pendiente");
    expect(intento1.intentos).toBe(1);
    expect(intento1.error).toMatch(/API key inválida/);

    const intento2 = await api.procesarNotificacion(creada.id, enviador);
    const intento3 = await api.procesarNotificacion(creada.id, enviador);
    const intento4 = await api.procesarNotificacion(creada.id, enviador);
    expect(intento2.estado).toBe("pendiente");
    expect(intento3.estado).toBe("pendiente");
    expect(intento4.estado).toBe("pendiente");
    expect(intento4.intentos).toBe(4);

    const intento5 = await api.procesarNotificacion(creada.id, enviador);
    expect(intento5.estado).toBe("fallida");
    expect(intento5.intentos).toBe(5);

    // Nunca se pierde: la fila sigue ahí, con el error visible.
    const releida = await api.obtenerNotificacion(creada.id);
    expect(releida.estado).toBe("fallida");
    expect(releida.error).toMatch(/API key inválida/);
  });

  it("procesarPendientes no reintenta antes de que toque el backoff", async () => {
    const p = await crearPersonaDePrueba("d@mirage.test");
    const creada = await api.encolarNotificacion({
      destinatarioPersonaId: p.id,
      plantilla: "prueba",
      datos: {},
    });
    // Primer intento falla — queda pendiente, intentos=1, con
    // backoff de 1 minuto.
    await api.procesarNotificacion(creada.id, enviadorQueFalla());

    // El worker corre "ahora mismo": todavía no pasó 1 minuto, no
    // debería reintentar.
    const enviador = enviadorQueFunciona();
    await api.procesarPendientes(enviador);

    const sinReintentar = await api.obtenerNotificacion(creada.id);
    expect(sinReintentar.estado).toBe("pendiente");
    expect(sinReintentar.intentos).toBe(1);
  });

  it("procesarPendientes sí reintenta cuando ya pasó el backoff", async () => {
    const p = await crearPersonaDePrueba("e@mirage.test");
    const creada = await api.encolarNotificacion({
      destinatarioPersonaId: p.id,
      plantilla: "prueba",
      datos: {},
    });
    await api.procesarNotificacion(creada.id, enviadorQueFalla());

    // Empujamos ultimo_intento_en al pasado para simular que ya pasó
    // el minuto de espera, sin depender de un sleep real en el test.
    await db.execute(
      sql`update notificaciones_notificacion set ultimo_intento_en = now() - interval '2 minutes' where id = ${creada.id}`,
    );

    await api.procesarPendientes(enviadorQueFunciona());

    const procesada = await api.obtenerNotificacion(creada.id);
    expect(procesada.estado).toBe("enviada");
  });

  it("reintentarNotificacion vuelve una fallida a pendiente y la procesa ya", async () => {
    const p = await crearPersonaDePrueba("f@mirage.test");
    const creada = await api.encolarNotificacion({
      destinatarioPersonaId: p.id,
      plantilla: "prueba",
      datos: {},
    });
    const falla = enviadorQueFalla();
    for (let i = 0; i < 5; i++) {
      await api.procesarNotificacion(creada.id, falla);
    }
    expect((await api.obtenerNotificacion(creada.id)).estado).toBe("fallida");

    const reintentada = await api.reintentarNotificacion(
      creada.id,
      enviadorQueFunciona(),
    );

    expect(reintentada.estado).toBe("enviada");
  });

  it("listarNotificacionesFallidas solo trae las fallidas", async () => {
    const p = await crearPersonaDePrueba("g@mirage.test");
    await api.encolarNotificacion({
      destinatarioPersonaId: p.id,
      plantilla: "prueba",
      datos: {},
    });
    const fallida = await api.encolarNotificacion({
      destinatarioPersonaId: p.id,
      plantilla: "prueba",
      datos: {},
    });
    const falla = enviadorQueFalla();
    for (let i = 0; i < 5; i++) {
      await api.procesarNotificacion(fallida.id, falla);
    }

    const fallidas = await api.listarNotificacionesFallidas();

    expect(fallidas).toHaveLength(1);
    expect(fallidas[0]?.id).toBe(fallida.id);
  });

  it("encolarNotificacion exige que el destinatario exista", async () => {
    await expect(
      api.encolarNotificacion({
        destinatarioPersonaId: 999_999,
        plantilla: "prueba",
        datos: {},
      }),
    ).rejects.toThrow(NoEncontrado);
  });
});
