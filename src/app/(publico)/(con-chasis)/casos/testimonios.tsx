interface Caso {
  id: number;
  testimonio: string | null;
  autor: string | null;
  cargoAutor: string | null;
}

// "masonry" de React Bits, reteñido (§6.8): alturas desparejas porque
// cada testimonio mide distinto, no porque haya una librería de layout
// detrás — columns-N + break-inside-avoid alcanza para esto.
export function Testimonios({ casos }: { casos: Caso[] }) {
  const conTestimonio = casos.filter(
    (caso): caso is Caso & { testimonio: string } => !!caso.testimonio,
  );

  if (conTestimonio.length === 0) return null;

  return (
    <div className="columns-1 gap-6 sm:columns-2">
      {conTestimonio.map((caso) => (
        <figure
          key={caso.id}
          className="mb-6 break-inside-avoid rounded-2xl border border-border bg-card p-6 shadow-md"
        >
          <blockquote className="font-heading text-h3 leading-snug font-medium text-balance">
            “{caso.testimonio}”
          </blockquote>
          {caso.autor && (
            <figcaption className="mt-4 text-sm text-muted-foreground">
              {caso.autor}
              {caso.cargoAutor ? `, ${caso.cargoAutor}` : null}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
