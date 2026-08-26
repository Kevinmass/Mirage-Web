"use client";

import { ChevronsLeft, ChevronsRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { alternarSidebarAction } from "@/lib/sidebar-interna-actions";
import { cn } from "@/lib/utils";
import { NAV_INTERNA } from "./nav-interna";

// 240px expandida, 64px colapsada a solo íconos (§6.2, PR 7). El estado
// viene del layout (que lo lee de la cookie en el servidor) — nunca hay
// que adivinarlo acá, así que no hay salto visual al recargar. La
// sección activa se marca con una barra de 3px a la izquierda, no
// pintando el ítem entero.
export function SidebarInterna({ colapsada }: { colapsada: boolean }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-card transition-[width] duration-(--dur-media) ease-(--ease-suave) sm:flex",
        colapsada ? "w-16" : "w-60",
      )}
    >
      <div className="flex h-16 shrink-0 items-center px-4">
        <Link
          href="/app"
          className="truncate font-heading font-bold text-foreground"
        >
          {colapsada ? "M" : "Mirage"}
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2">
        {NAV_INTERNA.map((item) => {
          const activo =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icono = item.icono;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={colapsada ? item.etiqueta : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                activo
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {activo && (
                <span
                  aria-hidden
                  className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary"
                />
              )}
              <Icono className="size-5 shrink-0" />
              {!colapsada && <span className="truncate">{item.etiqueta}</span>}
            </Link>
          );
        })}
      </nav>

      <form
        action={alternarSidebarAction}
        className="border-t border-border p-2"
      >
        <button
          type="submit"
          aria-label={
            colapsada ? "Expandir barra lateral" : "Colapsar barra lateral"
          }
          className="flex w-full items-center justify-center gap-2 rounded-md py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {colapsada ? (
            <ChevronsRight className="size-5" />
          ) : (
            <>
              <ChevronsLeft className="size-5" />
              <span className="text-sm">Colapsar</span>
            </>
          )}
        </button>
      </form>
    </aside>
  );
}
