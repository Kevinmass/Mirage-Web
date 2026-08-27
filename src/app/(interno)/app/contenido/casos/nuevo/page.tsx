import { listarClientes } from "@/modules/clientes/api";
import { crearCasoAction } from "../../actions";
import { FormularioCaso } from "../../formulario-caso";

export default async function PaginaNuevoCaso() {
  const clientes = await listarClientes();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-h3 font-heading font-semibold">Nuevo caso</h1>
      <div className="mt-6">
        <FormularioCaso
          action={crearCasoAction}
          clientes={clientes}
          textoBoton="Crear caso"
        />
      </div>
    </main>
  );
}
