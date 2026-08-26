import { HelpCircle, Mail, MessageCircle, Phone, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { tiempoRelativo } from "@/lib/tiempo-relativo";
import type { InteraccionDeCliente } from "@/modules/clientes/api";

const ICONO_TIPO: Record<InteraccionDeCliente["tipo"], LucideIcon> = {
  llamada: Phone,
  mail: Mail,
  reunion: Users,
  whatsapp: MessageCircle,
  otro: HelpCircle,
};

const ETIQUETA_TIPO: Record<InteraccionDeCliente["tipo"], string> = {
  llamada: "Llamada",
  mail: "Mail",
  reunion: "Reunión",
  whatsapp: "WhatsApp",
  otro: "Otro",
};

// Vertical, con ícono por tipo (diseño §8.9) — es la memoria de la
// relación que hoy vive dispersa en WhatsApp y en la cabeza de quien
// atendió.
export function LineaDeTiempo({
  interacciones,
}: {
  interacciones: InteraccionDeCliente[];
}) {
  if (interacciones.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no se registró ninguna interacción.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-4">
      {interacciones.map((i) => {
        const Icono = ICONO_TIPO[i.tipo];
        return (
          <li key={i.id} className="flex gap-3">
            <div className="flex shrink-0 flex-col items-center">
              <div className="flex size-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <Icono className="size-4" aria-hidden />
              </div>
              <div className="mt-1 w-px flex-1 bg-border" aria-hidden />
            </div>
            <div className="flex flex-col gap-0.5 pb-2">
              <p className="text-sm">
                <span className="font-medium">{ETIQUETA_TIPO[i.tipo]}</span>{" "}
                <span className="text-muted-foreground">
                  con {i.nombre} {i.apellido}
                </span>
              </p>
              <p className="text-sm">{i.resumen}</p>
              <time
                dateTime={i.fecha.toISOString()}
                title={i.fecha.toLocaleString("es-AR")}
                className="text-xs text-muted-foreground"
              >
                {tiempoRelativo(i.fecha)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
