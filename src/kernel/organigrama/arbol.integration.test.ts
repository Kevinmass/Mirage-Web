import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Conflicto, NoEncontrado, Validacion } from "@/kernel/errores";
import { persona } from "@/kernel/identidad/schema";
import { asignacion, nodo } from "./schema";

describe("kernel/organigrama — api del árbol", () => {
  let container: StartedPostgreSqlContainer;
  let arbol: typeof import("./arbol");
  let db: (typeof import("@/db/client"))["db"];
  let client: (typeof import("@/db/client"))["client"];

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:17-alpine").start();
    process.env.DATABASE_URL = container.getConnectionUri();

    ({ db, client } = await import("@/db/client"));
    await migrate(db, { migrationsFolder: "./src/db/migrations" });

    arbol = await import("./arbol");
  });

  beforeEach(async () => {
    await db.execute(
      sql`truncate table asignacion, nodo, persona restart identity cascade`,
    );
  });

  afterAll(async () => {
    await client.end();
    await container.stop();
  });

  // Arma: raíz -> A -> B -> C (una cadena de 3 niveles bajo la raíz).
  async function armarCadena() {
    const [raiz] = await db
      .insert(nodo)
      .values({ nombre: "Interno", raiz: "interno" })
      .returning();
    const a = await arbol.crearNodo({ nombre: "A", padreId: raiz!.id });
    const b = await arbol.crearNodo({ nombre: "B", padreId: a.id });
    const c = await arbol.crearNodo({ nombre: "C", padreId: b.id });
    return { raiz: raiz!, a, b, c };
  }

  it("crearNodo exige un padre existente", async () => {
    await expect(
      arbol.crearNodo({ nombre: "Huérfano", padreId: 999_999 }),
    ).rejects.toThrow(NoEncontrado);
  });

  it("subarbol devuelve todos los descendientes sin incluir al nodo", async () => {
    const { raiz, a, b, c } = await armarCadena();

    expect((await arbol.subarbol(raiz.id)).sort()).toEqual(
      [a.id, b.id, c.id].sort(),
    );
    expect(await arbol.subarbol(c.id)).toEqual([]);
  });

  it("ancestros devuelve la cadena hacia la raíz sin incluir al nodo", async () => {
    const { raiz, a, b, c } = await armarCadena();

    const cadena = await arbol.ancestros(c.id);
    expect(cadena.map((n) => n.id)).toEqual([b.id, a.id, raiz.id]);
  });

  it("anillo es 0 en la raíz y crece con la profundidad", async () => {
    const { raiz, a, b, c } = await armarCadena();

    expect(await arbol.anillo(raiz.id)).toBe(0);
    expect(await arbol.anillo(a.id)).toBe(1);
    expect(await arbol.anillo(b.id)).toBe(2);
    expect(await arbol.anillo(c.id)).toBe(3);
  });

  it("moverNodo cambia el padre cuando no hay ciclo", async () => {
    const { raiz, a, b } = await armarCadena();

    await arbol.moverNodo(b.id, raiz.id);

    const bReleido = await arbol.obtenerNodo(b.id);
    expect(bReleido.padreId).toBe(raiz.id);
    // a ya no tiene a b como hijo.
    expect(await arbol.subarbol(a.id)).toEqual([]);
  });

  it("moverNodo rechaza mover un nodo a su propio descendiente (ciclo)", async () => {
    const { a, c } = await armarCadena();

    // Mover A (que es ancestro de C) para que cuelgue de C sería un
    // ciclo: A -> ... -> C -> A.
    await expect(arbol.moverNodo(a.id, c.id)).rejects.toThrow(Validacion);

    // No debe haber tocado la base.
    const aReleido = await arbol.obtenerNodo(a.id);
    expect(aReleido.padreId).not.toBe(c.id);
  });

  it("moverNodo rechaza que un nodo sea padre de sí mismo", async () => {
    const { a } = await armarCadena();

    await expect(arbol.moverNodo(a.id, a.id)).rejects.toThrow(Validacion);
  });

  it("archivarNodo funciona en un nodo sin hijos ni asignaciones", async () => {
    const { c } = await armarCadena();

    await arbol.archivarNodo(c.id);

    const releido = await arbol.obtenerNodo(c.id);
    expect(releido.activo).toBe(false);
    expect(releido.archivadoEn).not.toBeNull();
  });

  it("archivarNodo rechaza con Conflicto si el nodo tiene hijos activos", async () => {
    const { a, b } = await armarCadena();

    const error: unknown = await arbol
      .archivarNodo(a.id)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(Conflicto);
    expect((error as InstanceType<typeof Conflicto>).detalle).toMatchObject({
      hijosActivos: [{ id: b.id, nombre: "B" }],
    });
  });

  it("archivarNodo rechaza con Conflicto si el nodo tiene una asignación vigente", async () => {
    const { c } = await armarCadena();
    const [personaCreada] = await db
      .insert(persona)
      .values({
        nombre: "X",
        apellido: "X",
        email: "x@mirage.test",
        tipo: "empleado",
      })
      .returning();
    await db
      .insert(asignacion)
      .values({ personaId: personaCreada!.id, nodoId: c.id });

    const error: unknown = await arbol
      .archivarNodo(c.id)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(Conflicto);
    expect((error as InstanceType<typeof Conflicto>).detalle).toMatchObject({
      asignacionesVigentes: [{ personaId: personaCreada!.id }],
    });
  });

  it("archivarNodo no bloquea por un hijo que ya está archivado", async () => {
    const { a, b, c } = await armarCadena();
    // c es hoja: archivarla no tiene trabajo abierto colgando.
    await arbol.archivarNodo(c.id);
    // con c ya archivada, b no tiene hijos activos.
    await arbol.archivarNodo(b.id);

    // con b ya archivada, a no tiene hijos activos.
    await expect(arbol.archivarNodo(a.id)).resolves.toBeUndefined();
  });
});
