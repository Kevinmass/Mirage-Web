import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { registrarEvento } from "@/kernel/auditoria/registro";
import { DOMINIO_CANONICO, DOMINIO_STAGING } from "@/lib/dominio";
import { cuenta, persona, sesion, usuario, verificacion } from "./schema";

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
    sendResetPassword: async ({ user, url }) => {
      // Nunca se manda un mail dentro del request (diseño §6.5): esto
      // encola, el worker de notificaciones lo toma. import() dinámico
      // por el mismo motivo que el resto de este archivo — evitar que
      // el build de Docker evalúe módulos que necesitan env vars o la
      // base antes de que existan.
      const { encolarNotificacion } =
        await import("@/modules/notificaciones/api");
      const [personaVinculada] = await db
        .select({ id: persona.id })
        .from(persona)
        .where(eq(persona.usuarioId, user.id))
        .limit(1);

      if (!personaVinculada) {
        // No debería pasar: invitarPersona vincula usuarioId antes de
        // pedir el reset. Si pasa igual (reset a mano contra un
        // usuario sin persona), no hay a quién notificar — se loguea
        // y listo, no hay forma de encolar sin destinatario.
        console.error(
          `[auth] recuperar contraseña para ${user.email}: no hay persona vinculada, no se pudo avisar`,
        );
        return;
      }

      await encolarNotificacion({
        destinatarioPersonaId: personaVinculada.id,
        plantilla: "auth.recuperar-password",
        datos: { url },
      });
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
