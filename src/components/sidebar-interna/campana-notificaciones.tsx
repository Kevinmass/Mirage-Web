"use client";

import Link from "next/link";
import {
  Bell,
  Building2,
  FolderKanban,
  Inbox,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { tiempoRelativo } from "@/lib/tiempo-relativo";
import { cn } from "@/lib/utils";
import { marcarTodasLeidasAction } from "@/app/(interno)/app/notificaciones/actions";
import type { NotificacionParaMostrar } from "@/modules/notificaciones/api";

const ICONO_TIPO: Record<string, LucideIcon> = {
  cliente: Building2,
  proyecto: FolderKanban,
  tarea: ListChecks,
  solicitud: Inbox,
};

interface Props {
  conteoNoLeidas: number;
  ultimas: NotificacionParaMostrar[];
}

// Campana del header (diseño §8.13): contador + panel con las últimas
// diez. Los datos llegan ya resueltos del servidor (layout.tsx) porque
// /app es force-dynamic — no hace falta polling, cada navegación
// vuelve a traer el conteo real.
export function CampanaNotificaciones({ conteoNoLeidas, ultimas }: Props) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label={
          conteoNoLeidas > 0
            ? `Notificaciones — ${conteoNoLeidas} sin leer`
            : "Notificaciones"
        }
        className="relative inline-flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Bell className="size-5" aria-hidden />
        {conteoNoLeidas > 0 && (
          <span
            aria-hidden
            className="absolute top-2 right-2 flex size-4 items-center justify-center rounded-full bg-primary text-[0.6rem] font-medium text-primary-foreground"
          >
            {conteoNoLeidas > 9 ? "9+" : conteoNoLeidas}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-medium">Notificaciones</span>
          {conteoNoLeidas > 0 && (
            <form action={marcarTodasLeidasAction}>
              <button
                type="submit"
                className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Marcar todas como leídas
              </button>
            </form>
          )}
        </div>

        {ultimas.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            No hay notificaciones.
          </p>
        ) : (
          <ul className="flex max-h-96 flex-col overflow-y-auto py-1">
            {ultimas.map((n) => {
              const Icono = ICONO_TIPO[n.tipo] ?? Bell;
              const fecha = new Date(n.creadoEn);
              const contenido = (
                <span className="flex items-center gap-3 px-4 py-2.5 text-sm">
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
                      className="block transition-colors hover:bg-secondary"
                    >
                      {contenido}
                    </Link>
                  ) : (
                    contenido
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="border-t border-border p-2">
          <Link
            href="/app/notificaciones"
            className="block rounded-md px-2 py-2 text-center text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Ver todas
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
