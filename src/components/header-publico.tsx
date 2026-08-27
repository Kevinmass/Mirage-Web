"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MenuMovil, type ItemNavegacion } from "@/components/menu-movil";
import { ToggleTema } from "@/components/toggle-tema";
import { cn } from "@/lib/utils";

const NAVEGACION: ItemNavegacion[] = [
  { href: "/", etiqueta: "Inicio" },
  { href: "/servicios", etiqueta: "Servicios" },
  { href: "/casos", etiqueta: "Casos" },
  { href: "/contacto", etiqueta: "Contacto" },
];

// Un solo componente, tres modos (§6.2 del sistema visual): transparente
// arriba de la landing, vidrio al pasar los 80px, sólido en el resto. El
// scroll se lee con IntersectionObserver sobre un centinela — un
// listener de scroll acá cuesta cuadros.
export function HeaderPublico() {
  const pathname = usePathname();
  const esLanding = pathname === "/";
  const [traspasado, setTraspasado] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const centinelaRef = useRef<HTMLDivElement>(null);
  const botonMenuRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!esLanding) return;
    const centinela = centinelaRef.current;
    if (!centinela) return;
    const observer = new IntersectionObserver(
      ([entrada]) => setTraspasado(!entrada.isIntersecting),
      { rootMargin: "-80px 0px 0px 0px" },
    );
    observer.observe(centinela);
    return () => observer.disconnect();
  }, [esLanding]);

  const transparente = esLanding && !traspasado;
  // Un anillo de foco que se ve tanto sobre el hero (transparente) como
  // sobre el header sólido.
  const anilloFoco = cn(
    "outline-none focus-visible:ring-2",
    transparente
      ? "focus-visible:ring-crema-100/70"
      : "focus-visible:ring-ring",
  );

  return (
    <>
      {esLanding && (
        <div
          ref={centinelaRef}
          aria-hidden
          className="absolute top-0 h-px w-full"
        />
      )}
      <header
        className={cn(
          "sticky top-0 z-40 border-b transition-[height,background-color,border-color,backdrop-filter] duration-(--dur-media) ease-(--ease-suave) motion-reduce:transition-none",
          transparente
            ? "h-20 border-transparent bg-transparent"
            : "h-16 border-border bg-background/72 backdrop-blur-md backdrop-saturate-150",
        )}
      >
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className={cn(
              "rounded-sm font-heading text-lg font-bold tracking-tight transition-colors duration-(--dur-media)",
              anilloFoco,
              transparente
                ? "text-crema-100 drop-shadow-sm"
                : "text-foreground",
            )}
          >
            Mirage
          </Link>

          <nav
            className={cn(
              "hidden items-center gap-8 text-sm font-medium transition-colors duration-(--dur-media) md:flex",
              transparente ? "text-crema-100" : "text-muted-foreground",
            )}
          >
            {NAVEGACION.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-sm transition-opacity hover:opacity-100",
                  anilloFoco,
                  transparente
                    ? "opacity-90"
                    : "opacity-100 hover:text-foreground",
                )}
              >
                {item.etiqueta}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <ToggleTema
              className={cn(transparente && "text-crema-100 hover:bg-white/10")}
            />
            <Link
              href="/ingresar"
              className={cn(
                "hidden rounded-md px-3 py-2 text-sm font-medium transition-colors sm:block",
                anilloFoco,
                transparente
                  ? "text-crema-100 hover:bg-white/10"
                  : "text-foreground hover:bg-secondary",
              )}
            >
              Ingresar
            </Link>
            <button
              ref={botonMenuRef}
              type="button"
              onClick={() => setMenuAbierto(true)}
              aria-label="Abrir menú"
              className={cn(
                "inline-flex size-11 items-center justify-center rounded-full transition-colors md:hidden",
                anilloFoco,
                transparente
                  ? "text-crema-100 hover:bg-white/10"
                  : "hover:bg-secondary",
              )}
            >
              <Menu className="size-6" />
            </button>
          </div>
        </div>
      </header>
      <MenuMovil
        abierto={menuAbierto}
        onCerrar={() => {
          setMenuAbierto(false);
          botonMenuRef.current?.focus();
        }}
        navegacion={NAVEGACION}
      />
    </>
  );
}
