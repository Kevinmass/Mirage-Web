import { listarPersonas } from "@/kernel/identidad/personas";
import { obtenerArbolCompleto } from "@/kernel/organigrama/arbol";
import { crearClienteAction } from "../actions";
import { FormularioCliente } from "../formulario-cliente";

export default async function PaginaNuevoCliente() {
  const [nodos, personas] = await Promise.all([
    obtenerArbolCompleto(),
    listarPersonas(),
  ]);
  const empleados = personas.filter((p) => p.tipo === "empleado" && p.activo);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-h3 font-heading font-semibold">Nuevo cliente</h1>
      <div className="mt-6">
        <FormularioCliente
          action={crearClienteAction}
          nodos={nodos}
          personas={empleados}
          textoBoton="Crear"
        />
      </div>
    </main>
  );
}
