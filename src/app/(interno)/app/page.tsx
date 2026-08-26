import { Suspense } from "react";
import { CardDato } from "@/components/ui/card-dato";
import { TableroCargando } from "@/components/ui/tablero-cargando";
import { obtenerSesionActual } from "@/kernel/identidad/sesion";
import { listarPersonas } from "@/kernel/identidad/personas";
import { listarProyectos, listarTareas } from "@/modules/proyectos/api";
import { listarSolicitudes } from "@/modules/solicitudes/api";
import { ActividadReciente } from "./_tablero/actividad-reciente";
import { MisTareasHoy } from "./_tablero/mis-tareas-hoy";
import { OrganigramaMini } from "./_tablero/organigrama-mini";
import { SolicitudesQueMeEsperan } from "./_tablero/solicitudes-que-me-esperan";

// El tablero de /app (§8.6 del sistema visual, PR 7): fila de
// CardDato, tres columnas, miniatura del organigrama al pie. Es la
// pantalla que se ve más veces por día — cada columna tiene su propio
// Suspense para que la más lenta no bloquee a las otras dos.
export default async function PaginaInterna() {
  const sesion = await obtenerSesionActual();
  const personaId = sesion?.personaId;

  const [proyectos, tareasPropias, solicitudesSinResponder, personas] =
    await Promise.all([
      listarProyectos().catch(() => []),
      personaId
        ? listarTareas({
            personaAsignadaId: personaId,
            excluirHechas: true,
          }).catch(() => [])
        : Promise.resolve([]),
      listarSolicitudes({ estado: "recibida" }).catch(() => []),
      listarPersonas().catch(() => []),
    ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-semibold">Inicio</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CardDato
          etiqueta="Proyectos activos"
          valor={proyectos.filter((p) => p.estado === "activo").length}
          href="/app/proyectos"
        />
        <CardDato
          etiqueta="Mis tareas abiertas"
          valor={tareasPropias.length}
          href="/app/tareas"
        />
        <CardDato
          etiqueta="Solicitudes sin responder"
          valor={solicitudesSinResponder.length}
          href="/app/solicitudes"
        />
        <CardDato
          etiqueta="Personas"
          valor={personas.length}
          href="/app/personas"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            Mis tareas de hoy
          </h2>
          <div className="rounded-xl border border-border bg-card p-2">
            <Suspense fallback={<TableroCargando />}>
              {personaId ? (
                <MisTareasHoy personaId={personaId} />
              ) : (
                <p className="p-4 text-sm text-muted-foreground">
                  No se pudo identificar tu sesión.
                </p>
              )}
            </Suspense>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            Actividad reciente
          </h2>
          <div className="rounded-xl border border-border bg-card p-2">
            <Suspense fallback={<TableroCargando />}>
              <ActividadReciente />
            </Suspense>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            Solicitudes que me esperan
          </h2>
          <div className="rounded-xl border border-border bg-card p-2">
            <Suspense fallback={<TableroCargando />}>
              <SolicitudesQueMeEsperan />
            </Suspense>
          </div>
        </section>
      </div>

      <div className="mt-8">
        <Suspense fallback={<TableroCargando />}>
          <OrganigramaMini />
        </Suspense>
      </div>
    </main>
  );
}
