import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { esViolacionDeUnicidad } from "@/kernel/db-utils";
import { Conflicto, NoEncontrado, Validacion } from "@/kernel/errores";
import { persona } from "@/kernel/identidad/schema";
import { tienePermiso } from "@/kernel/permisos/evaluar";
import { asignacion, nodo } from "./schema";

export interface DatosNodo {
  nombre: string;
  descripcion?: string;
  padreId: number;
  orden?: number;
}

export async function obtenerNodo(id: number) {
  const [fila] = await db.select().from(nodo).where(eq(nodo.id, id));
  if (!fila) {
    throw new NoEncontrado(`No existe el nodo ${id}`);
  }
  return fila;
}

// Las dos raíces no se crean acá (son un dato fijo, dos filas con
// padre_id null) — crearNodo siempre exige padreId.
export async function crearNodo(datos: DatosNodo) {
  await obtenerNodo(datos.padreId);

  const [creado] = await db
    .insert(nodo)
    .values({
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      padreId: datos.padreId,
      orden: datos.orden ?? 0,
    })
    .returning();
  return creado!;
}

export interface DatosActualizacionNodo {
  nombre?: string;
  descripcion?: string;
  orden?: number;
}

// Renombrar / cambiar descripción u orden — no toca padre_id (eso es
// moverNodo, valida el ciclo).
export async function actualizarNodo(
  id: number,
  datos: DatosActualizacionNodo,
) {
  await obtenerNodo(id);
  const [actualizado] = await db
    .update(nodo)
    .set(datos)
    .where(eq(nodo.id, id))
    .returning();
  return actualizado!;
}

// Todos los descendientes de un nodo (sin incluirlo a él).
export async function subarbol(id: number): Promise<number[]> {
  const filas = await db.execute<{ id: number }>(sql`
    WITH RECURSIVE descendientes AS (
      SELECT id FROM nodo WHERE id = ${id}
      UNION ALL
      SELECT n.id FROM nodo n
      INNER JOIN descendientes d ON n.padre_id = d.id
    )
    SELECT id FROM descendientes WHERE id != ${id}
  `);
  return filas.map((fila) => fila.id);
}

// La cadena de ancestros de un nodo, del padre inmediato hacia la raíz
// (sin incluirlo a él).
export async function ancestros(
  id: number,
): Promise<{ id: number; nombre: string }[]> {
  const filas = await db.execute<{
    id: number;
    nombre: string;
    nivel: number;
  }>(sql`
    WITH RECURSIVE cadena AS (
      SELECT id, padre_id, nombre, 0 AS nivel FROM nodo WHERE id = ${id}
      UNION ALL
      SELECT n.id, n.padre_id, n.nombre, c.nivel + 1
      FROM nodo n
      INNER JOIN cadena c ON n.id = c.padre_id
    )
    SELECT id, nombre, nivel FROM cadena WHERE id != ${id} ORDER BY nivel
  `);
  return filas.map(({ id: idFila, nombre }) => ({ id: idFila, nombre }));
}

// Profundidad en el árbol (0 en las raíces). Se calcula, no se guarda —
// ver schema.ts.
export async function anillo(id: number): Promise<number> {
  const [fila] = await db.execute<{ profundidad: number }>(sql`
    WITH RECURSIVE arbol AS (
      SELECT id, 0 AS profundidad FROM nodo WHERE padre_id IS NULL
      UNION ALL
      SELECT n.id, a.profundidad + 1
      FROM nodo n
      INNER JOIN arbol a ON n.padre_id = a.id
    )
    SELECT profundidad FROM arbol WHERE id = ${id}
  `);
  if (!fila) {
    throw new NoEncontrado(`No existe el nodo ${id}`);
  }
  return fila.profundidad;
}

export async function moverNodo(id: number, nuevoPadreId: number) {
  await obtenerNodo(id);
  await obtenerNodo(nuevoPadreId);

  if (nuevoPadreId === id) {
    throw new Validacion("Un nodo no puede ser padre de sí mismo");
  }

  const descendientes = await subarbol(id);
  if (descendientes.includes(nuevoPadreId)) {
    throw new Validacion(
      "El nuevo padre no puede pertenecer al subárbol del nodo que se mueve — crearía un ciclo",
    );
  }

  await db.update(nodo).set({ padreId: nuevoPadreId }).where(eq(nodo.id, id));
}

