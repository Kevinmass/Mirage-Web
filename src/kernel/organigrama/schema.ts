import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { persona } from "@/kernel/identidad/schema";

// diseño §4.2. El anillo (profundidad) se calcula con WITH RECURSIVE, no
// se guarda acá — ver api.ts (PR 3.4).
export const nodo = pgTable(
  "nodo",
  {
    id: serial("id").primaryKey(),
    nombre: text("nombre").notNull(),
    descripcion: text("descripcion"),
    // null en las dos raíces, y solo ahí.
    padreId: integer("padre_id").references((): AnyPgColumn => nodo.id),
    // Solo se completa en las dos raíces — indica cuál de las dos es.
    // En cualquier otro nodo queda null; a qué raíz pertenece se
    // resuelve subiendo por padreId, no se duplica acá.
    raiz: text("raiz", { enum: ["interno", "externo"] }),
    orden: integer("orden").notNull().default(0),
    activo: boolean("activo").notNull().default(true),
    creadoEn: timestamp("creado_en", { withTimezone: true })
      .notNull()
      .defaultNow(),
    // Los nodos se archivan, no se borran — hay trabajo histórico
    // colgando. null mientras esté activo.
    archivadoEn: timestamp("archivado_en", { withTimezone: true }),
  },
  (t) => [
    // Invariante: exactamente dos raíces (una 'interno', una 'externo').
    uniqueIndex("nodo_raiz_unica")
      .on(t.raiz)
      .where(sql`${t.padreId} is null`),
  ],
);

export const asignacion = pgTable(
  "asignacion",
  {
    id: serial("id").primaryKey(),
    personaId: integer("persona_id")
      .notNull()
      .references(() => persona.id),
    nodoId: integer("nodo_id")
      .notNull()
      .references(() => nodo.id),
    esTitular: boolean("es_titular").notNull().default(false),
    desde: timestamp("desde", { withTimezone: true }).notNull().defaultNow(),
    // null significa vigente.
    hasta: timestamp("hasta", { withTimezone: true }),
  },
  (t) => [
    // Invariante: un titular vigente por nodo.
    uniqueIndex("asignacion_titular_vigente_unico")
      .on(t.nodoId)
      .where(sql`${t.esTitular} and ${t.hasta} is null`),
  ],
);
