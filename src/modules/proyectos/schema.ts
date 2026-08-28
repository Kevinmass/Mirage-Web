import { sql } from "drizzle-orm";
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { persona } from "@/kernel/identidad/schema";
import { nodo } from "@/kernel/organigrama/schema";

// diseño §6.3. clienteId sin FK a propósito: clientes es otro módulo y
// los módulos no comparten schema entre sí, solo api.ts (mismo patrón
// que contenido_caso.cliente_id) — se valida en api.ts llamando a
// modules/clientes/api.
export const proyectosProyecto = pgTable("proyectos_proyecto", {
  id: serial("id").primaryKey(),
  // Nullable (diseño §8.10, PR 10): un proyecto interno — R&D, tooling
  // propio — es normal sin cliente, no un dato faltante.
  clienteId: integer("cliente_id"),
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
  // null = sin límite (diseño §1.1, PR 10). El líder lo cambia cuando
  // quiere — api.ts exige que quien cambia sea el líder inscripto, no
  // un permiso de kernel/permisos.
  cupo: integer("cupo"),
  color: text("color"),
  imagenUrl: text("imagen_url"),
  creadoEn: timestamp("creado_en", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Quién está haciendo el proyecto hoy — distinto de nodoResponsableId,
// que es qué responsabilidad es dueña del trabajo (diseño §1.1: las dos
// preguntas hacen falta, no se reemplazan). "Mis proyectos" sale de
// acá, nunca de los nodos.
export const proyectosInscripcion = pgTable(
  "proyectos_inscripcion",
  {
    id: serial("id").primaryKey(),
    proyectoId: integer("proyecto_id")
      .notNull()
      .references(() => proyectosProyecto.id),
    personaId: integer("persona_id")
      .notNull()
      .references(() => persona.id),
    rol: text("rol", { enum: ["lider", "miembro"] })
      .notNull()
      .default("miembro"),
    inscriptoEn: timestamp("inscripto_en", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Nadie se anota dos veces al mismo proyecto.
    uniqueIndex("proyectos_inscripcion_persona_unica").on(
      t.proyectoId,
      t.personaId,
    ),
    // Un proyecto tiene como máximo un líder — mismo patrón que
    // asignacion_titular_vigente_unico en el organigrama.
    uniqueIndex("proyectos_inscripcion_lider_unico")
      .on(t.proyectoId)
      .where(sql`${t.rol} = 'lider'`),
  ],
);

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
  // Nivel de prioridad de la tarjeta en el Kanban (diseño §8.11, PR 11)
  // — no fija un enum el diseño en sí, es una decisión de producto
  // razonable, mismo criterio que solicitudes_solicitud.tipo.
  prioridad: text("prioridad", { enum: ["baja", "media", "alta"] })
    .notNull()
    .default("media"),
  nodoResponsableId: integer("nodo_responsable_id")
    .notNull()
    .references(() => nodo.id),
  personaAsignadaId: integer("persona_asignada_id").references(
    () => persona.id,
  ),
  // El Gantt necesita inicio, no solo vencimiento (PR 11).
  empiezaEn: timestamp("empieza_en", { withTimezone: true }),
  venceEn: timestamp("vence_en", { withTimezone: true }),
  creadoEn: timestamp("creado_en", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completadaEn: timestamp("completada_en", { withTimezone: true }),
});

// Marcadores del Gantt (diseño §8.11, PR 11): rombo sobre la línea de
// tiempo con nombre y color propios, no atados a ninguna tarea puntual.
export const proyectosHito = pgTable("proyectos_hito", {
  id: serial("id").primaryKey(),
  proyectoId: integer("proyecto_id")
    .notNull()
    .references(() => proyectosProyecto.id),
  nombre: text("nombre").notNull(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  color: text("color"),
});

export const proyectosRepositorio = pgTable("proyectos_repositorio", {
  id: serial("id").primaryKey(),
  proyectoId: integer("proyecto_id")
    .notNull()
    .references(() => proyectosProyecto.id),
  owner: text("owner").notNull(),
  repo: text("repo").notNull(),
  agregadoEn: timestamp("agregado_en", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Una fila por repositorio, que el job de sync (cada 30 min, nunca en
// el request — diseño §6.3) sobreescribe. Los campos de datos quedan
// nullable: la primera sincronización puede fallar antes de escribir
// nada. actualizadoEn se pisa siempre, haya éxito o error — es la
// fecha del último intento, no del último éxito; error se limpia en
// éxito y se llena en falla, sin tocar los números viejos.
export const proyectosRepositorioSnapshot = pgTable(
  "proyectos_repositorio_snapshot",
  {
    repositorioId: integer("repositorio_id")
      .primaryKey()
      .references(() => proyectosRepositorio.id),
    commitsTotal: integer("commits_total"),
    prsAbiertas: integer("prs_abiertas"),
    prsCerradas: integer("prs_cerradas"),
    contribuyentes: integer("contribuyentes"),
    ultimoCommitEn: timestamp("ultimo_commit_en", { withTimezone: true }),
    actualizadoEn: timestamp("actualizado_en", { withTimezone: true })
      .notNull()
      .defaultNow(),
    error: text("error"),
  },
);
