import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { persona } from "@/kernel/identidad/schema";
import { nodo } from "@/kernel/organigrama/schema";

// diseño §6.3. clienteId sin FK a propósito: clientes es otro módulo y
// los módulos no comparten schema entre sí, solo api.ts (mismo patrón
// que contenido_caso.cliente_id) — se valida en api.ts llamando a
// modules/clientes/api.
export const proyectosProyecto = pgTable("proyectos_proyecto", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id").notNull(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  estado: text("estado", {
    enum: ["propuesto", "activo", "pausado", "terminado", "cancelado"],
  })
    .notNull()
    .default("propuesto"),
  nodoResponsableId: integer("nodo_responsable_id")
    .notNull()
    .references(() => nodo.id),
  fechaInicio: timestamp("fecha_inicio", { withTimezone: true }),
  fechaFinEstimada: timestamp("fecha_fin_estimada", { withTimezone: true }),
  creadoEn: timestamp("creado_en", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Por qué nodo obligatorio y persona opcional (diseño §6.3): el nodo
// dice qué responsabilidad es dueña del trabajo; la persona, quién lo
// hace hoy. Con solo persona, cuando esa persona se va la tarea queda
// huérfana. Con solo nodo, nadie sabe a quién preguntarle.
export const proyectosTarea = pgTable("proyectos_tarea", {
  id: serial("id").primaryKey(),
  proyectoId: integer("proyecto_id")
    .notNull()
    .references(() => proyectosProyecto.id),
  titulo: text("titulo").notNull(),
  descripcion: text("descripcion"),
  estado: text("estado", {
    enum: ["pendiente", "en_curso", "bloqueada", "hecha"],
  })
    .notNull()
    .default("pendiente"),
  nodoResponsableId: integer("nodo_responsable_id")
    .notNull()
    .references(() => nodo.id),
  personaAsignadaId: integer("persona_asignada_id").references(
    () => persona.id,
  ),
  venceEn: timestamp("vence_en", { withTimezone: true }),
  creadoEn: timestamp("creado_en", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completadaEn: timestamp("completada_en", { withTimezone: true }),
});
