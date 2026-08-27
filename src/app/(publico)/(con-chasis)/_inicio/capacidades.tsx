import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";

const CAPACIDADES = [
  {
    titulo: "Sistemas a medida",
    descripcion:
      "Software diseñado para el proceso real de tu equipo, no una plantilla genérica que hay que adaptar a los golpes.",
  },
  {
    titulo: "De punta a punta",
    descripcion:
      "Construimos y operamos todo el sistema: desde la base de datos hasta la interfaz que tu equipo usa todos los días.",
  },
  {
    titulo: "Con vos en el tiempo",
    descripcion:
      "No es un proyecto que se entrega y se olvida. Seguimos operando y mejorando lo que construimos.",
  },
];

// Las tres capacidades, visibles a la vez (PR 3 §1 del plan de fixes,
// adelantado: el card-swap casero rotaba solo, era angosto y no se
// entendía como interactivo — la queja de §1.5). Son tres puntos de
// información, no una navegación: no hay estado, no hay JS, no rotan. El
// hover es solo un realce de "está vivo", no promete un click.
export function Capacidades() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {CAPACIDADES.map((capacidad) => (
        <Card
          key={capacidad.titulo}
          className="h-full transition-[transform,box-shadow] duration-(--dur-rapida) ease-(--ease-suave) hover:-translate-y-1 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          <CardContent className="flex h-full flex-col gap-3 py-2">
            <CardTitle className="text-h3 font-heading">
              {capacidad.titulo}
            </CardTitle>
            <CardDescription className="text-body">
              {capacidad.descripcion}
            </CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
