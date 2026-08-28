import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { esViolacionDeUnicidad } from "@/kernel/db-utils";
import { Conflicto, NoEncontrado, Validacion } from "@/kernel/errores";
import { esTelefonoE164Valido } from "./telefono";
import { persona, usuario } from "./schema";

// Estado de acceso de una persona, derivado de si tiene usuario vinculado y
// si ese usuario tiene el mail verificado:
//   - sin_acceso: no se la invitó todavía (usuarioId null).
//   - invitada:   tiene login pero no confirmó el mail (no puede entrar).
//   - confirmada: confirmó, entra normalmente.
export type EstadoAcceso = "sin_acceso" | "invitada" | "confirmada";

export interface PersonaConAcceso {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  tipo: "empleado" | "contacto_cliente";
  usuarioId: string | null;
  activo: boolean;
  creadoEn: Date;
  estadoAcceso: EstadoAcceso;
}

function estadoAcceso(
  usuarioId: string | null,
  emailVerificado: boolean | null,
): EstadoAcceso {
  if (!usuarioId) return "sin_acceso";
  return emailVerificado ? "confirmada" : "invitada";
}

export interface DatosPersona {
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  tipo: "empleado" | "contacto_cliente";
}

function validarDatosPersona(datos: Partial<DatosPersona>) {
  if (datos.telefono && !esTelefonoE164Valido(datos.telefono)) {
    throw new Validacion(
      `Teléfono inválido: "${datos.telefono}" no está en formato E.164 (ej: +5491122334455)`,
    );
  }
}

// Listado, alta, edición y baja lógica (PR 3.2). Invitar a tener acceso
// es una acción aparte — ver invitarPersona.

export async function listarPersonas() {
  return db.select().from(persona).orderBy(persona.apellido, persona.nombre);
}

// Como listarPersonas pero con el estado de acceso de cada una (join a
// usuario por el mail verificado). La usa /app/personas para mostrar
// "sin acceso / invitada / confirmada".
export async function listarPersonasConAcceso(): Promise<PersonaConAcceso[]> {
  const filas = await db
    .select({
      p: persona,
      emailVerified: usuario.emailVerified,
    })
    .from(persona)
    .leftJoin(usuario, eq(persona.usuarioId, usuario.id))
    .orderBy(persona.apellido, persona.nombre);

  return filas.map(({ p, emailVerified }) => ({
    ...p,
    estadoAcceso: estadoAcceso(p.usuarioId, emailVerified),
  }));
}

export async function obtenerPersonaConAcceso(
  id: number,
): Promise<PersonaConAcceso> {
  const [fila] = await db
    .select({ p: persona, emailVerified: usuario.emailVerified })
    .from(persona)
    .leftJoin(usuario, eq(persona.usuarioId, usuario.id))
    .where(eq(persona.id, id));
  if (!fila) {
    throw new NoEncontrado(`No existe la persona ${id}`);
  }
  return {
    ...fila.p,
    estadoAcceso: estadoAcceso(fila.p.usuarioId, fila.emailVerified),
  };
}

export async function obtenerPersona(id: number) {
  const [fila] = await db.select().from(persona).where(eq(persona.id, id));
  if (!fila) {
    throw new NoEncontrado(`No existe la persona ${id}`);
  }
  return fila;
}

// A diferencia de obtenerPersona, no tira si no existe — la usa quien
// necesita el patrón "reusar si ya existe, si no crear" (p.ej. alta de
// contacto de cliente, PR 4.3).
export async function obtenerPersonaPorEmail(email: string) {
  const [fila] = await db
    .select()
    .from(persona)
    .where(eq(persona.email, email));
  return fila;
}

export async function crearPersona(datos: DatosPersona) {
  validarDatosPersona(datos);

  try {
    const [creada] = await db.insert(persona).values(datos).returning();
    return creada!;
  } catch (error) {
    if (esViolacionDeUnicidad(error)) {
      throw new Conflicto(
        `Ya existe una persona con el email "${datos.email}"`,
      );
    }
    throw error;
  }
}

export async function actualizarPersona(
  id: number,
  datos: Partial<DatosPersona>,
) {
  validarDatosPersona(datos);
  await obtenerPersona(id);

  try {
    const [actualizada] = await db
      .update(persona)
      .set(datos)
      .where(eq(persona.id, id))
      .returning();
    return actualizada!;
  } catch (error) {
    if (esViolacionDeUnicidad(error)) {
      throw new Conflicto(`Ya existe una persona con ese email`);
    }
    throw error;
  }
}

// Baja lógica: activo = false. Nunca se borra la fila — hay trabajo
// histórico colgando (mismo principio que los nodos del organigrama).
export async function archivarPersona(id: number) {
  await obtenerPersona(id);
  await db.update(persona).set({ activo: false }).where(eq(persona.id, id));
}

export async function invitarPersona(id: number) {
  const personaAInvitar = await obtenerPersona(id);
  if (personaAInvitar.usuarioId) {
    throw new Conflicto(`La persona ${id} ya tiene acceso`);
  }

  // No hay flujo de invitación nativo de better-auth para email+password:
  // se da de alta con una contraseña al azar que nadie conoce y se dispara
  // el mecanismo de "recuperar contraseña" para que la persona ponga la
  // suya. Un solo mail: completar ese reset también deja el mail verificado
  // (auth.ts, onPasswordReset), así que ese link sirve de invitación y de
  // confirmación a la vez. sendResetPassword (auth.ts) encola el mail real.
  const { auth } = await import("./auth");
  const contraseniaAlAzar = randomBytes(24).toString("base64url");

  const { user } = await auth.api.signUpEmail({
    body: {
      email: personaAInvitar.email,
      password: contraseniaAlAzar,
      name: `${personaAInvitar.nombre} ${personaAInvitar.apellido}`,
    },
  });

  await db
    .update(persona)
    .set({ usuarioId: user.id })
    .where(eq(persona.id, id));

  await auth.api.requestPasswordReset({
    body: {
      email: personaAInvitar.email,
      redirectTo: "/restablecer-password",
    },
  });
}

// Reenvía el mail de invitación a alguien que ya tiene login pero todavía
// no lo completó ni confirmó el mail. Es el mismo link de reset de
// contraseña — al completarlo pone su contraseña y queda verificada.
export async function reenviarInvitacion(id: number) {
  const p = await obtenerPersona(id);
  if (!p.usuarioId) {
    throw new Conflicto(
      `La persona ${id} todavía no fue invitada — usá "Invitar a tener acceso".`,
    );
  }

  const { auth } = await import("./auth");
  await auth.api.requestPasswordReset({
    body: { email: p.email, redirectTo: "/restablecer-password" },
  });
}
