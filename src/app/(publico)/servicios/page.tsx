import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listarServiciosActivos } from "@/modules/contenido/api";

export const revalidate = 3600;
export const metadata: Metadata = { title: "Servicios" };

export default async function PaginaServicios() {
  const servicios = await listarServiciosActivos().catch(() => []);

  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Servicios</h1>
      {servicios.length === 0 ? (
        <p className="mt-4 text-muted-foreground">
          Todavía no hay servicios publicados.
        </p>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {servicios.map((servicio) => (
            <Card key={servicio.id}>
              <CardHeader>
                <CardTitle>{servicio.nombre}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{servicio.descripcion}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
