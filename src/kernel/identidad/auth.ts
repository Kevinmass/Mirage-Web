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
      // Sin RESEND_API_KEY todavía (llega en la fase 6, módulo
      // notificaciones): se loguea el link en vez de perderlo. Cuando
      // ese módulo exista, esto pasa a escribir en `notificacion` en vez
      // de mandar el mail acá mismo — nunca dentro del request.
      console.log(`[auth] recuperar contraseña para ${user.email}: ${url}`);
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
