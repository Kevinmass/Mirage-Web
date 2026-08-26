import { Skeleton } from "@/components/ui/skeleton";

// El estado de carga de un bloque del tablero (§6.2, PR 7) — se usa
// dentro de un <Suspense fallback> por bloque, no de la página entera,
// para que el resto del tablero no espere a la columna más lenta.
export function TableroCargando({ filas = 3 }: { filas?: number }) {
  return (
    <div className="flex flex-col gap-3 py-2">
      {Array.from({ length: filas }).map((_, indice) => (
        <Skeleton key={indice} className="h-10 w-full" />
      ))}
    </div>
  );
}
