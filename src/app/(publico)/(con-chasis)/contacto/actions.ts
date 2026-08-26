"use server";

import { headers } from "next/headers";
import { Resend } from "resend";
import { permitirIntento } from "@/lib/limite-de-tasa";

export interface ValoresContacto {
  nombre: string;
  email: string;
  tipoConsulta: string;
  mensaje: string;
}

export interface EstadoContacto {
  enviado?: boolean;
  error?: string;
  erroresCampo?: Partial<Record<keyof ValoresContacto, string>>;
  valores?: ValoresContacto;
}

const EMAIL_CONTACTO = "mirage.software.ar@gmail.com";
const MAXIMO_POR_VENTANA = 3;
const VENTANA_MS = 10 * 60 * 1000; // 10 minutos

async function ipDelVisitante(): Promise<string> {
  const listaCabeceras = await headers();
  const reenviada = listaCabeceras.get("x-forwarded-for");
  if (reenviada) {
    return reenviada.split(",")[0]!.trim();
  }
  return listaCabeceras.get("x-real-ip") ?? "sin-ip";
}

function validar(valores: ValoresContacto): EstadoContacto["erroresCampo"] {
  const errores: EstadoContacto["erroresCampo"] = {};
  if (!valores.nombre) errores.nombre = "Contanos tu nombre.";
  if (!valores.email) {
    errores.email = "Dejanos un email para contestarte.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valores.email)) {
    errores.email = "Ese email no parece válido.";
  }
  if (!valores.tipoConsulta) errores.tipoConsulta = "Contanos qué necesitás.";
  if (!valores.mensaje) errores.mensaje = "Falta el mensaje.";
  return Object.keys(errores).length > 0 ? errores : undefined;
}

// Server Action progresiva a propósito (§8.4): funciona con JavaScript
// deshabilitado (un <form action={...}> normal), useActionState en el
// cliente es una mejora encima, no un requisito. El envío es
// sincrónico dentro del request — a diferencia del resto de los mails
// del sistema (kernel/eventos, notificaciones), esto no es una
// notificación a un usuario del sistema con reintentos: es una acción
// puntual donde quien la dispara ya está esperando la confirmación en
// la misma pantalla.
export async function enviarContactoAction(
  _previo: EstadoContacto,
  formData: FormData,
): Promise<EstadoContacto> {
  const valores: ValoresContacto = {
    nombre: String(formData.get("nombre") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    tipoConsulta: String(formData.get("tipoConsulta") ?? "").trim(),
    mensaje: String(formData.get("mensaje") ?? "").trim(),
  };

  const erroresCampo = validar(valores);
  if (erroresCampo) {
    return { valores, erroresCampo };
  }

  const ip = await ipDelVisitante();
  if (!permitirIntento(`contacto:${ip}`, MAXIMO_POR_VENTANA, VENTANA_MS)) {
    return {
      valores,
      error:
        "Ya nos escribiste varias veces en poco tiempo. Probá de nuevo en un rato.",
    };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: "Mirage <notificaciones@miragesoftware.com.ar>",
      to: EMAIL_CONTACTO,
      replyTo: valores.email,
      subject: `Contacto — ${valores.tipoConsulta}`,
      html: [
        `<p><strong>De:</strong> ${valores.nombre} (${valores.email})</p>`,
        `<p><strong>Consulta:</strong> ${valores.tipoConsulta}</p>`,
        `<p>${valores.mensaje.replace(/\n/g, "<br>")}</p>`,
      ].join("\n"),
    });
    if (error) {
      throw new Error(error.message);
    }
  } catch {
    return {
      valores,
      error:
        "No pudimos mandar el mensaje. Probá de nuevo, o escribinos directo a " +
        EMAIL_CONTACTO,
    };
  }

  return { enviado: true };
}
