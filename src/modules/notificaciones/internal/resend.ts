import { Resend } from "resend";

export interface EnviarMailInput {
  destinatarioEmail: string;
  asunto: string;
  html: string;
}

// Sin RESEND_API_KEY el envío falla con un error claro en vez de
// romper el arranque — mismo principio que DATABASE_URL o
// BETTER_AUTH_SECRET: no se valida al importar el módulo, se ve
// recién al intentar mandar el primer mail (y ese fallo es
// exactamente el que dispara el backoff — diseño §6.5).
export async function enviarMail(input: EnviarMailInput): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: "Mirage <notificaciones@miragesoftware.com.ar>",
    to: input.destinatarioEmail,
    subject: input.asunto,
    html: input.html,
  });
  if (error) {
    throw new Error(`Resend rechazó el envío: ${error.message}`);
  }
}
