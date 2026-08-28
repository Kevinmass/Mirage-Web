import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { obtenerSesionPortal } from "@/lib/sesion-portal";
import { listarProyectosDeCliente } from "@/modules/proyectos/api";

const ETIQUETA_ESTADO: Record<string, string> = {
  propuesto: "Propuesto",
  activo: "Activo",
  pausado: "Pausado",
  terminado: "Terminado",
  cancelado: "Cancelado",
};

export default async function PaginaProyectosPortal() {
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

  // Siempre filtrada por el clienteId de la sesión, y con un shape ya
  // angosto — nombre, estado, progreso, nada más (diseño §8).
  const proyectos = await listarProyectosDeCliente(sesion.clienteId);

  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-h2 font-heading font-semibold">Tus proyectos</h1>

      {proyectos.length === 0 ? (
        <EstadoVacio titulo="Todavía no hay proyectos en marcha." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {proyectos.map((p) => {
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
                    {ETIQUETA_ESTADO[p.estado]} — {porcentaje}% completado
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
    </main>
  );
}
