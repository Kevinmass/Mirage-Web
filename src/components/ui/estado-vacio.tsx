import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

// Toda pantalla que carga datos define su estado vacío: qué es esto y el
// botón para crear el primero — nunca solo una frase (§6.7). `accion` es
// el botón; se omite solo cuando de verdad no hay nada que crear acá.
function EstadoVacio({
  icono: Icono = Inbox,
  titulo,
  descripcion,
  accion,
  className,
}: {
  icono?: LucideIcon;
  titulo: string;
  descripcion?: string;
  accion?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center",
        className,
      )}
    >
      <Icono className="size-8 stroke-[1.5] text-arena-400" aria-hidden />
      <p className="font-medium text-foreground">{titulo}</p>
      {descripcion ? (
        <p className="max-w-sm text-sm text-muted-foreground">
          {descripcion}
        </p>
      ) : null}
      {accion}
    </div>
  );
}

export { EstadoVacio };
