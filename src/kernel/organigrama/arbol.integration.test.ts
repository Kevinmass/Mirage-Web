import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Conflicto, NoEncontrado, Validacion } from "@/kernel/errores";
import { persona } from "@/kernel/identidad/schema";
import {
  capacidad,
  personaRol,
  rol,
  rolCapacidad,
} from "@/kernel/permisos/schema";
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
      sql`truncate table asignacion, nodo, persona, persona_rol, rol_capacidad, rol, capacidad restart identity cascade`,
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

  // Una segunda raíz aislada, para probar "otra rama".
  async function armarOtraRaiz() {
    const [otra] = await db
      .insert(nodo)
      .values({ nombre: "Otra raíz", raiz: "externo", padreId: null })
      .returning();
    return otra!;
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

  it("obtenerArbolCompleto trae el anillo y los ocupantes de cada nodo", async () => {
    const { raiz, a, b } = await armarCadena();
    const [titular] = await db
      .insert(persona)
      .values({
        nombre: "Titular",
        apellido: "Uno",
        email: "titular@mirage.test",
        tipo: "empleado",
      })
      .returning();
    await db
      .insert(asignacion)
      .values({ personaId: titular!.id, nodoId: a.id, esTitular: true });

    const completo = await arbol.obtenerArbolCompleto();
    const filaRaiz = completo.find((n) => n.id === raiz.id)!;
    const filaA = completo.find((n) => n.id === a.id)!;
    const filaB = completo.find((n) => n.id === b.id)!;

    expect(filaRaiz.anillo).toBe(0);
    expect(filaA.anillo).toBe(1);
    expect(filaB.anillo).toBe(2);
    expect(filaA.ocupantes).toMatchObject([
      {
        personaId: titular!.id,
        nombre: "Titular",
        apellido: "Uno",
        esTitular: true,
      },
    ]);
    expect(filaB.ocupantes).toEqual([]);
  });

  it("obtenerArbolCompleto no trae nodos archivados", async () => {
    const { c } = await armarCadena();
    await arbol.archivarNodo(c.id);

    const completo = await arbol.obtenerArbolCompleto();
    expect(completo.some((n) => n.id === c.id)).toBe(false);
  });

  it("actualizarNodo renombra sin tocar el padre", async () => {
    const { a } = await armarCadena();

    const actualizado = await arbol.actualizarNodo(a.id, {
      nombre: "A renombrado",
    });

    expect(actualizado.nombre).toBe("A renombrado");
    expect(actualizado.padreId).toBe(a.padreId);
  });

  async function crearPersonaDePrueba(email: string) {
    const [creada] = await db
      .insert(persona)
      .values({ nombre: "P", apellido: "P", email, tipo: "empleado" })
      .returning();
    return creada!;
  }

  it("asignarPersona crea la asignación vigente", async () => {
    const { a } = await armarCadena();
    const p = await crearPersonaDePrueba("asig1@mirage.test");

    const creada = await arbol.asignarPersona(p.id, a.id, false);

    expect(creada.hasta).toBeNull();
    expect(await arbol.contarNodosDeLaPersona(p.id)).toBe(1);
  });

  it("asignarPersona rechaza un segundo titular vigente con Conflicto", async () => {
    const { a } = await armarCadena();
    const p1 = await crearPersonaDePrueba("asig2@mirage.test");
    const p2 = await crearPersonaDePrueba("asig3@mirage.test");

    await arbol.asignarPersona(p1.id, a.id, true);

    await expect(arbol.asignarPersona(p2.id, a.id, true)).rejects.toThrow(
      Conflicto,
    );
  });

  it("finalizarAsignacion termina la vigencia sin borrar la fila (historial)", async () => {
    const { a } = await armarCadena();
    const p = await crearPersonaDePrueba("asig4@mirage.test");
    const creada = await arbol.asignarPersona(p.id, a.id, true);

    await arbol.finalizarAsignacion(creada.id);

    expect(await arbol.contarNodosDeLaPersona(p.id)).toBe(0);
    const [fila] = await db
      .select()
      .from(asignacion)
      .where(eq(asignacion.id, creada.id));
    expect(fila).toBeDefined();
    expect(fila!.hasta).not.toBeNull();
  });

  it("el historial de asignaciones sobrevive a mover el nodo", async () => {
    const { a, raiz } = await armarCadena();
    const p = await crearPersonaDePrueba("asig5@mirage.test");
    const creada = await arbol.asignarPersona(p.id, a.id, true);

    await arbol.moverNodo(a.id, raiz.id);

    const [fila] = await db
      .select()
      .from(asignacion)
      .where(eq(asignacion.id, creada.id));
    expect(fila).toBeDefined();
    expect(fila!.hasta).toBeNull();
    expect(await arbol.contarNodosDeLaPersona(p.id)).toBe(1);
  });

  it("contarNodosDeLaPersona cuenta varios nodos y avisa sobrecarga potencial", async () => {
    const { a, b, c } = await armarCadena();
    const p = await crearPersonaDePrueba("asig6@mirage.test");

    await arbol.asignarPersona(p.id, a.id, false);
    await arbol.asignarPersona(p.id, b.id, false);
    await arbol.asignarPersona(p.id, c.id, false);

    expect(await arbol.contarNodosDeLaPersona(p.id)).toBe(3);
  });

  it("listarNodosDeLaPersona devuelve los ids de los nodos vigentes", async () => {
    const { a, b } = await armarCadena();
    const p = await crearPersonaDePrueba("asig7@mirage.test");

    await arbol.asignarPersona(p.id, a.id, false);
    const asignacionB = await arbol.asignarPersona(p.id, b.id, false);
    await arbol.finalizarAsignacion(asignacionB.id);

    expect(await arbol.listarNodosDeLaPersona(p.id)).toEqual([a.id]);
  });

  it("obtenerTitularDeNodo devuelve null en un nodo vacante, y el id cuando hay titular", async () => {
    const { a } = await armarCadena();
    const p = await crearPersonaDePrueba("asig8@mirage.test");

    expect(await arbol.obtenerTitularDeNodo(a.id)).toBeNull();

    await arbol.asignarPersona(p.id, a.id, false);
    expect(await arbol.obtenerTitularDeNodo(a.id)).toBeNull();

    const asignacionTitular = await arbol.asignarPersona(p.id, a.id, true);
    expect(await arbol.obtenerTitularDeNodo(a.id)).toBe(p.id);

    await arbol.finalizarAsignacion(asignacionTitular.id);
    expect(await arbol.obtenerTitularDeNodo(a.id)).toBeNull();
  });

  it("nodosControladosPorPersona incluye los nodos propios y todo su subárbol", async () => {
    const { raiz, a, b, c } = await armarCadena();
    const p = await crearPersonaDePrueba("control1@mirage.test");
    await arbol.asignarPersona(p.id, a.id, false);

    const controlados = await arbol.nodosControladosPorPersona(p.id);

    expect(Array.from(controlados).sort((x, y) => x - y)).toEqual(
      [a.id, b.id, c.id].sort((x, y) => x - y),
    );
    expect(controlados.has(raiz.id)).toBe(false);
  });

  it("nodosControladosPorPersona no incluye nada fuera de la rama de la persona", async () => {
    const { b, c } = await armarCadena();
    const p = await crearPersonaDePrueba("control2@mirage.test");
    await arbol.asignarPersona(p.id, b.id, false);

    const controlados = await arbol.nodosControladosPorPersona(p.id);

    expect(controlados.has(c.id)).toBe(true);
    expect(controlados.size).toBe(2);
  });

  describe("puedeAdministrarNodo", () => {
    async function darCapacidadAdministrar(personaId: number) {
      await db
        .insert(capacidad)
        .values({
          clave: "organigrama.administrar",
          modulo: "kernel",
          descripcion: "d",
        })
        .onConflictDoNothing();
      const [r] = await db
        .insert(rol)
        .values({ nombre: `admin-org-${personaId}` })
        .returning();
      await db.insert(rolCapacidad).values({
        rolId: r!.id,
        capacidadClave: "organigrama.administrar",
      });
      await db.insert(personaRol).values({ personaId, rolId: r!.id });
    }

    it("por defecto: true solo en la rama que ocupa la persona", async () => {
      const { b, c } = await armarCadena();
      const p = await crearPersonaDePrueba("pan1@mirage.test");
      await arbol.asignarPersona(p.id, b.id, false);

      expect(await arbol.puedeAdministrarNodo(p.id, c.id)).toBe(true); // subárbol
      const otra = await armarOtraRaiz();
      expect(await arbol.puedeAdministrarNodo(p.id, otra.id)).toBe(false);
    });

    it("con organigrama.administrar: true en cualquier nodo, se ocupe o no", async () => {
      const otra = await armarOtraRaiz();
      const p = await crearPersonaDePrueba("pan2@mirage.test");
      // No ocupa ningún nodo.
      expect(await arbol.puedeAdministrarNodo(p.id, otra.id)).toBe(false);

      await darCapacidadAdministrar(p.id);
      expect(await arbol.puedeAdministrarNodo(p.id, otra.id)).toBe(true);
    });
  });
});
