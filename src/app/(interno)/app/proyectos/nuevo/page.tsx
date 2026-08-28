import { listarClientes } from "@/modules/clientes/api";
import { obtenerArbolCompleto } from "@/kernel/organigrama/arbol";
import { FormularioProyecto } from "../formulario-proyecto";

export default async function PaginaNuevoProyecto() {
  const [clientes, nodos] = await Promise.all([
    listarClientes(),
    obtenerArbolCompleto(),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-h3 font-heading font-semibold">Nuevo proyecto</h1>
      <div className="mt-6">
        <FormularioProyecto clientes={clientes} nodos={nodos} />
      </div>
    </main>
  );
}
