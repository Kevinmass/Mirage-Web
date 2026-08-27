import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { IndicadorCarga } from "@/components/ui/indicador-carga";
import { NoEncontrado } from "@/kernel/errores";
import { obtenerPersona } from "@/kernel/identidad/personas";
import { obtenerArbolCompleto } from "@/kernel/organigrama/arbol";
import {
  actualizarPersonaAction,
  archivarPersonaAction,
  invitarPersonaAction,
} from "../actions";
import { FormularioPersona } from "../formulario-persona";

export default async function PaginaPersona({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idNumerico = Number(id);
  if (!Number.isInteger(idNumerico)) {
    notFound();
  }

  const [persona, nodos] = await Promise.all([
    obtenerPersona(idNumerico).catch((error) => {
      if (error instanceof NoEncontrado) {
        notFound();
      }
      throw error;
    }),
    obtenerArbolCompleto(),
  ]);
  const nodosQueOcupa = nodos.filter((n) =>
    n.ocupantes.some((o) => o.personaId === idNumerico),
  );

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-h3 font-heading font-semibold">
        {persona.nombre} {persona.apellido}
      </h1>

      <div className="mt-6 flex flex-col gap-6">
        <div>
          <p className="mb-2 text-sm font-medium">Nodos que ocupa</p>
          <div className="flex flex-wrap items-center gap-2">
            <IndicadorCarga cantidadDeNodos={nodosQueOcupa.length} />
            {nodosQueOcupa.map((n) => (
              <Link
                key={n.id}
                href="/app/organigrama"
                className="text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                {n.nombre}
              </Link>
            ))}
          </div>
        </div>

        <FormularioPersona
          action={actualizarPersonaAction.bind(null, idNumerico)}
          valoresIniciales={persona}
          textoBoton="Guardar"
        />

        <div className="flex gap-3">
          {persona.usuarioId ? (
            <p className="text-sm text-muted-foreground">
              Ya tiene acceso al sistema.
            </p>
          ) : (
            <form action={invitarPersonaAction.bind(null, idNumerico)}>
              <Button type="submit" variant="secondary">
                Invitar a tener acceso
              </Button>
            </form>
          )}

          {persona.activo && (
            <form action={archivarPersonaAction.bind(null, idNumerico)}>
              <Button type="submit" variant="destructive">
                Archivar
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
