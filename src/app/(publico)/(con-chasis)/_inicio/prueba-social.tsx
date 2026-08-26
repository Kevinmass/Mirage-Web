import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Revelado } from "@/components/revelado";
import { listarCasosPublicados } from "@/modules/contenido/api";

// §8.1.6 — con dos clientes activos esto es chico a propósito: mejor
// chico y verdadero que grande e inflado. Los testimonios con cita y
// autor (`contenido_caso.testimonio`) son la migración del PR 5; acá se
// muestran los casos ya publicados tal como existen hoy.
export async function PruebaSocial() {
  const casos = (await listarCasosPublicados()).slice(0, 2);

  if (casos.length === 0) return null;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {casos.map((caso, indice) => (
          <Revelado key={caso.id} indice={indice}>
            <Card className="h-full shadow-md">
              <CardContent className="flex flex-col gap-2">
                <CardTitle className="font-heading text-h3">
                  {caso.titulo}
                </CardTitle>
                <CardDescription>{caso.resumen}</CardDescription>
              </CardContent>
            </Card>
          </Revelado>
        ))}
      </div>
      <div className="self-center">
        <Button render={<Link href="/casos">Ver todos los casos</Link>} variant="secondary" />
      </div>
    </div>
  );
}
