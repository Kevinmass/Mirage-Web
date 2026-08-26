import { listarProyectos } from "@/modules/proyectos/api";
import { crearServicioAction } from "../actions";
import { FormularioServicio } from "../formulario-servicio";

export default async function PaginaNuevoServicio() {
  const proyectos = await listarProyectos();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Nuevo servicio</h1>
      <div className="mt-6">
        <FormularioServicio
          action={crearServicioAction}
          proyectos={proyectos}
          textoBoton="Crear servicio"
        />
      </div>
    </main>
  );
}
