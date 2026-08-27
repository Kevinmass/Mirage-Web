import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { obtenerSesionPortal } from "@/lib/sesion-portal";
import { obtenerCliente } from "@/modules/clientes/api";
import { listarProyectosDeCliente } from "@/modules/proyectos/api";
import { listarSolicitudesDeCliente } from "@/modules/solicitudes/api";

const ETIQUETA_ESTADO_PROYECTO: Record<string, string> = {
  propuesto: "Propuesto",
  activo: "Activo",
  pausado: "Pausado",
  terminado: "Terminado",
  cancelado: "Cancelado",
};

const ETIQUETA_ESTADO_SOLICITUD: Record<string, string> = {
  recibida: "Recibida",
  en_evaluacion: "En evaluación",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
};

const VARIANTE_ESTADO_SOLICITUD: Record<
  string,
  "outline" | "accent" | "primary" | "destructive"
> = {
  recibida: "outline",
  en_evaluacion: "accent",
  aceptada: "primary",
  rechazada: "destructive",
};

export default async function PaginaPortal() {
  const sesion = await obtenerSesionPortal();
  // decidirAcceso ya exige tipo contacto_cliente para llegar acá; si
  // sesion es null es porque esa persona no es contacto de ningún
  // cliente todavía (dato inconsistente, no un caso normal) — no hay
  // nada seguro que mostrar.
  if (!sesion) {
    return (
      <main>
        <p className="text-muted-foreground">
          Tu cuenta no está asociada a ningún cliente todavía.
        </p>
      </main>
    );
  }

  const [cliente, proyectos, solicitudes] = await Promise.all([
    obtenerCliente(sesion.clienteId),
    listarProyectosDeCliente(sesion.clienteId),
    listarSolicitudesDeCliente(sesion.clienteId),
  ]);
  const abiertas = solicitudes.filter((s) => s.resueltoEn === null);

  return (
    <main className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-h2 font-heading font-semibold">
          Hola, {cliente.nombre}
        </h1>
        <p className="text-lg text-muted-foreground">
          Acá vas a poder cargar solicitudes y ver el progreso de tus proyectos.
        </p>
      </div>

      <Button
        size="lg"
        className="self-start"
        render={<Link href="/portal/solicitudes/nueva" />}
      >
        <Plus data-icon="inline-start" />
        Nueva solicitud
      </Button>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-h3 font-heading font-semibold">Tus proyectos</h2>
          <Link
            href="/portal/proyectos"
            className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Ver todos
          </Link>
        </div>

        {proyectos.length === 0 ? (
          <EstadoVacio titulo="Todavía no hay proyectos en marcha." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {proyectos.slice(0, 4).map((p) => {
              const porcentaje =
                p.totales === 0 ? 0 : Math.round((p.hechas / p.totales) * 100);
              return (
                <Card key={p.id}>
                  <CardHeader>
                    <CardTitle>
                      <Link
                        href={`/portal/proyectos/${p.id}`}
                        className="hover:underline"
                      >
                        {p.nombre}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {ETIQUETA_ESTADO_PROYECTO[p.estado]} — {porcentaje}%
                      completado
                    </p>
                    <div className="mt-2 h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-h3 font-heading font-semibold">
            Tus solicitudes abiertas
          </h2>
          <Link
            href="/portal/solicitudes"
            className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Ver todas
          </Link>
        </div>

        {abiertas.length === 0 ? (
          <EstadoVacio titulo="No tenés solicitudes abiertas." />
        ) : (
          <ul className="flex flex-col gap-3">
            {abiertas.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/portal/solicitudes/${s.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary"
                >
                  <span className="font-medium">{s.titulo}</span>
                  <Badge variant={VARIANTE_ESTADO_SOLICITUD[s.estado]}>
                    {ETIQUETA_ESTADO_SOLICITUD[s.estado]}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
