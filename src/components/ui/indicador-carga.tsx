import { Badge } from "@/components/ui/badge";

// Umbral de sobrecarga del diseño (§8.8): 1-2 nodos es normal (turquesa),
// 3 es atención (ámbar), 4+ es la señal de sobrecarga que el modelo de
// la empresa quiere que se vea (coral). No hay "verde" en la paleta —
// turquesa cumple ese rol, igual que en el resto de los badges de estado.
function varianteDeCarga(cantidadDeNodos: number) {
  if (cantidadDeNodos >= 4) return "destructive" as const;
  if (cantidadDeNodos === 3) return "accent" as const;
  return "primary" as const;
}

export function IndicadorCarga({
  cantidadDeNodos,
  className,
}: {
  cantidadDeNodos: number;
  className?: string;
}) {
  if (cantidadDeNodos === 0) {
    return (
      <Badge variant="outline" className={className}>
        Sin nodos
      </Badge>
    );
  }

  return (
    <Badge variant={varianteDeCarga(cantidadDeNodos)} className={className}>
      {cantidadDeNodos} {cantidadDeNodos === 1 ? "nodo" : "nodos"}
    </Badge>
  );
}
