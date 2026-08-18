import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
} from "drizzle-orm/pg-core";

export const rol = pgTable("rol", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull().unique(),
  descripcion: text("descripcion"),
});

export const capacidad = pgTable("capacidad", {
  clave: text("clave").primaryKey(), // p.ej. 'clientes.ver'
  modulo: text("modulo").notNull(),
  descripcion: text("descripcion").notNull(),
  // Un módulo dejó de declararla pero puede que algún rol todavía la
  // tenga asignada — borrarla borraría en cascada quién la tenía. Se
  // marca huérfana y queda para revisión manual, no se borra sola.
  huerfana: boolean("huerfana").notNull().default(false),
});

export const rolCapacidad = pgTable(
  "rol_capacidad",
  {
    rolId: integer("rol_id")
      .notNull()
      .references(() => rol.id),
    capacidadClave: text("capacidad_clave")
      .notNull()
      .references(() => capacidad.clave),
  },
  (t) => [primaryKey({ columns: [t.rolId, t.capacidadClave] })],
);

export const personaRol = pgTable(
  "persona_rol",
  {
    // Sin FK todavía: persona (kernel/identidad) llega en el PR 3.1.
    personaId: integer("persona_id").notNull(),
    rolId: integer("rol_id")
      .notNull()
      .references(() => rol.id),
  },
  (t) => [primaryKey({ columns: [t.personaId, t.rolId] })],
);
