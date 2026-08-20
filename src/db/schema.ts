// Punto central que agrega el schema de kernel/ y modules/ para
// drizzle-kit. Tablas del kernel sin prefijo (persona, nodo...); tablas de
// módulo prefijadas con su nombre (clientes_cliente, proyectos_tarea...).
export * from "../kernel/auditoria/schema";
export * from "../kernel/identidad/schema";
export * from "../kernel/organigrama/schema";
export * from "../kernel/permisos/schema";
export * from "../modules/clientes/schema";
export * from "../modules/contenido/schema";
export * from "../modules/notificaciones/schema";
export * from "../modules/proyectos/schema";
