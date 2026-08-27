import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { listarPersonas } from "@/kernel/identidad/personas";
import {
  obtenerArbolCompleto,
  type NodoConDetalle,
} from "@/kernel/organigrama/arbol";
import type { FilaPersona, NodoDePersona } from "./personas-grid";
import { PersonasGrid } from "./personas-grid";

// Solo las dos raíces tienen `raiz` seteado (schema.ts) — la rama de
// cualquier otro nodo se resuelve subiendo por padreId hasta encontrar
// una. `visitados` es solo defensivo contra un dato corrupto con ciclo;
// las invariantes de la base no deberían permitirlo.
function ramaDeNodo(
  nodoId: number,
  porId: Map<number, NodoConDetalle>,
): "interno" | "externo" | null {
  const visitados = new Set<number>();
  let actual = porId.get(nodoId);
  while (actual && !visitados.has(actual.id)) {
    if (actual.raiz) return actual.raiz;
    visitados.add(actual.id);
    if (actual.padreId === null) return null;
    actual = porId.get(actual.padreId);
  }
  return null;
}

export default async function PaginaPersonas() {
  const [personas, nodos] = await Promise.all([
    listarPersonas(),
    obtenerArbolCompleto(),
  ]);

  const porId = new Map(nodos.map((n) => [n.id, n]));
  const nodosPorPersona = new Map<number, NodoDePersona[]>();
  for (const n of nodos) {
    for (const ocupante of n.ocupantes) {
      const lista = nodosPorPersona.get(ocupante.personaId) ?? [];
      lista.push({ id: n.id, nombre: n.nombre, rama: ramaDeNodo(n.id, porId) });
      nodosPorPersona.set(ocupante.personaId, lista);
    }
  }

  const filas: FilaPersona[] = personas.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    apellido: p.apellido,
    email: p.email,
    tipo: p.tipo,
    activo: p.activo,
    nodos: nodosPorPersona.get(p.id) ?? [],
  }));

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-h3 font-heading font-semibold">Personas</h1>
        <Button
          render={<Link href="/app/personas/nueva">Nueva persona</Link>}
        />
      </div>

      <div className="mt-6">
        {filas.length === 0 ? (
          <EstadoVacio
            titulo="Todavía no hay personas cargadas."
            accion={
              <Button
                size="sm"
                render={<Link href="/app/personas/nueva">Nueva persona</Link>}
              />
            }
          />
        ) : (
          <PersonasGrid filas={filas} />
        )}
      </div>
    </main>
  );
}
