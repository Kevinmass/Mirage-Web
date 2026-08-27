"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { NAV_INTERNA } from "./nav-interna";

// En móvil la barra lateral es un drawer (§6.2): la franja de 3px del
// ítem activo no tiene sentido colapsada a íconos en una pantalla
// angosta, así que acá se repinta como una lista completa a pantalla
// completa, igual que <MenuMovil> del chasis público.
export function BarraSuperiorMovil({
  cerrarSesion,
  campana,
}: {
  cerrarSesion: React.ReactNode;
  campana?: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();
  const botonCerrarRef = useRef<HTMLButtonElement>(null);
  const botonAbrirRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!abierto) return;
    document.body.style.overflow = "hidden";
    botonCerrarRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
    };
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    const alTeclado = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAbierto(false);
    };
    window.addEventListener("keydown", alTeclado);
    return () => window.removeEventListener("keydown", alTeclado);
  }, [abierto]);

  return (
    <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card px-4 sm:hidden">
      <Link href="/app" className="font-heading font-bold">
        Mirage
      </Link>
      <div className="flex items-center gap-1">
        {campana}
        <button
          ref={botonAbrirRef}
          type="button"
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú"
          className="inline-flex size-11 items-center justify-center rounded-full hover:bg-secondary"
        >
          <Menu className="size-6" />
        </button>
      </div>

      {abierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menú del sistema interno"
          className="fixed inset-0 z-50 flex flex-col bg-background"
        >
          <div className="flex h-14 items-center justify-between px-4">
            <span className="font-heading font-bold">Mirage</span>
            <button
              ref={botonCerrarRef}
              type="button"
              onClick={() => {
                setAbierto(false);
                botonAbrirRef.current?.focus();
              }}
              aria-label="Cerrar menú"
              className="inline-flex size-11 items-center justify-center rounded-full hover:bg-secondary"
            >
              <X className="size-6" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4">
            {NAV_INTERNA.map((item) => {
              const activo =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icono = item.icono;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setAbierto(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-3 text-base",
                    activo
                      ? "font-medium text-primary"
                      : "text-foreground hover:bg-secondary",
                  )}
                >
                  <Icono className="size-5 shrink-0" />
                  {item.etiqueta}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border p-4">{cerrarSesion}</div>
        </div>
      )}
    </div>
  );
}
