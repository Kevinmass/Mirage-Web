// diseño §7: "cliente.creado" es uno de los eventos de v1. clientes no
// se suscribe a nada — todavía no hay ningún módulo publicando eventos
// que le interesen.
declare module "@/kernel/eventos/bus" {
  interface EventosRegistrados {
    "cliente.creado": { clienteId: number };
  }
}

export {};
