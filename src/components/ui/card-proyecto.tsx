import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ETIQUETA_ESTADO: Record<string, string> = {
  propuesto: "Propuesto",
  activo: "Activo",
  pausado: "Pausado",
  terminado: "Terminado",
  cancelado: "Cancelado",
};

function varianteEstado(estado: string): "primary" | "accent" | "outline" {
  if (estado === "activo") return "primary";
  if (estado === "pausado") return "accent";
  return "outline";
}

// Versión compacta (diseño §8.9, PR 9): nombre, estado y progreso nada
// más. La versión completa — imagen/color, cupo, avatares apilados —
// es del PR 10, que agrega esos campos a `proyectos_proyecto`; no
// inventar acá datos que ese PR todavía no agregó.
export function CardProyectoCompacta({
  id,
  nombre,
  estado,
  hechas,
  totales,
}: {
  id: number;
  nombre: string;
  estado: string;
  hechas: number;
  totales: number;
}) {
  return (
    <Card size="sm">
      <Link href={`/app/proyectos/${id}`} className="contents">
        <CardHeader>
          <CardTitle className="truncate">{nombre}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <Badge variant={varianteEstado(estado)}>
            {ETIQUETA_ESTADO[estado] ?? estado}
          </Badge>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {hechas}/{totales}
          </span>
        </CardContent>
      </Link>
    </Card>
  );
}
