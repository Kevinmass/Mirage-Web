import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Revelado } from "@/components/revelado";
import { listarCasosPublicados } from "@/modules/contenido/api";

// §8.1.6 — con dos clientes activos esto es chico a propósito: mejor
// chico y verdadero que grande e inflado. Usa el testimonio con cita y
// autor cuando ya está cargado (contenido_caso.testimonio, PR 5); si
// todavía no lo autorizaron, cae al resumen del caso.
// .catch(() => []) tolera que la base no esté disponible en build —
// mismo motivo que en <ServiciosDestacados>.
export async function PruebaSocial() {
  const casos = (await listarCasosPublicados().catch(() => [])).slice(0, 2);

  if (casos.length === 0) return null;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {casos.map((caso, indice) => (
          <Revelado key={caso.id} indice={indice}>
            <Card className="h-full shadow-md">
              <CardContent className="flex flex-col gap-2">
                {caso.testimonio ? (
                  <>
                    <blockquote className="font-heading text-h3 leading-snug font-medium">
                      “{caso.testimonio}”
                    </blockquote>
                    {caso.autor && (
                      <CardDescription>
                        {caso.autor}
                        {caso.cargoAutor ? `, ${caso.cargoAutor}` : null}
                      </CardDescription>
                    )}
                  </>
                ) : (
                  <>
                    <CardTitle className="font-heading text-h3">
                      {caso.titulo}
                    </CardTitle>
                    <CardDescription>{caso.resumen}</CardDescription>
                  </>
                )}
              </CardContent>
            </Card>
          </Revelado>
        ))}
      </div>
      <div className="self-center">
        <Button
          render={<Link href="/casos">Ver todos los casos</Link>}
          variant="secondary"
        />
      </div>
    </div>
  );
}
