import { suscribir } from "@/kernel/eventos/bus";
import { crearProyecto } from "./api";

// diseño §7: eventos de v1 que este módulo publica.
//
// destinatarioPersonaId en proyecto.* (PR 6.2): mismo criterio que
// cliente.creado — notificaciones no puede resolver el titular del
// nodo responsable por su cuenta (no puede importar modules/*), así
// que proyectos lo resuelve antes de publicar. tarea.asignada no lo
// necesita: personaId ya es, sin ambigüedad, a quién notificar.
declare module "@/kernel/eventos/bus" {
  interface EventosRegistrados {
    "proyecto.creado": {
      proyectoId: number;
      clienteId: number | null;
      nombre: string;
      destinatarioPersonaId: number | null;
    };
    "proyecto.estado_cambiado": {
      proyectoId: number;
      nombre: string;
      estadoAnterior: string;
      estadoNuevo: string;
      destinatarioPersonaId: number | null;
    };
    "tarea.asignada": {
      tareaId: number;
      personaId: number;
      titulo: string;
      proyectoId: number;
    };
  }
}

// "solicitud.aceptada" es de modules/solicitudes/events.ts — proyectos
// nunca importa modules/solicitudes (ni su api.ts: la regla de
// fronteras es de un solo sentido acá, solicitudes es quien depende de
// proyectos.api para nada, y proyectos jamás depende de solicitudes).
// Alcanza con suscribirse al nombre del evento; el tipo del payload lo
// aporta la declaración de solicitudes/events.ts vía declaration
// merging global — mismo patrón que notificaciones/events.ts usa para
// "cliente.creado" sin declararlo ni importar clientes/events.ts.
//
// crearProyecto ya es idempotente en la práctica para este caso (una
// sola solicitud.aceptada dispara un solo crearProyecto), así que no
// hace falta de-duplicar acá — si este handler se disparara dos veces
// para el mismo payload sería un bug del bus, no algo que este módulo
// deba defender.
export function suscribirseAEventos(): void {
  suscribir("solicitud.aceptada", async (payload) => {
    await crearProyecto({
      clienteId: payload.clienteId,
      nombre: payload.titulo,
      descripcion: payload.descripcion,
      nodoResponsableId: payload.nodoResponsableId,
    });
  });
}

suscribirseAEventos();
