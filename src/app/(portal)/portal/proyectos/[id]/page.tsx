import Link from "next/link";
import { notFound } from "next/navigation";
import { NoEncontrado } from "@/kernel/errores";
import { obtenerSesionPortal } from "@/lib/sesion-portal";
import { obtenerProyectoDeCliente } from "@/modules/proyectos/api";

const ETIQUETA_ESTADO: Record<string, string> = {
  propuesto: "Propuesto",
  activo: "Activo",
  pausado: "Pausado",
  terminado: "Terminado",
  cancelado: "Cancelado",
};

// Diseño §8, PR 7.7: acá solo va lo que obtenerProyectoDeCliente
// devuelve — nombre, estado, progreso. Nunca commits, PRs,
// contribuyentes, tareas individuales, nodos ni asignaciones: esos
// campos ni siquiera llegan a este componente, así que no hay forma
// de que terminen en el HTML por error.
export default async function PaginaProyectoPortal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idNumerico = Number(id);
  if (!Number.isInteger(idNumerico)) {
    notFound();
  }

  const sesion = await obtenerSesionPortal();
  if (!sesion) {
    return (
      <main>
        <p className="text-muted-foreground">
          Tu cuenta no está asociada a ningún cliente todavía.
        </p>
      </main>
    );
  }

  const proyecto = await obtenerProyectoDeCliente(
    sesion.clienteId,
    idNumerico,
  ).catch((error) => {
    if (error instanceof NoEncontrado) {
      notFound();
    }
    throw error;
  });

  const porcentaje =
    proyecto.totales === 0
      ? 0
      : Math.round((proyecto.hechas / proyecto.totales) * 100);

  return (
    <main className="flex flex-col gap-6">
      <div>
        <Link
          href="/portal/proyectos"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Tus proyectos
        </Link>
        <h1 className="mt-2 text-3xl font-semibold">{proyecto.nombre}</h1>
        <p className="text-sm text-muted-foreground">
          {ETIQUETA_ESTADO[proyecto.estado]}
        </p>
      </div>

      <div className="rounded-lg border bg-background p-6">
        <p className="text-lg font-medium">{porcentaje}% completado</p>
        <div className="mt-2 h-3 w-full rounded-full bg-muted">
          <div
            className="h-3 rounded-full bg-primary"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>
    </main>
  );
}