export interface BloqueoDeArchivado {
  hijosActivos: { id: number; nombre: string }[];
  asignacionesVigentes: { id: number; personaId: number }[];
}

// Los nodos se archivan, no se borran — hay trabajo histórico colgando
// (diseño). Rechaza si queda trabajo abierto: hijos activos o
// asignaciones vigentes, con la lista de qué reasignar primero.
export async function archivarNodo(id: number) {
  await obtenerNodo(id);

  const hijosActivos = await db
    .select({ id: nodo.id, nombre: nodo.nombre })
    .from(nodo)
    .where(sql`${nodo.padreId} = ${id} and ${nodo.activo}`);

  const asignacionesVigentes = await db
    .select({ id: asignacion.id, personaId: asignacion.personaId })
    .from(asignacion)
    .where(sql`${asignacion.nodoId} = ${id} and ${asignacion.hasta} is null`);

  if (hijosActivos.length > 0 || asignacionesVigentes.length > 0) {
    const bloqueo: BloqueoDeArchivado = { hijosActivos, asignacionesVigentes };
    throw new Conflicto(
      `El nodo ${id} tiene trabajo abierto: ${hijosActivos.length} hijo(s) activo(s) y ${asignacionesVigentes.length} asignación(es) vigente(s). Reasignar antes de archivar.`,
      bloqueo,
    );
  }

  await db
    .update(nodo)
    .set({ activo: false, archivadoEn: new Date() })
    .where(eq(nodo.id, id));
}

export async function listarRaices() {
  return db.select().from(nodo).where(isNull(nodo.padreId));
}

export interface OcupanteNodo {
  asignacionId: number;
  personaId: number;
  nombre: string;
  apellido: string;
  esTitular: boolean;
}

export interface NodoConDetalle {
  id: number;
  nombre: string;
  descripcion: string | null;
  padreId: number | null;
  raiz: "interno" | "externo" | null;
  orden: number;
  anillo: number;
  ocupantes: OcupanteNodo[];
}

// Todo el árbol activo de una vez, con el anillo de cada nodo ya
// calculado y quién lo ocupa — lo que necesita el dibujo (PR 3.5): con
// 30-100 nodos no vale la pena resolverlo nodo por nodo.
export async function obtenerArbolCompleto(): Promise<NodoConDetalle[]> {
  const nodos = await db.select().from(nodo).where(eq(nodo.activo, true));

  const anillos = await db.execute<{ id: number; profundidad: number }>(sql`
    WITH RECURSIVE arbol AS (
      SELECT id, 0 AS profundidad FROM nodo WHERE padre_id IS NULL AND activo
      UNION ALL
      SELECT n.id, a.profundidad + 1
      FROM nodo n
      INNER JOIN arbol a ON n.padre_id = a.id
      WHERE n.activo
    )
    SELECT id, profundidad FROM arbol
  `);
  const anilloPorId = new Map(anillos.map((f) => [f.id, f.profundidad]));

  const ocupantesFilas = await db
    .select({
      asignacionId: asignacion.id,
      nodoId: asignacion.nodoId,
      personaId: persona.id,
      nombre: persona.nombre,
      apellido: persona.apellido,
      esTitular: asignacion.esTitular,
    })
    .from(asignacion)
    .innerJoin(persona, eq(persona.id, asignacion.personaId))
    .where(isNull(asignacion.hasta));

  const ocupantesPorNodo = new Map<number, OcupanteNodo[]>();
  for (const fila of ocupantesFilas) {
    const lista = ocupantesPorNodo.get(fila.nodoId) ?? [];
    lista.push({
      asignacionId: fila.asignacionId,
      personaId: fila.personaId,
      nombre: fila.nombre,
      apellido: fila.apellido,
      esTitular: fila.esTitular,
    });
    ocupantesPorNodo.set(fila.nodoId, lista);
  }

  return nodos.map((n) => ({
    id: n.id,
    nombre: n.nombre,
    descripcion: n.descripcion,
    padreId: n.padreId,
    raiz: n.raiz,
    orden: n.orden,
    anillo: anilloPorId.get(n.id) ?? 0,
    ocupantes: ocupantesPorNodo.get(n.id) ?? [],
  }));
}

