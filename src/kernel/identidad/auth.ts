import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { registrarEvento } from "@/kernel/auditoria/registro";
import { DOMINIO_CANONICO, DOMINIO_STAGING } from "@/lib/dominio";
import { cuenta, persona, sesion, usuario, verificacion } from "./schema";

// Encola un mail de identidad (reset de contraseña o verificación) para el
// usuario dado. Mismo criterio para las dos: nunca se manda dentro del
// request (diseño §6.5), esto solo escribe la fila y el worker la toma.
// import() dinámico por el mismo motivo que el resto de este archivo —
// evitar que el build de Docker evalúe módulos que necesitan env vars o la
// base antes de que existan.
async function encolarMailDeIdentidad(
  usuarioId: string,
  emailUsuario: string,
  plantilla: "auth.recuperar-password" | "auth.verificar-email",
  url: string,
) {
  const { encolarNotificacion } = await import("@/modules/notificaciones/api");
  const [personaVinculada] = await db
    .select({ id: persona.id })
    .from(persona)
    .where(eq(persona.usuarioId, usuarioId))
    .limit(1);

  if (!personaVinculada) {
    // No debería pasar: invitarPersona vincula usuarioId antes de disparar
    // cualquiera de estos mails. Si pasa igual (acción a mano contra un
    // usuario sin persona), no hay a quién notificar.
    console.error(
      `[auth] ${plantilla} para ${emailUsuario}: no hay persona vinculada, no se pudo avisar`,
    );
    return;
  }

  await encolarNotificacion({
    destinatarioPersonaId: personaVinculada.id,
    plantilla,
    datos: { url },
  });
}

// Sin validar arriba a propósito, mismo motivo que db/client.ts: este
// módulo se importa transitivamente desde la ruta de auth, que Next
// evalúa durante el build de Docker — donde todavía no hay variables de
// entorno reales (llegan recién al arrancar el contenedor). Si falta,
// que falle better-auth al primer uso real, no acá.
export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  // Un solo deploy sirve los tres dominios (ver src/lib/dominio.ts) —
  // better-auth valida el origin de cada request contra esta lista, así
  // que los tres tienen que estar, no solo el canónico.
  trustedOrigins: [
    `https://${DOMINIO_CANONICO}`,
    `https://www.${DOMINIO_CANONICO}`,
    `https://${DOMINIO_STAGING}`,
    "http://localhost:3000",
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { usuario, sesion, cuenta, verificacion },
  }),
  user: { modelName: "usuario" },
  session: { modelName: "sesion" },
  account: { modelName: "cuenta" },
  verification: { modelName: "verificacion" },
  emailAndPassword: {
    enabled: true,
    // Sin mail verificado no hay login (PR 4 de la ronda de fixes). El alta
    // sigue siendo solo por invitación; esto garantiza que la dirección que
    // tipeó quien invita sea real y esté en manos de la persona correcta.
    // El primer empleado (arranque.ts / /setup) nace verificado — en una
    // base nueva no hay Resend configurado.
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await encolarMailDeIdentidad(
        user.id,
        user.email,
        "auth.recuperar-password",
        url,
      );
    },
    // El link de invitación es un reset de contraseña. Completarlo prueba
    // que la persona controla esa casilla, así que de paso deja el mail
    // verificado: un solo mail, un solo click, hace las dos cosas (plan §5).
    // Un "olvidé mi contraseña" real también verifica de paso — clickear un
    // link que llegó a tu inbox es exactamente lo que "verificar" comprueba.
    onPasswordReset: async ({ user }) => {
      await db
        .update(usuario)
        .set({ emailVerified: true })
        .where(eq(usuario.id, user.id));
    },
  },
  emailVerification: {
    // No se auto-manda al hacer signUpEmail: el mail de invitación
    // (reset de contraseña) ya cubre el caso y no queremos dos mails.
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await encolarMailDeIdentidad(
        user.id,
        user.email,
        "auth.verificar-email",
        url,
      );
    },
  },
  databaseHooks: {
    session: {
      create: {
        // El login queda registrado en auditoría (diseño, PR 3.1). Si
        // todavía no hay una persona vinculada a este usuario (nadie
        // enlazó el alta con un ABM de personas — eso es PR 3.2), se
        // registra igual sin personaId: es nullable a propósito.
        after: async (sesionCreada) => {
          const [personaVinculada] = await db
            .select({ id: persona.id })
            .from(persona)
            .where(eq(persona.usuarioId, sesionCreada.userId))
            .limit(1);

          await registrarEvento({
            personaId: personaVinculada?.id,
            accion: "login",
            entidad: "sesion",
          });
        },
      },
    },
  },
  plugins: [nextCookies()],
});
