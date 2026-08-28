import Link from "next/link";
import { obtenerArbolCompleto } from "@/kernel/organigrama/arbol";
import { cn } from "@/lib/utils";

// La miniatura no interactiva del pie del tablero (§8.6): un anticipo
// del organigrama radial del PR 8, no una versión reducida de él —
// acá no hay física ni SVG, solo un punto por nodo agrupado por anillo,
// con el mismo código visual que va a tener la pantalla completa
// (color por rama, punteado si nadie lo ocupa) para que ya sea
// reconocible cuando llegue.
export async function OrganigramaMini() {
  const nodos = await obtenerArbolCompleto().catch(() => []);

  if (nodos.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Todavía no hay organigrama cargado.
      </p>
    );
  }

  const porAnillo = new Map<number, typeof nodos>();
  for (const nodo of nodos) {
    const lista = porAnillo.get(nodo.anillo) ?? [];
    lista.push(nodo);
    porAnillo.set(nodo.anillo, lista);
  }
  const anillos = [...porAnillo.keys()].sort((a, b) => a - b);

  return (
    <Link
      href="/app/organigrama"
      aria-label="Ver el organigrama completo"
      className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
    >
      {anillos.map((anillo) => (
        <div key={anillo} className="flex flex-wrap justify-center gap-2">
          {porAnillo.get(anillo)!.map((nodo) => (
            <span
              key={nodo.id}
              title={nodo.nombre}
              className={cn(
                "size-3 rounded-full",
                nodo.raiz === "externo" ? "bg-ambar-500" : "bg-turquesa-500",
                nodo.ocupantes.length === 0 &&
                  "border border-dashed border-current bg-transparent",
              )}
            />
          ))}
        </div>
      ))}
      <span className="text-sm text-primary">Ver organigrama completo →</span>
    </Link>
  );
}
