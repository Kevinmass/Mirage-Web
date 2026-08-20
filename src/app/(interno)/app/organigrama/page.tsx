import { listarPersonas } from "@/kernel/identidad/personas";
import { obtenerArbolCompleto } from "@/kernel/organigrama/arbol";
import { OrganigramaCliente } from "./organigrama-cliente";

export default async function PaginaOrganigrama() {
  const [nodos, personas] = await Promise.all([
    obtenerArbolCompleto(),
    listarPersonas(),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Organigrama</h1>
      <div className="mt-6">
        <OrganigramaCliente
          nodos={nodos}
          personas={personas
            .filter((p) => p.activo)
            .map((p) => ({ id: p.id, nombre: p.nombre, apellido: p.apellido }))}
        />
      </div>
    </main>
  );
}
