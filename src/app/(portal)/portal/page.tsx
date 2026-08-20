import Link from "next/link";
import { Button } from "@/components/ui/button";
import { obtenerSesionPortal } from "@/lib/sesion-portal";
import { obtenerCliente } from "@/modules/clientes/api";

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

  const cliente = await obtenerCliente(sesion.clienteId);

  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-3xl font-semibold">Hola, {cliente.nombre}</h1>
      <p className="text-lg text-muted-foreground">
        Acá vas a poder cargar solicitudes y ver el progreso de tus proyectos.
      </p>
      <div className="flex gap-2">
        <Button
          render={<Link href="/portal/solicitudes">Ver tus solicitudes</Link>}
        />
        <Button
          variant="outline"
          render={<Link href="/portal/proyectos">Ver tus proyectos</Link>}
        />
      </div>
    </main>
  );
}
