import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

// Genérico para los bloques del tablero de /app (§6.2, PR 7) — evita
// reescribir el mismo estado vacío en cinco pantallas. Más chico que
// <EstadoVacio> (esto vive dentro de una columna, no de una página
// entera) y sin acción: los bloques del tablero son de solo lectura,
// la acción vive en la pantalla completa a la que enlazan.
export function TableroVacio({
  icono: Icono = Inbox,
  texto,
}: {
  icono?: LucideIcon;
  texto: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <Icono className="size-6 text-arena-400" aria-hidden />
      <p className="text-sm text-muted-foreground">{texto}</p>
    </div>
  );
}
