import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { persona } from "./schema";

export type TipoPersona = "empleado" | "contacto_cliente";

export interface Sesion {
  personaId: number;
  tipo: TipoPersona;
  // Solo tiene sentido cuando tipo === "contacto_cliente".
  clienteId?: number;
}

// Lee la sesión real de better-auth (PR 3.1) y la resuelve a la persona
// vinculada. Sin persona vinculada no hay Sesion utilizable acá — un
// usuario de better-auth sin persona todavía no es nadie para el resto
// del sistema (kernel/permisos, las reglas de superficie).
//
// import() dinámico de auth.ts en vez de uno estático arriba del
// archivo: auth.ts importa @/db/client, y este módulo lo usa desde
// proxy.ts, que Next evalúa también en build — mismo motivo que
// db/client.ts y auth.ts no validan sus variables de entorno arriba.
export async function obtenerSesion(request: Request): Promise<Sesion | null> {
  const { auth } = await import("./auth");
  const sesionAuth = await auth.api.getSession({ headers: request.headers });
  if (!sesionAuth) {
    return null;
  }

  const [personaVinculada] = await db
    .select({ id: persona.id, tipo: persona.tipo })
    .from(persona)
    .where(eq(persona.usuarioId, sesionAuth.user.id))
    .limit(1);

  if (!personaVinculada) {
    return null;
  }

  return {
    personaId: personaVinculada.id,
    tipo: personaVinculada.tipo,
    // clienteId: llega con el módulo clientes (fase 4) — el contacto
    // directo de un cliente vincula persona a cliente_id.
  };
}

// Para Server Components, que no reciben un Request como proxy.ts —
// arma uno con los headers de la request actual (next/headers) y
// delega en obtenerSesion. Primer uso: el tablero de tareas (PR 5.3)
// necesita saber quién está mirando la pantalla para "mis tareas".
export async function obtenerSesionActual(): Promise<Sesion | null> {
  const { headers } = await import("next/headers");
  return obtenerSesion(
    new Request("http://localhost", { headers: await headers() }),
  );
}
