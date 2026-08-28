import { BarraSuperiorMovil } from "@/components/sidebar-interna/barra-superior-movil";
import { CampanaNotificaciones } from "@/components/sidebar-interna/campana-notificaciones";
import { SidebarInterna } from "@/components/sidebar-interna/sidebar-interna";
import { Button } from "@/components/ui/button";
import { obtenerSesionActual } from "@/kernel/identidad/sesion";
import { cerrarSesionAction } from "@/lib/cerrar-sesion-action";
import { leerSidebarColapsada } from "@/lib/sidebar-interna-actions";
import {
  contarNoLeidasDePersona,
  listarUltimasNotificaciones,
} from "@/modules/notificaciones/api";

// /app tiene sesión: todo lo que haya debajo muestra datos por
// persona/por momento, nunca contenido cacheable entre visitantes. Sin
// esto, Next intenta prerenderizar páginas como /app/personas en el
// build de Docker, donde no hay base todavía (PR 0.4) y el build se
// cae. Puesto acá, en el layout, para que valga para cualquier página
// nueva bajo /app sin tener que acordarse de repetirlo.
export const dynamic = "force-dynamic";

// Reemplaza el <nav> horizontal de ocho enlaces (§6.2 del sistema
// visual, PR 7): ya apretaba y no aguantaba el octavo cuando lo agregó
// el PR 4. colapsada viene de la cookie, leída acá en el servidor, para
// que el primer HTML ya tenga el ancho correcto — sin esto hay un salto
// visual en cada recarga mientras el cliente decide.
export default async function LayoutInterno({
  children,
}: {
  children: React.ReactNode;
}) {
  const [colapsada, sesion] = await Promise.all([
    leerSidebarColapsada(),
    obtenerSesionActual(),
  ]);
  const [conteoNoLeidas, ultimasNotificaciones] = sesion
    ? await Promise.all([
        contarNoLeidasDePersona(sesion.personaId),
        listarUltimasNotificaciones(sesion.personaId),
      ])
    : [0, []];
  const botonCerrarSesion = (
    <form action={cerrarSesionAction}>
      <Button type="submit" variant="secondary" size="sm" className="w-full">
        Cerrar sesión
      </Button>
    </form>
  );
  const campana = (
    <CampanaNotificaciones
      conteoNoLeidas={conteoNoLeidas}
      ultimas={ultimasNotificaciones}
    />
  );

  return (
    <div className="flex min-h-screen">
      <SidebarInterna colapsada={colapsada} />
      <div className="flex min-w-0 flex-1 flex-col">
        <BarraSuperiorMovil
          cerrarSesion={botonCerrarSesion}
          campana={campana}
        />
        <div className="hidden items-center justify-end gap-2 border-b border-border px-6 py-3 sm:flex">
          {campana}
          {botonCerrarSesion}
        </div>
        {/* min-w-0: un item de flex-col hereda min-width:auto por
            default, así que sin esto una tabla ancha adentro empuja
            <main> más allá del viewport en vez de scrollear dentro de
            su propio overflow-x-auto (encontrado a mano a 390px: el
            <main> de /app/personas medía 614px con el viewport en 390,
            porque nunca lo agarraba nada acá). */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
