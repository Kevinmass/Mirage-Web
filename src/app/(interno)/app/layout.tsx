import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cerrarSesionAction } from "@/lib/cerrar-sesion-action";

// /app tiene sesión: todo lo que haya debajo muestra datos por
// persona/por momento, nunca contenido cacheable entre visitantes. Sin
// esto, Next intenta prerenderizar páginas como /app/personas en el
// build de Docker, donde no hay base todavía (PR 0.4) y el build se
// cae. Puesto acá, en el layout, para que valga para cualquier página
// nueva bajo /app sin tener que acordarse de repetirlo.
export const dynamic = "force-dynamic";

export default function LayoutInterno({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b">
        <div className="flex items-center justify-between gap-6 px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/app" className="font-semibold">
              Mirage — interno
            </Link>
            <nav className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/app/personas" className="hover:text-foreground">
                Personas
              </Link>
              <Link href="/app/organigrama" className="hover:text-foreground">
                Organigrama
              </Link>
              <Link href="/app/clientes" className="hover:text-foreground">
                Clientes
              </Link>
              <Link href="/app/proyectos" className="hover:text-foreground">
                Proyectos
              </Link>
              <Link href="/app/tareas" className="hover:text-foreground">
                Tareas
              </Link>
              <Link
                href="/app/notificaciones"
                className="hover:text-foreground"
              >
                Notificaciones
              </Link>
            </nav>
          </div>
          <form action={cerrarSesionAction}>
            <Button type="submit" variant="ghost" size="sm">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </header>
      {children}
    </>
  );
}
