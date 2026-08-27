import { AlertTriangle } from "lucide-react";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { obtenerPersona } from "@/kernel/identidad/personas";
import { listarNotificacionesFallidas } from "@/modules/notificaciones/api";
import { BotonReintentar } from "./boton-reintentar";

// Movido de /app/notificaciones a /app/ajustes/notificaciones (PR 12,
// diseño §8.13) — la campana y el historial de /app/notificaciones son
// ahora el feed en pantalla de cada persona; esto sigue siendo la
// administración de la cola de mails, para cualquier empleado, no por
// destinatario.
//
// Criterio de aceptación (PR 6.3): una notificación fallida es
// visible sin abrir la base de datos. Una falla que solo se ve en la
// base es una falla que nadie ve.
export default async function PaginaAjustesNotificaciones() {
  const fallidas = await listarNotificacionesFallidas();
  const conDestinatario = await Promise.all(
    fallidas.map(async (n) => ({
      ...n,
      destinatario: await obtenerPersona(n.destinatarioPersonaId).catch(
        () => null,
      ),
    })),
  );

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <p className="text-sm text-muted-foreground">Ajustes</p>
      <h1 className="text-2xl font-semibold">Notificaciones fallidas</h1>
      <p className="text-sm text-muted-foreground">
        Después de 5 intentos con backoff exponencial, una notificación pasa a
        fallida y queda acá para reintentar a mano.
      </p>

      {conDestinatario.length === 0 ? (
        <EstadoVacio
          className="mt-6"
          icono={AlertTriangle}
          titulo="No hay notificaciones fallidas."
        />
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {conDestinatario.map((n) => (
            <li
              key={n.id}
              className="rounded-md border border-border p-3 text-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{n.plantilla}</span>
                <span className="text-xs text-muted-foreground">
                  {n.intentos} intentos
                </span>
              </div>
              <p className="text-muted-foreground">
                Para:{" "}
                {n.destinatario
                  ? `${n.destinatario.nombre} ${n.destinatario.apellido} (${n.destinatario.email})`
                  : `persona ${n.destinatarioPersonaId} (no existe)`}
              </p>
              <p className="mt-1 text-destructive">{n.error}</p>
              <p className="text-xs text-muted-foreground">
                Último intento:{" "}
                {n.ultimoIntentoEn
                  ? new Date(n.ultimoIntentoEn).toLocaleString("es-AR")
                  : "—"}
              </p>
              <div className="mt-2">
                <BotonReintentar id={n.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
