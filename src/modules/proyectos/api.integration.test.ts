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
        proyectos_repositorio_snapshot, proyectos_repositorio,
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

  it("listarTareas filtra por nodo, por persona y por lista de nodos, y excluye hechas", async () => {
    const { nodo: n, cliente } = await armarClienteYNodo();
    const [otroNodo] = await db
      .insert(nodo)
      .values({ nombre: "Ventas", padreId: n.id })
      .returning();
    const [empleado] = await db
      .insert(persona)
      .values({
        nombre: "Dev",
        apellido: "Uno",
        email: "dev@mirage.test",
        tipo: "empleado",
      })
      .returning();
    const proyecto = await api.crearProyecto({
      clienteId: cliente.id,
      nombre: "Sitio nuevo",
      nodoResponsableId: n.id,
    });
    const enDesarrollo = await api.crearTarea(proyecto.id, {
      titulo: "En desarrollo",
      nodoResponsableId: n.id,
    });
    await api.crearTarea(proyecto.id, {
      titulo: "En ventas",
      nodoResponsableId: otroNodo!.id,
    });
    await api.asignarPersonaATarea(enDesarrollo.id, empleado!.id);
    await api.cambiarEstadoTarea(enDesarrollo.id, "hecha");

    expect(
      (await api.listarTareas({ nodoResponsableId: n.id })).map(
        (t) => t.titulo,
      ),
    ).toEqual(["En desarrollo"]);

    expect(
      (await api.listarTareas({ personaAsignadaId: empleado!.id })).map(
        (t) => t.titulo,
      ),
    ).toEqual(["En desarrollo"]);

    expect(
      (
        await api.listarTareas({
          nodoResponsableIdEntre: [n.id, otroNodo!.id],
        })
      ).map((t) => t.titulo),
    ).toHaveLength(2);

    expect(
      (
        await api.listarTareas({
          nodoResponsableIdEntre: [n.id, otroNodo!.id],
          excluirHechas: true,
        })
      ).map((t) => t.titulo),
    ).toEqual(["En ventas"]);

    expect(await api.listarTareas({ nodoResponsableIdEntre: [] })).toEqual([]);
  });

  function fetchFalsoExitoso(): typeof fetch {
    return (async (url: string | URL) => {
      const u = url.toString();
      if (u.includes("/commits")) {
        return new Response(
          JSON.stringify([
            { commit: { author: { date: "2026-08-01T00:00:00Z" } } },
          ]),
        );
      }
      if (u.includes("state:open")) {
        return new Response(JSON.stringify({ total_count: 2 }));
      }
      if (u.includes("state:closed")) {
        return new Response(JSON.stringify({ total_count: 8 }));
      }
      return new Response(JSON.stringify([{}]));
    }) as unknown as typeof fetch;
  }

  function fetchFalsoQueFalla(): typeof fetch {
    return (async () =>
      new Response("no encontrado", {
        status: 404,
      })) as unknown as typeof fetch;
  }

  it("agregarRepositorio exige un proyecto existente", async () => {
    await expect(
      api.agregarRepositorio(999_999, "org", "repo"),
    ).rejects.toThrow(NoEncontrado);
  });

  it("sincronizarRepositorio guarda los datos en éxito", async () => {
    const { nodo: n, cliente } = await armarClienteYNodo();
    const proyecto = await api.crearProyecto({
      clienteId: cliente.id,
      nombre: "Sitio nuevo",
      nodoResponsableId: n.id,
    });
    const repo = await api.agregarRepositorio(proyecto.id, "org", "repo");

    await api.sincronizarRepositorio(repo.id, fetchFalsoExitoso());

    const [snapshot] = await api.listarRepositoriosDeProyecto(proyecto.id);
    expect(snapshot).toMatchObject({
      commitsTotal: 1,
      prsAbiertas: 2,
      prsCerradas: 8,
      contribuyentes: 1,
      error: null,
    });
  });

  it("sincronizarRepositorio deja el error en la fila y no pierde los datos viejos", async () => {
    const { nodo: n, cliente } = await armarClienteYNodo();
    const proyecto = await api.crearProyecto({
      clienteId: cliente.id,
      nombre: "Sitio nuevo",
      nodoResponsableId: n.id,
    });
    const repo = await api.agregarRepositorio(proyecto.id, "org", "repo");

    await api.sincronizarRepositorio(repo.id, fetchFalsoExitoso());
    await api.sincronizarRepositorio(repo.id, fetchFalsoQueFalla());

    const [snapshot] = await api.listarRepositoriosDeProyecto(proyecto.id);
    expect(snapshot?.error).toMatch(/404/);
    // Los números de la sincronización exitosa anterior siguen ahí —
    // la pantalla no queda en blanco (criterio de aceptación).
    expect(snapshot?.commitsTotal).toBe(1);
  });

  it("sincronizarTodosLosRepositorios sincroniza cada repo de cada proyecto", async () => {
    const { nodo: n, cliente } = await armarClienteYNodo();
    const proyecto = await api.crearProyecto({
      clienteId: cliente.id,
      nombre: "Sitio nuevo",
      nodoResponsableId: n.id,
    });
    const repo1 = await api.agregarRepositorio(proyecto.id, "org", "repo1");
    const repo2 = await api.agregarRepositorio(proyecto.id, "org", "repo2");

    await api.sincronizarTodosLosRepositorios(fetchFalsoExitoso());

    const repos = await api.listarRepositoriosDeProyecto(proyecto.id);
    expect(repos.find((r) => r.id === repo1.id)?.error).toBeNull();
    expect(repos.find((r) => r.id === repo2.id)?.error).toBeNull();
  });
});
