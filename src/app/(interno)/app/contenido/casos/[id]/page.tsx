import { notFound } from "next/navigation";
import { NoEncontrado } from "@/kernel/errores";
import { obtenerCaso } from "@/modules/contenido/api";
import { listarClientes } from "@/modules/clientes/api";
import { actualizarCasoAction } from "../../actions";
import { FormularioCaso } from "../../formulario-caso";

export default async function PaginaEditarCaso({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [caso, clientes] = await Promise.all([
    obtenerCaso(Number(id)).catch((error) => {
      if (error instanceof NoEncontrado) return undefined;
      throw error;
    }),
    listarClientes(),
  ]);
  if (!caso) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Editar caso</h1>
      <div className="mt-6">
        <FormularioCaso
          action={actualizarCasoAction.bind(null, caso.id)}
          clientes={clientes}
          valoresIniciales={{
            titulo: caso.titulo,
            resumen: caso.resumen,
            clienteId: caso.clienteId,
            testimonio: caso.testimonio,
            autor: caso.autor,
            cargoAutor: caso.cargoAutor,
            imagenUrl: caso.imagenUrl,
            publicado: caso.publicado,
          }}
          textoBoton="Guardar cambios"
        />
      </div>
    </main>
  );
}
