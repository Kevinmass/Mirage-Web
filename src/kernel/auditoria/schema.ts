import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// Append-only (diseño §4.4): el rol de aplicación pierde UPDATE/DELETE
// sobre esta tabla en una migración aparte (0002_revocar_update_delete_
// evento_auditoria.sql) — una auditoría editable no es auditoría.
export const eventoAuditoria = pgTable("evento_auditoria", {
  id: serial("id").primaryKey(),
  // Sin FK todavía: persona (kernel/identidad) llega en el PR 3.1.
  personaId: integer("persona_id"),
  accion: text("accion").notNull(),
  entidad: text("entidad").notNull(),
  entidadId: integer("entidad_id"),
  datos: jsonb("datos"),
  creadoEn: timestamp("creado_en", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
