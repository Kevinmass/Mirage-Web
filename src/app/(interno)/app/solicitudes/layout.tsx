import { obtenerSesionActual } from "@/kernel/identidad/sesion";
import { listarClientes } from "@/modules/clientes/api";
import { listarProyectosDePersona } from "@/modules/proyectos/api";
import { listarSolicitudesConActividad } from "@/modules/solicitudes/api";
import { BandejaSolicitudes } from "./bandeja-solicitudes";

// Bandeja tipo ticketera (diseño §8.12): lista a la izquierda, hilo a
// la derecha en desktop — un layout, no dos páginas separadas, para que
// la lista sobreviva a la navegación entre /app/solicitudes y
// /app/solicitudes/[id] sin recargarse. BandejaSolicitudes (cliente)
// decide con usePathname si en móvil toca mostrar la lista o el hilo.
export default async function LayoutSolicitudes({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    return <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>;
  }

  const [solicitudes, clientes, proyectosPropios] = await Promise.all([
    listarSolicitudesConActividad(sesion.personaId),
    listarClientes(),
    listarProyectosDePersona(sesion.personaId),
  ]);
  const nombreDeCliente: Record<number, string> = {};
  for (const c of clientes) nombreDeCliente[c.id] = c.nombre;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-start">
      <BandejaSolicitudes
        solicitudes={solicitudes}
        nombreDeCliente={nombreDeCliente}
        cantidadProyectos={proyectosPropios.length}
      >
        {children}
      </BandejaSolicitudes>
    </main>
  );
}
