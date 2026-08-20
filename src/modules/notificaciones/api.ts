import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { NoEncontrado } from "@/kernel/errores";
import { obtenerPersona } from "@/kernel/identidad/personas";
import { enviarMail } from "./internal/resend";
import { renderizarPlantilla } from "./internal/plantillas";
import { notificacionesNotificacion } from "./schema";

const MAX_INTENTOS = 5;
// Backoff exponencial en minutos (diseño §6.5): 1, 2, 4, 8, 16.
// BACKOFF_MINUTOS[intentos - 1] = minutos de espera antes del
// próximo intento.
const BACKOFF_MINUTOS = [1, 2, 4, 8, 16];

export interface EncolarNotificacionInput {
  destinatarioPersonaId: number;
  plantilla: string;
  datos: Record<string, unknown>;
}

// Nunca se manda un mail dentro del request (diseño §6.5) — esto solo
// escribe la fila. El worker (procesarPendientes) la toma. Valida que
// el destinatario exista de entrada (mismo criterio que crearCliente
// valida su nodo/persona): un destinatario inexistente nunca se va a
// arreglar solo reintentando, así que no vale la pena encolar una
// notificación condenada a agotar el backoff entero para terminar en
// fallida igual.
export async function encolarNotificacion(input: EncolarNotificacionInput) {
  await obtenerPersona(input.destinatarioPersonaId);

  const [creada] = await db
    .insert(notificacionesNotificacion)
    .values(input)
    .returning();
  return creada!;
}

export async function obtenerNotificacion(id: number) {
  const [fila] = await db
    .select()
    .from(notificacionesNotificacion)
    .where(eq(notificacionesNotificacion.id, id));
  if (!fila) {
    throw new NoEncontrado(`No existe la notificación ${id}`);
  }
  return fila;
}

export async function listarNotificacionesFallidas() {
  return db
    .select()
    .from(notificacionesNotificacion)
    .where(eq(notificacionesNotificacion.estado, "fallida"))
    .orderBy(desc(notificacionesNotificacion.creadoEn));
}

export type Enviador = (input: {
  destinatarioEmail: string;
  asunto: string;
  html: string;
}) => Promise<void>;

// Un intento de envío. Nunca tira: en éxito pasa a 'enviada'; en
// falla, incrementa intentos y guarda el error — a los 5 intentos
// pasa a 'fallida', antes de eso queda 'pendiente' para que el
// worker la vuelva a tomar cuando corresponda según el backoff.
// Criterio de aceptación del PR: con una API key inválida, nunca se
// pierde — pendiente con intentos creciendo, y recién ahí fallida.
export async function procesarNotificacion(
  id: number,
  enviar: Enviador = enviarMail,
) {
  const notificacion = await obtenerNotificacion(id);

  try {
    const destinatario = await obtenerPersona(
      notificacion.destinatarioPersonaId,
    );
    const { asunto, html } = renderizarPlantilla(
      notificacion.plantilla,
      notificacion.datos,
    );
    await enviar({ destinatarioEmail: destinatario.email, asunto, html });

    const [actualizada] = await db
      .update(notificacionesNotificacion)
      .set({
        estado: "enviada",
        enviadoEn: new Date(),
        error: null,
        ultimoIntentoEn: new Date(),
      })
      .where(eq(notificacionesNotificacion.id, id))
      .returning();
    return actualizada!;
  } catch (error) {
    const intentos = notificacion.intentos + 1;
    const mensaje = error instanceof Error ? error.message : String(error);
    const [actualizada] = await db
      .update(notificacionesNotificacion)
      .set({
        intentos,
        error: mensaje,
        estado: intentos >= MAX_INTENTOS ? "fallida" : "pendiente",
        ultimoIntentoEn: new Date(),
      })
      .where(eq(notificacionesNotificacion.id, id))
      .returning();
    return actualizada!;
  }
}

function proximoIntentoDebido(
  notificacion: { intentos: number; ultimoIntentoEn: Date | null },
  ahora: Date,
): boolean {
  if (notificacion.intentos === 0 || !notificacion.ultimoIntentoEn) {
    return true;
  }
  const esperaMinutos =
    BACKOFF_MINUTOS[
      Math.min(notificacion.intentos - 1, BACKOFF_MINUTOS.length - 1)
    ]!;
  const proximo = new Date(
    notificacion.ultimoIntentoEn.getTime() + esperaMinutos * 60_000,
  );
  return proximo <= ahora;
}

// El worker (job en proceso, instrumentation.ts): toma las
// 'pendiente' a las que ya les toca reintento según el backoff — no
// reintenta antes de tiempo solo porque el job corrió.
export async function procesarPendientes(
  enviar: Enviador = enviarMail,
): Promise<void> {
  const candidatas = await db
    .select()
    .from(notificacionesNotificacion)
    .where(eq(notificacionesNotificacion.estado, "pendiente"));

  const ahora = new Date();
  for (const notificacion of candidatas) {
    if (proximoIntentoDebido(notificacion, ahora)) {
      await procesarNotificacion(notificacion.id, enviar);
    }
  }
}

// Reintento manual (PR 6.3): vuelve una 'fallida' a 'pendiente' y la
// procesa ya mismo, sin esperar al worker ni al backoff.
export async function reintentarNotificacion(
  id: number,
  enviar: Enviador = enviarMail,
) {
  await obtenerNotificacion(id);
  await db
    .update(notificacionesNotificacion)
    .set({ estado: "pendiente" })
    .where(eq(notificacionesNotificacion.id, id));
  return procesarNotificacion(id, enviar);
}
