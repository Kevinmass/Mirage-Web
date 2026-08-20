import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { esViolacionDeUnicidad } from "@/kernel/db-utils";
import { publicar } from "@/kernel/eventos/bus";
import { Conflicto, NoEncontrado } from "@/kernel/errores";
import { obtenerPersona } from "@/kernel/identidad/personas";
import { persona } from "@/kernel/identidad/schema";
import { obtenerNodo } from "@/kernel/organigrama/arbol";
import {
  clientesCliente,
  clientesContacto,
  clientesInteraccion,
} from "./schema";

export interface DatosCliente {
  nombre: string;
  cuit: string;
  nodoResponsableId: number;
  contactoDirectoId: number;
}

export async function listarClientes() {
  return db.select().from(clientesCliente).orderBy(clientesCliente.nombre);
}

export async function obtenerCliente(id: number) {
  const [fila] = await db
    .select()
    .from(clientesCliente)
    .where(eq(clientesCliente.id, id));
  if (!fila) {
    throw new NoEncontrado(`No existe el cliente ${id}`);
  }
  return fila;
}

// Criterio de aceptación de 4.1: no se puede crear un cliente sin nodo
// responsable ni sin contacto directo. Ambos son NOT NULL en el schema,
// pero acá además se valida que existan de verdad, igual que crearNodo
// valida su padreId.
export async function crearCliente(datos: DatosCliente) {
  await obtenerNodo(datos.nodoResponsableId);
  await obtenerPersona(datos.contactoDirectoId);

  try {
    const [creado] = await db.insert(clientesCliente).values(datos).returning();
    await publicar("cliente.creado", { clienteId: creado!.id });
    return creado!;
  } catch (error) {
    if (esViolacionDeUnicidad(error)) {
      throw new Conflicto(`Ya existe un cliente con el CUIT "${datos.cuit}"`);
    }
    throw error;
  }
}

export async function actualizarCliente(
  id: number,
  datos: Partial<DatosCliente>,
) {
  await obtenerCliente(id);
  if (datos.nodoResponsableId !== undefined) {
    await obtenerNodo(datos.nodoResponsableId);
  }
  if (datos.contactoDirectoId !== undefined) {
    await obtenerPersona(datos.contactoDirectoId);
  }

  try {
    const [actualizado] = await db
      .update(clientesCliente)
      .set(datos)
      .where(eq(clientesCliente.id, id))
      .returning();
    return actualizado!;
  } catch (error) {
    if (esViolacionDeUnicidad(error)) {
      throw new Conflicto(`Ya existe un cliente con ese CUIT`);
    }
    throw error;
  }
}

// Baja lógica: estado = 'inactivo'. Nunca se borra la fila — mismo
// principio que persona y nodo.
export async function archivarCliente(id: number) {
  await obtenerCliente(id);
  await db
    .update(clientesCliente)
    .set({ estado: "inactivo" })
    .where(eq(clientesCliente.id, id));
}

export interface ContactoDeCliente {
  id: number;
  personaId: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  cargo: string | null;
  esPrincipal: boolean;
}

export async function listarContactosDeCliente(
  clienteId: number,
): Promise<ContactoDeCliente[]> {
  return db
    .select({
      id: clientesContacto.id,
      personaId: persona.id,
      nombre: persona.nombre,
      apellido: persona.apellido,
      email: persona.email,
      telefono: persona.telefono,
      cargo: clientesContacto.cargo,
      esPrincipal: clientesContacto.esPrincipal,
    })
    .from(clientesContacto)
    .innerJoin(persona, eq(persona.id, clientesContacto.personaId))
    .where(eq(clientesContacto.clienteId, clienteId));
}

export interface InteraccionDeCliente {
  id: number;
  personaId: number;
  nombre: string;
  apellido: string;
  tipo: "llamada" | "mail" | "reunion" | "otro";
  fecha: Date;
  resumen: string;
}

export async function listarInteraccionesDeCliente(
  clienteId: number,
): Promise<InteraccionDeCliente[]> {
  return db
    .select({
      id: clientesInteraccion.id,
      personaId: persona.id,
      nombre: persona.nombre,
      apellido: persona.apellido,
      tipo: clientesInteraccion.tipo,
      fecha: clientesInteraccion.fecha,
      resumen: clientesInteraccion.resumen,
    })
    .from(clientesInteraccion)
    .innerJoin(persona, eq(persona.id, clientesInteraccion.personaId))
    .where(eq(clientesInteraccion.clienteId, clienteId))
    .orderBy(desc(clientesInteraccion.fecha));
}