// Asignar una persona a un nodo, con vigencia (desde/hasta — diseño
// §4.2). Marcar titular es un caso más de esto, no una operación
// aparte: la invariante de "un titular vigente por nodo" (schema.ts) es
// la que decide si se puede.
export async function asignarPersona(
  personaId: number,
  nodoId: number,
  esTitular: boolean,
) {
  await obtenerNodo(nodoId);

  try {
    const [creada] = await db
      .insert(asignacion)
      .values({ personaId, nodoId, esTitular })
      .returning();
    return creada!;
  } catch (error) {
    if (esViolacionDeUnicidad(error)) {
      throw new Conflicto(`El nodo ${nodoId} ya tiene un titular vigente`);
    }
    throw error;
  }
}

// El nodo al que pertenece una asignación — para chequear permisos antes
// de finalizarla (que solo trae el id de la asignación).
export async function nodoIdDeAsignacion(
  asignacionId: number,
): Promise<number | null> {
  const [fila] = await db
    .select({ nodoId: asignacion.nodoId })
    .from(asignacion)
    .where(eq(asignacion.id, asignacionId));
  return fila?.nodoId ?? null;
}

// Termina la vigencia de una asignación (hasta = ahora). No se borra:
// es historial — el criterio de aceptación del PR 3.6 pide
// explícitamente que sobreviva a la reorganización del árbol.
export async function finalizarAsignacion(asignacionId: number) {
  await db
    .update(asignacion)
    .set({ hasta: new Date() })
    .where(eq(asignacion.id, asignacionId));
}

// Los nodos que ocupa una persona hoy (asignaciones vigentes) — "todo
// lo pendiente de los nodos que ocupa" (tablero de tareas, PR 5.3) sale
// de cruzar esto con tarea.nodo_responsable_id.
export async function listarNodosDeLaPersona(
  personaId: number,
): Promise<number[]> {
  const filas = await db
    .select({ nodoId: asignacion.nodoId })
    .from(asignacion)
    .where(and(eq(asignacion.personaId, personaId), isNull(asignacion.hasta)));
  return filas.map((f) => f.nodoId);
}

// Cuántos nodos ocupa una persona hoy. La pantalla de una persona lo
// muestra — ver alguien con cuatro es señal de sobrecarga (diseño,
// PR 3.6).
export async function contarNodosDeLaPersona(
  personaId: number,
): Promise<number> {
  return (await listarNodosDeLaPersona(personaId)).length;
}

// Los nodos sobre los que una persona tiene autoridad: los suyos
// propios más todo su subárbol — "estar por encima en el organigrama"
// (diseño, PR 8) es ocupar un nodo y todo lo que cuelga de él, no una
// capacidad de kernel/permisos aparte. Lo usa la UI para habilitar
// edición nodo por nodo, no una sola bandera global.
export async function nodosControladosPorPersona(
  personaId: number,
): Promise<Set<number>> {
  const propios = await listarNodosDeLaPersona(personaId);
  const controlados = new Set<number>(propios);
  for (const id of propios) {
    for (const descendienteId of await subarbol(id)) {
      controlados.add(descendienteId);
    }
  }
  return controlados;
}

// ¿Puede esta persona asignar/desasignar en este nodo? Dos caminos
// (PR 5 de la ronda de fixes):
//   - por defecto: control por árbol — ocupa el nodo o uno de sus
//     superiores (nodosControladosPorPersona).
//   - `organigrama.administrar`: saltea el árbol, cualquier nodo. Era la
//     única forma de destrabar la rama externa, que el arranque dejaba
//     sin titular.
export async function puedeAdministrarNodo(
  personaId: number,
  nodoId: number,
): Promise<boolean> {
  if (await tienePermiso(personaId, "organigrama.administrar")) {
    return true;
  }
  return (await nodosControladosPorPersona(personaId)).has(nodoId);
}

// El titular vigente de un nodo, si lo hay — null si el nodo está
// vacante (ocupado por no-titulares, o sin nadie). Lo usan los
// módulos que publican eventos (PR 6.2) para resolver a quién
// notificar sin tener que exponer eso como una llamada cruzada entre
// módulos: cada uno resuelve su propio destinatario contra el kernel
// antes de publicar.
export async function obtenerTitularDeNodo(
  nodoId: number,
): Promise<number | null> {
  const [fila] = await db
    .select({ personaId: asignacion.personaId })
    .from(asignacion)
    .where(
      and(
        eq(asignacion.nodoId, nodoId),
        eq(asignacion.esTitular, true),
        isNull(asignacion.hasta),
      ),
    );
  return fila?.personaId ?? null;
}
