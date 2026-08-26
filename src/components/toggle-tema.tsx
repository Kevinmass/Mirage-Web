"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { aplicarTema, leerTema, type Tema } from "@/lib/tema";
import { cn } from "@/lib/utils";

// El control real y accesible del tema (§6.2): <button> con aria-label,
// funciona con teclado, persiste en localStorage. Cualquier adorno sobre
// el tema (el lanyard del PR 2 en la landing) lo acompaña, nunca lo
// reemplaza.
export function ToggleTema({ className }: { className?: string }) {
  const [tema, setTema] = useState<Tema | null>(null);

  useEffect(() => {
    setTema(leerTema());
  }, []);

  if (tema === null) {
    // Evita el parpadeo de hidratación: el script inline ya decidió la
    // clase .dark antes del primer pintado, este botón solo espera a
    // saber qué ícono mostrar.
    return <span className={cn("size-11", className)} aria-hidden />;
  }

  const esOscuro = tema === "oscuro";

  return (
    <button
      type="button"
      aria-label={esOscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      onClick={() => {
        const nuevo: Tema = esOscuro ? "claro" : "oscuro";
        aplicarTema(nuevo);
        setTema(nuevo);
      }}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-colors duration-(--dur-rapida) hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      {esOscuro ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}
