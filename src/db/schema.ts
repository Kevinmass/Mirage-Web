// Punto central que agrega el schema de kernel/ y modules/ para
// drizzle-kit. Tablas del kernel sin prefijo (persona, nodo...); tablas de
// módulo prefijadas con su nombre (clientes_cliente, proyectos_tarea...).
export * from "../kernel/auditoria/schema";
export * from "../modules/contenido/schema";
