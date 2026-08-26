import { CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Qué falló en lenguaje humano y un botón de reintentar — nunca un código
// de error solo (§6.7). El estado nunca se comunica solo con color: el
// ícono y el texto van siempre juntos.
function EstadoError({
  titulo = "Algo falló",
  descripcion,
  onReintentar,
  className,
}: {
  titulo?: string;
  descripcion: string;
  onReintentar?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-border bg-destructive/5 px-6 py-12 text-center",
        className,
      )}
    >
      <CircleAlert className="size-8 text-destructive" aria-hidden />
      <p className="font-medium text-foreground">{titulo}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{descripcion}</p>
      {onReintentar ? (
        <Button type="button" variant="secondary" size="sm" onClick={onReintentar}>
          Reintentar
        </Button>
      ) : null}
    </div>
  );
}

export { EstadoError };
