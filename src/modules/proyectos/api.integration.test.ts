import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { NoEncontrado } from "@/kernel/errores";
import { persona } from "@/kernel/identidad/schema";
import { nodo } from "@/kernel/organigrama/schema";

// Contra Postgres real en un contenedor efímero, no mocks (diseño §10).
//
// clientes/api (igual que db/client) se importa dinámicamente recién
// después de levantar el contenedor: un import estático arriba se
// resolvería antes de que exista DATABASE_URL.
describe("modules/proyectos api", () => {
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
        proyectos_tarea, proyectos_proyecto, clientes_cliente,
        asignacion, nodo, persona
      restart identity cascade
    `);
  });

  afterAll(async () => {
    await client.end();
    await container.stop();
  });

  async function armarClienteYNodo() {
    const [raiz] = await db
      .insert(nodo)
      .values({ nombre: "Interno", raiz: "interno" })
      .returning();
    const [n] = await db
      .insert(nodo)
      .values({ nombre: "Desarrollo", padreId: raiz!.id })
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
    const cliente = await clientesApi.crearCliente({
      nombre: "Acme",
      cuit: "30-11111111-1",
      nodoResponsableId: n!.id,
      contactoDirectoId: p!.id,
    });
    return { nodo: n!, cliente };
  }

  it("crearProyecto exige un cliente existente", async () => {
    const { nodo: n } = await armarClienteYNodo();

    await expect(
      api.crearProyecto({
        clienteId: 999_999,
        nombre: "Sitio nuevo",
        nodoResponsableId: n.id,
      }),
    ).rejects.toThrow(NoEncontrado);
  });

  it("crearProyecto exige un nodo responsable existente", async () => {
    const { cliente } = await armarClienteYNodo();

    await expect(
      api.crearProyecto({
        clienteId: cliente.id,
        nombre: "Sitio nuevo",
        nodoResponsableId: 999_999,
      }),
    ).rejects.toThrow(NoEncontrado);
  });

  it("crearProyecto arranca en estado propuesto", async () => {
    const { nodo: n, cliente } = await armarClienteYNodo();

    const creado = await api.crearProyecto({
      clienteId: cliente.id,
      nombre: "Sitio nuevo",
      nodoResponsableId: n.id,
    });

    expect(creado.estado).toBe("propuesto");
  });

  it("cambiarEstadoProyecto no hace nada si el estado no cambia", async () => {
    const { nodo: n, cliente } = await armarClienteYNodo();
    const creado = await api.crearProyecto({
      clienteId: cliente.id,
      nombre: "Sitio nuevo",
      nodoResponsableId: n.id,
    });

    const resultado = await api.cambiarEstadoProyecto(creado.id, "propuesto");

    expect(resultado.estado).toBe("propuesto");
  });

  it("cambiarEstadoProyecto actualiza el estado", async () => {
    const { nodo: n, cliente } = await armarClienteYNodo();
    const creado = await api.crearProyecto({
      clienteId: cliente.id,
      nombre: "Sitio nuevo",
      nodoResponsableId: n.id,
    });

    const actualizado = await api.cambiarEstadoProyecto(creado.id, "activo");

    expect(actualizado.estado).toBe("activo");
  });

  it("crearTarea exige un proyecto y un nodo responsable existentes", async () => {
    const { nodo: n, cliente } = await armarClienteYNodo();
    const proyecto = await api.crearProyecto({
      clienteId: cliente.id,
      nombre: "Sitio nuevo",
      nodoResponsableId: n.id,
    });

    await expect(
      api.crearTarea(999_999, { titulo: "X", nodoResponsableId: n.id }),
    ).rejects.toThrow(NoEncontrado);
    await expect(
      api.crearTarea(proyecto.id, {
        titulo: "X",
        nodoResponsableId: 999_999,
      }),
    ).rejects.toThrow(NoEncontrado);
  });

  it("cambiarEstadoTarea a hecha marca completadaEn, y volver atrás la limpia", async () => {
    const { nodo: n, cliente } = await armarClienteYNodo();
    const proyecto = await api.crearProyecto({
      clienteId: cliente.id,
      nombre: "Sitio nuevo",
      nodoResponsableId: n.id,
    });
    const tarea = await api.crearTarea(proyecto.id, {
      titulo: "Maquetar home",
      nodoResponsableId: n.id,
    });

    const hecha = await api.cambiarEstadoTarea(tarea.id, "hecha");
    expect(hecha.completadaEn).not.toBeNull();

    const vueltaAtras = await api.cambiarEstadoTarea(tarea.id, "en_curso");
    expect(vueltaAtras.completadaEn).toBeNull();
  });

  it("asignarPersonaATarea exige que la persona exista, y permite desasignar", async () => {
    const { nodo: n, cliente } = await armarClienteYNodo();
    const proyecto = await api.crearProyecto({
      clienteId: cliente.id,
      nombre: "Sitio nuevo",
      nodoResponsableId: n.id,
    });
    const tarea = await api.crearTarea(proyecto.id, {
      titulo: "Maquetar home",
      nodoResponsableId: n.id,
    });
    const [empleado] = await db
      .insert(persona)
      .values({
        nombre: "Dev",
        apellido: "Uno",
        email: "dev@mirage.test",
        tipo: "empleado",
      })
      .returning();

    await expect(api.asignarPersonaATarea(tarea.id, 999_999)).rejects.toThrow(
      NoEncontrado,
    );

    const asignada = await api.asignarPersonaATarea(tarea.id, empleado!.id);
    expect(asignada.personaAsignadaId).toBe(empleado!.id);

    const desasignada = await api.asignarPersonaATarea(tarea.id, null);
    expect(desasignada.personaAsignadaId).toBeNull();
  });

  it("obtenerProgresoDeProyecto cuenta tareas hechas sobre el total", async () => {
    const { nodo: n, cliente } = await armarClienteYNodo();
    const proyecto = await api.crearProyecto({
      clienteId: cliente.id,
      nombre: "Sitio nuevo",
      nodoResponsableId: n.id,
    });
    const t1 = await api.crearTarea(proyecto.id, {
      titulo: "Uno",
      nodoResponsableId: n.id,
    });
    await api.crearTarea(proyecto.id, {
      titulo: "Dos",
      nodoResponsableId: n.id,
    });
    await api.crearTarea(proyecto.id, {
      titulo: "Tres",
      nodoResponsableId: n.id,
    });
    await api.cambiarEstadoTarea(t1.id, "hecha");

    const progreso = await api.obtenerProgresoDeProyecto(proyecto.id);

    expect(progreso).toEqual({ hechas: 1, totales: 3 });
  });
});
