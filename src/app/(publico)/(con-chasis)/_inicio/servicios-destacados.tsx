import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { Revelado } from "@/components/revelado";
import { listarServiciosActivos } from "@/modules/contenido/api";

// §8.1.5 — tres servicios traídos de la base (contenido_servicio, que ya
// existe), con enlace a /servicios. La página de detalle por slug es del
// PR 4; acá el enlace es siempre al listado completo.
export async function ServiciosDestacados() {
  const servicios = (await listarServiciosActivos()).slice(0, 3);

  return (
    <div className="flex flex-col gap-8">
      {servicios.length === 0 ? (
        <EstadoVacio
          titulo="Todavía no hay servicios publicados."
          descripcion="Se están cargando desde /app/contenido."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {servicios.map((servicio, indice) => (
            <Revelado key={servicio.id} indice={indice}>
              <Card className="h-full shadow-md transition-shadow hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="font-heading text-h3">
                    {servicio.nombre}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="line-clamp-3">
                    {servicio.descripcion}
                  </CardDescription>
                </CardContent>
              </Card>
            </Revelado>
          ))}
        </div>
      )}
      <div className="self-center">
        <Button render={<Link href="/servicios">Ver todos los servicios</Link>} variant="secondary" />
      </div>
    </div>
  );
}
