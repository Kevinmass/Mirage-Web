import Link from "next/link";
import {
  Bell,
  Building2,
  FolderKanban,
  Inbox,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { obtenerSesionActual } from "@/kernel/identidad/sesion";
import { tiempoRelativo } from "@/lib/tiempo-relativo";
import { cn } from "@/lib/utils";
import { listarNotificacionesDePersona } from "@/modules/notificaciones/api";
import { marcarTodasLeidasAction } from "./actions";

const ICONO_TIPO: Record<string, LucideIcon> = {
  cliente: Building2,
  proyecto: FolderKanban,
  tarea: ListChecks,
  solicitud: Inbox,
};

const ETIQUETA_TIPO: Record<string, string> = {
  cliente: "Clientes",
  proyecto: "Proyectos",
  tarea: "Tareas",
  solicitud: "Solicitudes",
};

const TIPOS = ["cliente", "proyecto", "tarea", "solicitud"];

// El historial completo (diseño §8.13): la campana muestra las últimas
// diez, acá está todo, con filtro por tipo. Cada fila es un enlace a su
// origen — nunca una notificación que informa y deja buscando dónde
// pasó.
export default async function PaginaNotificaciones({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-muted-foreground">
          Iniciá sesión para ver tus notificaciones.
        </p>
      </main>
    );
  }

  const notificaciones = await listarNotificacionesDePersona(
    sesion.personaId,
    tipo ? { tipo } : undefined,
  );
  const hayNoLeidas = notificaciones.some((n) => !n.leidaEn);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Notificaciones</h1>
        <form action={marcarTodasLeidasAction}>
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            disabled={!hayNoLeidas}
          >
            Marcar todas como leídas
          </Button>
        </form>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/app/notificaciones"
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            !tipo
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          )}
        >
          Todas
        </Link>
        {TIPOS.map((t) => (
          <Link
            key={t}
            href={`/app/notificaciones?tipo=${t}`}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              tipo === t
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            )}
          >
            {ETIQUETA_TIPO[t] ?? t}
          </Link>
        ))}
      </div>

      {notificaciones.length === 0 ? (
        <EstadoVacio
          className="mt-6"
          icono={Bell}
          titulo="No hay notificaciones."
        />
      ) : (
        <ul className="mt-6 flex flex-col gap-1">
          {notificaciones.map((n) => {
            const Icono = ICONO_TIPO[n.tipo] ?? Bell;
            const fecha = new Date(n.creadoEn);
            const contenido = (
              <span className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm">
                <Icono
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                {!n.leidaEn && (
                  <span
                    aria-hidden
                    className="size-1.5 shrink-0 rounded-full bg-primary"
                  />
                )}
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate",
                    !n.leidaEn && "font-semibold",
                  )}
                >
                  {!n.leidaEn && <span className="sr-only">Sin leer: </span>}
                  {n.texto}
                </span>
                <span
                  className="shrink-0 text-xs text-muted-foreground"
                  title={fecha.toLocaleString("es-AR")}
                >
                  {tiempoRelativo(fecha)}
                </span>
              </span>
            );
            return (
              <li key={n.id}>
                {n.href ? (
                  <Link
                    href={n.href}
                    className="block rounded-md transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {contenido}
                  </Link>
                ) : (
                  <div>{contenido}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
