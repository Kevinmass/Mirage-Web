import { obtenerSesionPortal } from "@/lib/sesion-portal";
import { FormularioSolicitud } from "../formulario-solicitud";

export default async function PaginaNuevaSolicitud() {
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

  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Nueva solicitud</h1>
        <p className="mt-1 text-muted-foreground">
          La recibe el equipo de Mirage a cargo de tu cuenta.
        </p>
      </div>
      <FormularioSolicitud />
    </main>
  );
}
