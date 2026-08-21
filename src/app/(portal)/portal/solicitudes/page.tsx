import Link from "next/link";
import { Button } from "@/components/ui/button";
import { obtenerSesionPortal } from "@/lib/sesion-portal";
import { listarSolicitudesDeCliente } from "@/modules/solicitudes/api";

const ETIQUETA_ESTADO: Record<string, string> = {
  recibida: "Recibida",
  en_evaluacion: "En evaluación",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
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
        <Button
          render={<Link href="/portal/solicitudes/nueva">Nueva solicitud</Link>}
        />
      </div>

      {solicitudes.length === 0 ? (
        <p className="text-muted-foreground">
          Todavía no cargaste ninguna solicitud.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {solicitudes.map((s) => (
            <li key={s.id} className="rounded-lg border bg-background p-4">
              <Link
                href={`/portal/solicitudes/${s.id}`}
                className="font-medium hover:underline"
              >
                {s.titulo}
              </Link>
              <p className="text-sm text-muted-foreground">
                {ETIQUETA_ESTADO[s.estado]} ·{" "}
                {new Date(s.creadoEn).toLocaleDateString("es-AR")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
