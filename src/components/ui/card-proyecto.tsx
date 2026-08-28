import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

interface InscriptoResumen {
  personaId: number;
  nombre: string;
  apellido: string;
}

// Anillo de progreso del cupo (diseño §8.10) — no confundir con el
// progreso de tareas (hechas/totales), que es otro número y vive en el
// contador aparte, no en este anillo.
function AnilloCupo({
  inscriptos,
  cupo,
}: {
  inscriptos: number;
  cupo: number | null;
}) {
  const radio = 15;
  const circunferencia = 2 * Math.PI * radio;
  const lleno = cupo !== null && inscriptos >= cupo;
  const fraccion =
    cupo === null ? 0 : Math.min(inscriptos / Math.max(cupo, 1), 1);

  return (
    <div className="relative flex size-9 shrink-0 items-center justify-center">
      {cupo !== null && (
        <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
          <circle
            cx={18}
            cy={18}
            r={radio}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={3}
          />
          <circle
            cx={18}
            cy={18}
            r={radio}
            fill="none"
            stroke={lleno ? "var(--color-coral-500)" : "var(--color-primary)"}
            strokeWidth={3}
            strokeDasharray={`${fraccion * circunferencia} ${circunferencia}`}
            strokeLinecap="round"
            className="transition-[stroke-dasharray] duration-(--dur-media) ease-(--ease-suave) motion-reduce:transition-none"
          />
        </svg>
      )}
      <span
        className={cn(
          "font-mono text-[0.7rem] font-medium tabular-nums",
          lleno && "text-coral-500",
        )}
      >
        {inscriptos}
        {cupo !== null && `/${cupo}`}
      </span>
    </div>
  );
}

function AvataresApilados({ inscriptos }: { inscriptos: InscriptoResumen[] }) {
  if (inscriptos.length === 0) return null;
  const visibles = inscriptos.slice(0, 4);
  const restantes = inscriptos.length - visibles.length;

  return (
    <div className="flex -space-x-2" aria-hidden>
      {visibles.map((i) => (
        <div
          key={i.personaId}
          title={`${i.nombre} ${i.apellido}`}
          className="flex size-6 items-center justify-center rounded-full border-2 border-card bg-secondary text-[0.6rem] font-medium text-secondary-foreground"
        >
          {i.nombre[0]}
          {i.apellido[0]}
        </div>
      ))}
      {restantes > 0 && (
        <div className="flex size-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[0.6rem] font-medium text-muted-foreground">
          +{restantes}
        </div>
      )}
    </div>
  );
}

// Grilla de /app/proyectos (diseño §8.10): imagen o color, contador de
// cupo con anillo, avatares apilados. `border-glow` marca la card del
// proyecto propio — se aplica acá, no queda a criterio del caller,
// para que sea imposible usarlo en otra situación (es de un solo uso
// en toda la plataforma, §6.4).
export function CardProyecto({
  id,
  nombre,
  descripcion,
  estado,
  color,
  imagenUrl,
  cupo,
  inscriptos,
  inscriptoPropio,
  accion,
}: {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: string;
  color: string | null;
  imagenUrl: string | null;
  cupo: number | null;
  inscriptos: InscriptoResumen[];
  inscriptoPropio: boolean;
  accion?: React.ReactNode;
}) {
  return (
    <Card className={cn(inscriptoPropio && "border-glow")}>
      {imagenUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- color/imagen del proyecto es contenido dinámico de usuario, no un asset propio para optimizar con next/image.
        <img src={imagenUrl} alt="" className="h-24 w-full object-cover" />
      ) : (
        <div
          className="h-24 w-full"
          style={{ backgroundColor: color ?? "var(--color-secondary)" }}
        />
      )}
      <CardHeader className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/app/proyectos/${id}`} className="hover:underline">
            <CardTitle className="truncate">{nombre}</CardTitle>
          </Link>
          {descripcion && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {descripcion}
            </p>
          )}
        </div>
        <AnilloCupo inscriptos={inscriptos.length} cupo={cupo} />
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant={varianteEstado(estado)}>
            {ETIQUETA_ESTADO[estado] ?? estado}
          </Badge>
          <AvataresApilados inscriptos={inscriptos} />
        </div>
        {accion}
      </CardContent>
    </Card>
  );
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
