"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface ItemNavegacion {
  href: string;
  etiqueta: string;
}

// Overlay a pantalla completa con los ítems entrando escalonados (§6.2:
// "staggered-menu" de React Bits, reteñido — acá reimplementado en CSS
// puro: la propia librería trae GSAP como dependencia nueva y este menú
// no necesita física, solo la entrada escalonada).
export function MenuMovil({
  abierto,
  onCerrar,
  navegacion,
}: {
  abierto: boolean;
  onCerrar: () => void;
  navegacion: ItemNavegacion[];
}) {
  const botonCerrarRef = useRef<HTMLButtonElement>(null);

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
      if (evento.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alTeclado);
    return () => window.removeEventListener("keydown", alTeclado);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menú"
      className="fixed inset-0 z-50 flex flex-col bg-background md:hidden"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <span className="font-heading text-lg font-bold">Mirage</span>
        <button
          ref={botonCerrarRef}
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar menú"
          className="inline-flex size-11 items-center justify-center rounded-full hover:bg-secondary"
        >
          <X className="size-6" />
        </button>
      </div>
      <nav className="flex flex-1 flex-col justify-center gap-2 px-6">
        {navegacion.map((item, indice) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onCerrar}
            style={{ animationDelay: `${indice * 60}ms` }}
            className={cn(
              "animate-[menu-movil-entrar_var(--dur-entrada)_var(--ease-salida)_backwards] motion-reduce:animate-none",
              "text-h2 font-heading font-semibold text-foreground",
              "py-2",
            )}
          >
            {item.etiqueta}
          </Link>
        ))}
      </nav>
    </div>
  );
}
