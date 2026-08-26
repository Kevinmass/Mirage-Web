import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listarCasosPublicados } from "@/modules/contenido/api";

export const revalidate = 3600;
export const metadata: Metadata = { title: "Casos" };

export default async function PaginaCasos() {
  const casos = await listarCasosPublicados().catch(() => []);

  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Casos</h1>
      {casos.length === 0 ? (
        <p className="mt-4 text-muted-foreground">
          Todavía no hay casos publicados.
        </p>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {casos.map((caso) => (
            <Card key={caso.id}>
              <CardHeader>
                <CardTitle>{caso.titulo}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{caso.resumen}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
