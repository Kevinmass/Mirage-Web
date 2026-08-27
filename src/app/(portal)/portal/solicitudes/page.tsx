import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { obtenerSesionPortal } from "@/lib/sesion-portal";
import { listarSolicitudesDeCliente } from "@/modules/solicitudes/api";

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

export default async function PaginaSolicitudesPortal() {
  const sesion = await obtenerSesionPortal();
  if (!sesion) {
    return (
      <main>
        <p className="text-muted-foreground">
          Tu cuenta no está asociada a ningún cliente todavía.
        </p>
      </main>
    );
  }

  // Siempre filtrada por el clienteId de la sesión — nunca por un
  // parámetro que pueda venir de la URL (diseño §8).
  const solicitudes = await listarSolicitudesDeCliente(sesion.clienteId);

  return (
    <main className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Tus solicitudes</h1>
        <Button size="lg" render={<Link href="/portal/solicitudes/nueva" />}>
          <Plus data-icon="inline-start" />
          Nueva solicitud
        </Button>
      </div>

      {solicitudes.length === 0 ? (
        <EstadoVacio titulo="Todavía no cargaste ninguna solicitud." />
      ) : (
        <ul className="flex flex-col gap-3">
          {solicitudes.map((s) => (
            <li key={s.id}>
              <Link
                href={`/portal/solicitudes/${s.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary"
              >
                <div>
                  <p className="font-medium">{s.titulo}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(s.creadoEn).toLocaleDateString("es-AR")}
                  </p>
                </div>
                <Badge variant={VARIANTE_ESTADO[s.estado]}>
                  {ETIQUETA_ESTADO[s.estado]}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
