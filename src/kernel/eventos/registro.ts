// Agrega el events.ts de cada módulo — importarlo alcanza para que
// corran sus suscripciones (suscribir(), llamado al tope de cada
// events.ts como efecto del import). Mismo patrón que
// permisos/capacidades-declaradas.ts: bus.ts, el kernel genérico, no
// conoce ningún módulo en particular; este archivo sí, y es el único
// lugar donde eso pasa. Lo dispara bus.ts solo, en publicar() — ver el
// comentario ahí sobre por qué no alcanza con llamarlo una vez al
// arrancar desde instrumentation.ts.
import "@/modules/clientes/events";
import "@/modules/contenido/events";
import "@/modules/notificaciones/events";
import "@/modules/proyectos/events";
import "@/modules/solicitudes/events";

export {};
