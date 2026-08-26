import Link from "next/link";

// Métricas y KPIs del tablero de /app (§6.4 del sistema visual): número
// grande en Geist Mono, etiqueta chica. `variacion` queda como prop
// opcional para cuando haya un dato histórico con el que compararse —
// hoy ningún módulo guarda una serie en el tiempo, así que ninguna
// pantalla la pasa todavía.
export function CardDato({
  etiqueta,
  valor,
  href,
  variacion,
}: {
  etiqueta: string;
  valor: number | string;
  href?: string;
  variacion?: { texto: string; positiva: boolean };
}) {
  const contenido = (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <span className="text-xs text-muted-foreground">{etiqueta}</span>
      <span className="font-mono text-3xl font-semibold tabular-nums">
        {valor}
      </span>
      {variacion && (
        <span
          className={
            variacion.positiva
              ? "text-xs text-primary"
              : "text-xs text-destructive"
          }
        >
          {variacion.positiva ? "↑" : "↓"} {variacion.texto}
        </span>
      )}
    </div>
  );

  if (!href) return contenido;

  return (
    <Link href={href} className="block">
      {contenido}
    </Link>
  );
}
