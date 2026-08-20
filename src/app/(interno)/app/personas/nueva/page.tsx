import { crearPersonaAction } from "../actions";
import { FormularioPersona } from "../formulario-persona";

export default function PaginaNuevaPersona() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Nueva persona</h1>
      <div className="mt-6">
        <FormularioPersona action={crearPersonaAction} textoBoton="Crear" />
      </div>
    </main>
  );
}
