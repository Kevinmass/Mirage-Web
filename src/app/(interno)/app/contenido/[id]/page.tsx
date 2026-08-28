import { notFound } from "next/navigation";
import { NoEncontrado } from "@/kernel/errores";
import { obtenerServicio } from "@/modules/contenido/api";
import { listarProyectos } from "@/modules/proyectos/api";
import { actualizarServicioAction } from "../actions";
import { FormularioServicio } from "../formulario-servicio";

export default async function PaginaEditarServicio({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [servicio, proyectos] = await Promise.all([
    obtenerServicio(Number(id)).catch((error) => {
      if (error instanceof NoEncontrado) return undefined;
      throw error;
    }),
    listarProyectos(),
  ]);
  if (!servicio) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-h3 font-heading font-semibold">Editar servicio</h1>
      <p className="text-sm text-muted-foreground">
        /servicios/{servicio.slug}
      </p>
      <div className="mt-6">
        <FormularioServicio
          action={actualizarServicioAction.bind(null, servicio.id)}
          proyectos={proyectos}
          valoresIniciales={{
            nombre: servicio.nombre,
            descripcion: servicio.descripcion,
            cuerpo: servicio.cuerpo,
            imagenUrl: servicio.imagenUrl,
            color: servicio.color,
            proyectoOrigenId: servicio.proyectoOrigenId,
            orden: servicio.orden,
            activo: servicio.activo,
          }}
          textoBoton="Guardar cambios"
        />
      </div>
    </main>
  );
}
