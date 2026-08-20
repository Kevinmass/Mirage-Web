import { Button } from "@/components/ui/button";
import { cerrarSesionAction } from "@/lib/cerrar-sesion-action";
import { obtenerSesionPortal } from "@/lib/sesion-portal";
import { obtenerCliente } from "@/modules/clientes/api";

// /portal tiene sesión y datos por cliente — mismo motivo que
// (interno)/app/layout.tsx: nunca contenido cacheable entre visitantes.
export const dynamic = "force-dynamic";

// Diseño (decisión cerrada): las tres superficies comparten
// primitivos, no layout ni densidad — /app denso, /portal amplio y
// explicativo. No es una copia con otro color: más aire, más
// explicación de qué está pasando, nada del organigrama ni de la
// estructura interna de Mirage (diseño §8) — acá solo aparece "Mirage"
// y el nombre del cliente, nunca un nodo ni una asignación.
export default async function LayoutPortal({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesion = await obtenerSesionPortal();
  const cliente = sesion ? await obtenerCliente(sesion.clienteId) : null;

  return (
    <div className="min-h-full bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-8 py-6">
          <div>
            <p className="text-lg font-semibold">Mirage</p>
            {cliente && (
              <p className="text-sm text-muted-foreground">{cliente.nombre}</p>
            )}
          </div>
          {sesion && (
            <form action={cerrarSesionAction}>
              <Button type="submit" variant="ghost" size="sm">
                Cerrar sesión
              </Button>
            </form>
          )}
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-8 py-10">{children}</div>
    </div>
  );
}
