"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { cn } from "@/lib/utils";
import type { SolicitudConActividad } from "@/modules/solicitudes/api";

const ETIQUETA_ESTADO: Record<string, string> = {
  recibida: "Recibida",
  en_evaluacion: "En evaluación",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
};

const VARIANTE_ESTADO: Record<
  string,
  "outline" | "accent" | "primary" | "destructive"
> = {
  recibida: "outline",
  en_evaluacion: "accent",
  aceptada: "primary",
  rechazada: "destructive",
};

interface Props {
  solicitudes: SolicitudConActividad[];
  nombreDeCliente: Record<number, string>;
  cantidadProyectos: number;
  children: React.ReactNode;
}

// El filtro ya está implementado en el backend (§1.2 del plan de
// frontend) — esto solo lo comunica: una bandeja vacía sin explicación
// se lee como un error, no como "no estás anotado a ningún proyecto".
export function BandejaSolicitudes({
  solicitudes,
  nombreDeCliente,
  cantidadProyectos,
  children,
}: Props) {
  const pathname = usePathname();
  const enDetalle = pathname !== "/app/solicitudes";
  const idActivo = enDetalle ? Number(pathname.split("/").pop()) : null;

  // Lo que requiere atención primero, después lo más reciente — así la
  // bandeja abre mostrando arriba lo que el equipo todavía no contestó.
  const ordenadas = [...solicitudes].sort((a, b) => {
    if (a.requiereAtencion !== b.requiereAtencion) {
      return a.requiereAtencion ? -1 : 1;
    }
    return new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime();
  });

  return (
    <>
      <div
        className={cn(
          "w-full flex-col gap-3 md:sticky md:top-6 md:w-80 md:shrink-0",
          enDetalle ? "hidden md:flex" : "flex",
        )}
      >
        <div>
          <h1 className="text-2xl font-semibold">Solicitudes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {cantidadProyectos === 0
              ? "Todavía no estás anotado a ningún proyecto — no vas a ver solicitudes acá."
              : `Ves las solicitudes de tus ${cantidadProyectos} ${
                  cantidadProyectos === 1 ? "proyecto" : "proyectos"
                }.`}
          </p>
        </div>

        {ordenadas.length === 0 ? (
          <EstadoVacio titulo="No hay solicitudes para mostrar." />
        ) : (
          <ul className="flex flex-col gap-1">
            {ordenadas.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/app/solicitudes/${s.id}`}
                  className={cn(
                    "flex flex-col gap-1 rounded-md border border-transparent px-3 py-2.5 text-sm transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    idActivo === s.id && "border-border bg-secondary",
                  )}
                >
                  <span className="flex items-center gap-2">
                    {s.requiereAtencion && (
                      <span
                        aria-hidden
                        className="size-1.5 shrink-0 rounded-full bg-primary"
                      />
                    )}
                    <span
                      className={cn(
                        "truncate",
                        s.requiereAtencion ? "font-semibold" : "font-normal",
                      )}
                    >
                      {s.requiereAtencion && (
                        <span className="sr-only">Requiere atención: </span>
                      )}
                      {s.titulo}
                    </span>
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-muted-foreground">
                      {nombreDeCliente[s.clienteId] ?? "cliente"}
                    </span>
                    <Badge
                      variant={VARIANTE_ESTADO[s.estado]}
                      className="shrink-0"
                    >
                      {ETIQUETA_ESTADO[s.estado]}
                    </Badge>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        className={cn(
          "min-w-0 flex-1 flex-col",
          enDetalle ? "flex" : "hidden md:flex",
        )}
      >
        {children}
      </div>
    </>
  );
}
