// diseño §7: "cliente.creado" es uno de los eventos de v1. clientes no
// se suscribe a nada — todavía no hay ningún módulo publicando eventos
// que le interesen.
//
// destinatarioPersonaId (PR 6.2): notificaciones no puede importar
// modules/clientes ni siquiera su api.ts, así que no puede resolver
// "quién es el titular del nodo responsable" por su cuenta — clientes
// sí puede (tiene el nodo a mano y el kernel de organigrama es libre
// de importar), y lo resuelve antes de publicar. Null si el nodo está
// vacante: nadie a quien avisar todavía.
declare module "@/kernel/eventos/bus" {
  interface EventosRegistrados {
    "cliente.creado": {
      clienteId: number;
      nombre: string;
      destinatarioPersonaId: number | null;
    };
  }
}

export {};
