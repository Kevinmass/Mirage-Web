// diseño §7: eventos de v1 que este módulo publica. No se suscribe a
// nada todavía.
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
      clienteId: number;
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
    "tarea.asignada": { tareaId: number; personaId: number; titulo: string };
  }
}

export {};
