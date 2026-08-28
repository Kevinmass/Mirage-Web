import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Conflicto, NoAutorizado } from "@/kernel/errores";
import {
  capacidad,
  personaRol,
  rol,
  rolCapacidad,
} from "@/kernel/permisos/schema";
import { contenidoCaso, contenidoPagina, contenidoServicio } from "./schema";

// Contra Postgres real en un contenedor efímero, no mocks (diseño §10).
//
// api.ts importa el cliente singleton @/db/client, que lee DATABASE_URL al
// cargarse. Por eso ese import (y el de api.ts, que lo arrastra) es
// dinámico y recién pasa DESPUÉS de levantar el contenedor y setear la
// variable — un import estático arriba del archivo se resolvería antes de
// que el contenedor exista.
describe("modules/contenido api", () => {
  let container: StartedPostgreSqlContainer;
  let api: typeof import("./api");
  let db: (typeof import("@/db/client"))["db"];
  let client: (typeof import("@/db/client"))["client"];

  const PERSONA_CON_PERMISO = 1;
  const PERSONA_SIN_PERMISO = 2;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:17-alpine").start();
    process.env.DATABASE_URL = container.getConnectionUri();

    ({ db, client } = await import("@/db/client"));
    api = await import("./api");

    await migrate(db, { migrationsFolder: "./src/db/migrations" });

    await db.insert(contenidoPagina).values([
      {
        slug: "inicio",
        titulo: "Mirage",
        cuerpo: "# Mirage",
        publicada: true,
      },
      {
        slug: "borrador",
        titulo: "Sin publicar",
        cuerpo: "shh",
        publicada: false,
      },
    ]);
    await db.insert(contenidoServicio).values([
      {
        nombre: "Activo, primero",
        descripcion: "d",
        slug: "activo-primero",
        orden: 1,
        activo: true,
      },
      {
        nombre: "Activo, segundo",
        descripcion: "d",
        slug: "activo-segundo",
        orden: 2,
        activo: true,
      },
      {
        nombre: "Inactivo",
        descripcion: "d",
        slug: "inactivo",
        orden: 0,
        activo: false,
      },
    ]);
    await db.insert(contenidoCaso).values([
      { titulo: "Publicado", resumen: "r", publicado: true, clienteId: null },
      {
        titulo: "Sin publicar",
        resumen: "r",
        publicado: false,
        clienteId: null,
      },
    ]);

    await db.insert(capacidad).values({
      clave: "contenido.editar",
      modulo: "contenido",
      descripcion: "d",
    });
    const [rolCreado] = await db
      .insert(rol)
      .values({ nombre: "editor de contenido" })
      .returning();
    await db
      .insert(rolCapacidad)
      .values({ rolId: rolCreado!.id, capacidadClave: "contenido.editar" });
    await db
      .insert(personaRol)
      .values({ personaId: PERSONA_CON_PERMISO, rolId: rolCreado!.id });
  });

  afterAll(async () => {
    await client.end();
    await container.stop();
  });

  it("obtenerPaginaPorSlug devuelve una página publicada", async () => {
    const pagina = await api.obtenerPaginaPorSlug("inicio");
    expect(pagina?.titulo).toBe("Mirage");
  });

  it("obtenerPaginaPorSlug no devuelve una página sin publicar", async () => {
    const pagina = await api.obtenerPaginaPorSlug("borrador");
    expect(pagina).toBeUndefined();
  });

  it("obtenerPaginaPorSlug no devuelve nada si el slug no existe", async () => {
    const pagina = await api.obtenerPaginaPorSlug("no-existe");
    expect(pagina).toBeUndefined();
  });

  it("listarServiciosActivos filtra inactivos y ordena por orden", async () => {
    const servicios = await api.listarServiciosActivos();
    expect(servicios.map((s) => s.nombre)).toEqual([
      "Activo, primero",
      "Activo, segundo",
    ]);
  });

  it("obtenerServicioPorSlug no devuelve un servicio inactivo", async () => {
    const servicio = await api.obtenerServicioPorSlug("inactivo");
    expect(servicio).toBeUndefined();
  });

  it("listarCasosPublicados filtra los no publicados", async () => {
    const casos = await api.listarCasosPublicados();
    expect(casos).toHaveLength(1);
    expect(casos[0]?.titulo).toBe("Publicado");
  });

  it("crearServicio tira NoAutorizado sin la capacidad contenido.editar", async () => {
    await expect(
      api.crearServicio(PERSONA_SIN_PERMISO, {
        nombre: "Nuevo",
        descripcion: "d",
        slug: "nuevo-1",
        orden: 0,
        activo: true,
      }),
    ).rejects.toThrow(NoAutorizado);
  });

  it("crearServicio crea el servicio con la capacidad y aparece en listarServiciosActivos", async () => {
    const creado = await api.crearServicio(PERSONA_CON_PERMISO, {
      nombre: "Consultoría técnica",
      descripcion: "d",
      slug: "consultoria-tecnica",
      orden: 3,
      activo: true,
    });
    expect(creado.slug).toBe("consultoria-tecnica");

    const servicio = await api.obtenerServicioPorSlug("consultoria-tecnica");
    expect(servicio?.nombre).toBe("Consultoría técnica");
  });

  it("crearServicio con un slug repetido tira Conflicto", async () => {
    await expect(
      api.crearServicio(PERSONA_CON_PERMISO, {
        nombre: "Otro nombre",
        descripcion: "d",
        slug: "consultoria-tecnica",
        orden: 4,
        activo: true,
      }),
    ).rejects.toThrow(Conflicto);
  });

  it("actualizarServicio con activo:false lo saca de listarServiciosActivos pero no lo borra", async () => {
    const creado = await api.crearServicio(PERSONA_CON_PERMISO, {
      nombre: "A despublicar",
      descripcion: "d",
      slug: "a-despublicar",
      orden: 5,
      activo: true,
    });

    await api.actualizarServicio(PERSONA_CON_PERMISO, creado.id, {
      activo: false,
    });

    const activos = await api.listarServiciosActivos();
    expect(activos.map((s) => s.slug)).not.toContain("a-despublicar");

    const todos = await api.listarServicios();
    expect(todos.map((s) => s.slug)).toContain("a-despublicar");
  });

  it("actualizarServicio tira NoAutorizado sin la capacidad", async () => {
    const creado = await api.crearServicio(PERSONA_CON_PERMISO, {
      nombre: "Protegido",
      descripcion: "d",
      slug: "protegido",
      orden: 6,
      activo: true,
    });

    await expect(
      api.actualizarServicio(PERSONA_SIN_PERMISO, creado.id, {
        nombre: "Hackeado",
      }),
    ).rejects.toThrow(NoAutorizado);
  });

  it("crearCaso tira NoAutorizado sin la capacidad contenido.editar", async () => {
    await expect(
      api.crearCaso(PERSONA_SIN_PERMISO, {
        titulo: "Nuevo caso",
        resumen: "r",
        publicado: false,
      }),
    ).rejects.toThrow(NoAutorizado);
  });

  it("crearCaso crea el caso sin testimonio y no aparece en listarCasosPublicados si no está publicado", async () => {
    const creado = await api.crearCaso(PERSONA_CON_PERMISO, {
      titulo: "Caso sin autorizar todavía",
      resumen: "r",
      publicado: false,
    });
    expect(creado.testimonio).toBeNull();

    const publicados = await api.listarCasosPublicados();
    expect(publicados.map((c) => c.id)).not.toContain(creado.id);
  });

  it("actualizarCaso agrega el testimonio y publicado:true lo saca a listarCasosPublicados", async () => {
    const creado = await api.crearCaso(PERSONA_CON_PERMISO, {
      titulo: "Caso a publicar",
      resumen: "r",
      publicado: false,
    });

    await api.actualizarCaso(PERSONA_CON_PERMISO, creado.id, {
      testimonio: "Nos cambió la forma de trabajar.",
      autor: "Ana Pérez",
      cargoAutor: "Gerenta de operaciones",
      publicado: true,
    });

    const publicados = await api.listarCasosPublicados();
    const actualizado = publicados.find((c) => c.id === creado.id);
    expect(actualizado?.testimonio).toBe("Nos cambió la forma de trabajar.");
    expect(actualizado?.autor).toBe("Ana Pérez");
  });

  it("actualizarCaso tira NoAutorizado sin la capacidad", async () => {
    const creado = await api.crearCaso(PERSONA_CON_PERMISO, {
      titulo: "Protegido",
      resumen: "r",
      publicado: false,
    });

    await expect(
      api.actualizarCaso(PERSONA_SIN_PERMISO, creado.id, {
        titulo: "Hackeado",
      }),
    ).rejects.toThrow(NoAutorizado);
  });
});
