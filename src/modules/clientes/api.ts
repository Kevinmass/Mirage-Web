import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { registrarEvento } from "@/kernel/auditoria/registro";
import { esViolacionDeUnicidad } from "@/kernel/db-utils";
import { publicar } from "@/kernel/eventos/bus";
import { Conflicto, NoEncontrado } from "@/kernel/errores";
import {
  crearPersona,
  obtenerPersona,
  obtenerPersonaPorEmail,
} from "@/kernel/identidad/personas";
import { persona } from "@/kernel/identidad/schema";
import { obtenerNodo, obtenerTitularDeNodo } from "@/kernel/organigrama/arbol";
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
    const destinatarioPersonaId = await obtenerTitularDeNodo(
      datos.nodoResponsableId,
    );
    await publicar("cliente.creado", {
      clienteId: creado!.id,
      nombre: creado!.nombre,
      destinatarioPersonaId,
    });
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
  usuarioId: string | null;
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
      usuarioId: persona.usuarioId,
    })
    .from(clientesContacto)
    .innerJoin(persona, eq(persona.id, clientesContacto.personaId))
    .where(eq(clientesContacto.clienteId, clienteId));
}

// La pieza de la que depende el aislamiento del portal (diseño §8,
// PR 7.1): dado el personaId de una sesión de contacto_cliente, a qué
// cliente pertenece. null si esa persona no es contacto de ningún
// cliente (no debería tener sesión de portal en ese caso, pero esta
// función no asume eso — solo responde la pregunta). Nunca hay
// ambigüedad: clientes_contacto_persona_unica garantiza como mucho una
// fila.
export async function obtenerClienteDeContacto(
  personaId: number,
): Promise<number | null> {
  const [fila] = await db
    .select({ clienteId: clientesContacto.clienteId })
    .from(clientesContacto)
    .where(eq(clientesContacto.personaId, personaId));
  return fila?.clienteId ?? null;
}

export interface DatosContacto {
  email: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  cargo?: string;
  esPrincipal?: boolean;
}

// Alta de contacto (diseño, PR 4.3): reusa la persona si ya existe por
// email, si no la crea de tipo contacto_cliente. Un contacto se crea
// sin usuario_id — sin acceso al portal; invitarlo es una acción
// aparte, de la fase 7.
export async function crearContacto(clienteId: number, datos: DatosContacto) {
  await obtenerCliente(clienteId);

  const existente = await obtenerPersonaPorEmail(datos.email);
  if (existente && existente.tipo !== "contacto_cliente") {
    throw new Conflicto(
      `La persona con email "${datos.email}" ya existe como empleado, no puede agregarse como contacto de cliente`,
    );
  }
  const personaDelContacto =
    existente ??
    (await crearPersona({
      nombre: datos.nombre,
      apellido: datos.apellido,
      email: datos.email,
      telefono: datos.telefono,
      tipo: "contacto_cliente",
    }));

  try {
    const [creado] = await db
      .insert(clientesContacto)
      .values({
        clienteId,
        personaId: personaDelContacto.id,
        cargo: datos.cargo,
        esPrincipal: datos.esPrincipal ?? false,
      })
      .returning();
    return creado!;
  } catch (error) {
    if (esViolacionDeUnicidad(error)) {
      throw new Conflicto(
        `${personaDelContacto.nombre} ${personaDelContacto.apellido} ya es contacto de este cliente`,
      );
    }
    throw error;
  }
}

export interface DatosInteraccion {
  personaId: number;
  tipo: "llamada" | "mail" | "reunion" | "whatsapp" | "otro";
  resumen: string;
}

export async function registrarInteraccion(
  clienteId: number,
  datos: DatosInteraccion,
) {
  await obtenerCliente(clienteId);
  await obtenerPersona(datos.personaId);

  const [creada] = await db
    .insert(clientesInteraccion)
    .values({ clienteId, ...datos })
    .returning();
  await registrarEvento({
    personaId: datos.personaId,
    accion: "clientes.interaccion.registrada",
    entidad: "clientes_interaccion",
    entidadId: creada!.id,
    datos: { clienteId, tipo: datos.tipo },
  });
  return creada!;
}

export interface InteraccionDeCliente {
  id: number;
  personaId: number;
  nombre: string;
  apellido: string;
  tipo: "llamada" | "mail" | "reunion" | "whatsapp" | "otro";
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
