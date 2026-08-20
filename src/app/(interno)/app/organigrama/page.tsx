import { obtenerArbolCompleto } from "@/kernel/organigrama/arbol";
import { OrganigramaCliente } from "./organigrama-cliente";

export default async function PaginaOrganigrama() {
  const nodos = await obtenerArbolCompleto();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Organigrama</h1>
      <div className="mt-6">
        <OrganigramaCliente nodos={nodos} />
      </div>
    </main>
  );
}
