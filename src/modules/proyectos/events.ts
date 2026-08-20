// diseño §7: eventos de v1 que este módulo publica. No se suscribe a
// nada todavía.
declare module "@/kernel/eventos/bus" {
  interface EventosRegistrados {
    "proyecto.creado": { proyectoId: number; clienteId: number };
    "proyecto.estado_cambiado": {
      proyectoId: number;
      estadoAnterior: string;
      estadoNuevo: string;
    };
    "tarea.asignada": { tareaId: number; personaId: number };
  }
}

export {};
