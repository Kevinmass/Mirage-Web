import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
        <Link
          href="/portal/solicitudes"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Tus solicitudes
        </Link>
        <h1 className="mt-2 text-h2 font-heading font-semibold">
          Nueva solicitud
        </h1>
        <p className="mt-1 text-muted-foreground">
          La recibe el equipo de Mirage a cargo de tu cuenta.
        </p>
      </div>
      <FormularioSolicitud />
    </main>
  );
}
