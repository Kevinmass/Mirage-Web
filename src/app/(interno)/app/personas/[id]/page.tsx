import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NoEncontrado } from "@/kernel/errores";
import { obtenerPersona } from "@/kernel/identidad/personas";
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

  const persona = await obtenerPersona(idNumerico).catch((error) => {
    if (error instanceof NoEncontrado) {
      notFound();
    }
    throw error;
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">
        {persona.nombre} {persona.apellido}
      </h1>

      <div className="mt-6 flex flex-col gap-6">
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
