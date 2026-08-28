import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { esViolacionDeUnicidad } from "@/kernel/db-utils";
import { Conflicto, NoEncontrado, Validacion } from "@/kernel/errores";
import { capacidad, personaRol, rol, rolCapacidad } from "./schema";

// ABM de roles y de sus capacidades, y asignación de roles a personas
// (PR 5 de la ronda de fixes). Lo que antes obligaba a tocar la base a
// mano. Los chequeos de permiso (`identidad.administrar`) los hace quien
// llama — las Server Actions de /app/roles y /app/personas/[id].

export interface Rol {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export interface Capacidad {
  clave: string;
  modulo: string;
  descripcion: string;
  huerfana: boolean;
}

export async function listarRoles(): Promise<Rol[]> {
  return db.select().from(rol).orderBy(rol.nombre);
}

export async function obtenerRol(id: number): Promise<Rol> {
  const [fila] = await db.select().from(rol).where(eq(rol.id, id));
  if (!fila) throw new NoEncontrado(`No existe el rol ${id}`);
  return fila;
}

export async function listarCapacidades(): Promise<Capacidad[]> {
  return db.select().from(capacidad).orderBy(capacidad.clave);
}

export async function capacidadesDeRol(rolId: number): Promise<string[]> {
  const filas = await db
    .select({ clave: rolCapacidad.capacidadClave })
    .from(rolCapacidad)
    .where(eq(rolCapacidad.rolId, rolId));
  return filas.map((f) => f.clave);
}

export async function crearRol(nombre: string, descripcion?: string) {
  const limpio = nombre.trim();
  if (!limpio) throw new Validacion("El nombre del rol es obligatorio.");
  try {
    const [creado] = await db
      .insert(rol)
      .values({ nombre: limpio, descripcion: descripcion?.trim() || null })
      .returning();
    return creado!;
  } catch (error) {
    if (esViolacionDeUnicidad(error)) {
      throw new Conflicto(`Ya existe un rol llamado "${limpio}".`);
    }
    throw error;
  }
}

// Reemplaza el conjunto completo de capacidades de un rol por el que se
// pasa. Es lo que manda un formulario de checkboxes: la lista final, no
// deltas.
export async function fijarCapacidadesDeRol(
  rolId: number,
  claves: string[],
): Promise<void> {
  await obtenerRol(rolId);

  const validas = new Set(
    (await db.select({ clave: capacidad.clave }).from(capacidad)).map(
      (c) => c.clave,
    ),
  );
  const deseadas = [...new Set(claves)].filter((c) => validas.has(c));

  await db.transaction(async (tx) => {
    await tx.delete(rolCapacidad).where(eq(rolCapacidad.rolId, rolId));
    if (deseadas.length > 0) {
      await tx
        .insert(rolCapacidad)
        .values(deseadas.map((clave) => ({ rolId, capacidadClave: clave })));
    }
  });
}

export async function rolesDePersona(personaId: number): Promise<Rol[]> {
  return db
    .select({ id: rol.id, nombre: rol.nombre, descripcion: rol.descripcion })
    .from(personaRol)
    .innerJoin(rol, eq(personaRol.rolId, rol.id))
    .where(eq(personaRol.personaId, personaId))
    .orderBy(rol.nombre);
}

export async function asignarRolAPersona(personaId: number, rolId: number) {
  await obtenerRol(rolId);
  await db
    .insert(personaRol)
    .values({ personaId, rolId })
    .onConflictDoNothing();
}

export async function quitarRolDePersona(personaId: number, rolId: number) {
  await db
    .delete(personaRol)
    .where(
      and(eq(personaRol.personaId, personaId), eq(personaRol.rolId, rolId)),
    );
}
