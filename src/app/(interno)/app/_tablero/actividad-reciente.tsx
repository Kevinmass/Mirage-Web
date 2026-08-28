import { Activity } from "lucide-react";
import { listarEventosRecientes } from "@/kernel/auditoria/registro";
import { TableroVacio } from "@/components/ui/tablero-vacio";
import { tiempoRelativo } from "@/lib/tiempo-relativo";

// Del registro de auditoría, no del bus de eventos en sí (el bus es
// pub/sub en proceso, no persiste nada que se pueda listar después) —
// hoy solo contenido llama a registrarEvento (PR 4/5), así que esto se
// va a ver chico hasta que el resto de los módulos lo haga también.
export async function ActividadReciente() {
  const eventos = await listarEventosRecientes(8).catch(() => []);

  if (eventos.length === 0) {
    return (
      <TableroVacio
        icono={Activity}
        texto="Todavía no hay actividad registrada."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {eventos.map((evento) => (
        <li
          key={evento.id}
          className="flex flex-col gap-0.5 rounded-md px-2 py-2 text-sm"
        >
          <span className="truncate">{evento.accion}</span>
          <time
            dateTime={evento.creadoEn.toISOString()}
            title={evento.creadoEn.toLocaleString("es-AR")}
            className="text-xs text-muted-foreground"
          >
            {tiempoRelativo(evento.creadoEn)}
          </time>
        </li>
      ))}
    </ul>
  );
}
