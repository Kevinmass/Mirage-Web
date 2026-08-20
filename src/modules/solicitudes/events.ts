import { suscribir } from "@/kernel/eventos/bus";
import { vincularProyectoPendiente } from "./api";

// diseño §6.4/§7: los eventos de v1 que este módulo publica.
//
// destinatarioPersonaId sigue el mismo criterio que clientes/proyectos
// (PR 6.2): notificaciones no puede resolver "a quién avisar" por su
// cuenta, así que cada publicador lo resuelve antes de publicar.
//
// nodoResponsableId va en solicitud.aceptada (no en las otras) porque
// es el único evento que otro módulo (proyectos) necesita para actuar
// — crearProyecto lo pide. clienteId y descripcion van por el mismo
// motivo: proyectos arma un DatosProyecto completo solo con el
// payload, sin tener que volver a consultar solicitudes (no podría:
// no puede importar modules/solicitudes salvo este mismo archivo de
// eventos, que ni conoce).
declare module "@/kernel/eventos/bus" {
  interface EventosRegistrados {
    "solicitud.creada": {
      solicitudId: number;
      clienteId: number;
      titulo: string;
      destinatarioPersonaId: number | null;
    };
    "solicitud.aceptada": {
      solicitudId: number;
      clienteId: number;
      nodoResponsableId: number;
      titulo: string;
      descripcion: string;
      destinatarioPersonaId: number | null;
    };
    "solicitud.rechazada": {
      solicitudId: number;
      clienteId: number;
      titulo: string;
      destinatarioPersonaId: number | null;
    };
    "solicitud.mensaje_agregado": {
      solicitudId: number;
      clienteId: number;
      personaId: number;
      visibleParaCliente: boolean;
      destinatarioPersonaId: number | null;
    };
  }
}

// solicitudes se suscribe a proyecto.creado para completar su propio
// proyecto_id (diseño §6.4: "la solicitud aceptada se convierte en
// proyecto"). No puede ser al revés — proyectos no puede escribir en
// una tabla de solicitudes, ni conoce su existencia más allá de
// suscribirse a "solicitud.aceptada" (ver modules/proyectos/events.ts).
// El emparejamiento es por clienteId + estado 'aceptada' + proyectoId
// aún null, tomando el más reciente resuelto — ver el comentario de
// vincularProyectoPendiente en api.ts sobre por qué esto alcanza para
// el patrón de uso real (aceptar → crear proyecto es una sola cadena
// síncrona de await dentro de la misma Server Action) y cuál es el
// borde que no cubre.
export function suscribirseAEventos(): void {
  suscribir("proyecto.creado", async (payload) => {
    await vincularProyectoPendiente(payload.clienteId, payload.proyectoId);
  });
}

suscribirseAEventos();
