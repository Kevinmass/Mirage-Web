import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
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

const VARIANTE_ESTADO: Record<
  string,
  "outline" | "accent" | "primary" | "destructive"
> = {
  propuesto: "outline",
  activo: "primary",
  pausado: "accent",
  terminado: "primary",
  cancelado: "destructive",
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
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Tus proyectos
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-3xl font-semibold">{proyecto.nombre}</h1>
          <Badge variant={VARIANTE_ESTADO[proyecto.estado]}>
            {ETIQUETA_ESTADO[proyecto.estado]}
          </Badge>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
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
