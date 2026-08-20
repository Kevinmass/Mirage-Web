import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { esViolacionDeUnicidad } from "@/kernel/db-utils";
import { Conflicto, NoEncontrado, Validacion } from "@/kernel/errores";
import { esTelefonoE164Valido } from "./telefono";
import { persona } from "./schema";

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

export async function obtenerPersona(id: number) {
  const [fila] = await db.select().from(persona).where(eq(persona.id, id));
  if (!fila) {
    throw new NoEncontrado(`No existe la persona ${id}`);
  }
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
  // se da de alta con una contraseña al azar que nadie conoce y se
  // dispara el mismo mecanismo de "recuperar contraseña" para que la
  // persona ponga la suya. sendResetPassword loguea el link (auth.ts) —
  // cuando exista notificaciones (fase 6) esto manda un mail real.
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
    body: { email: personaAInvitar.email },
  });
}
