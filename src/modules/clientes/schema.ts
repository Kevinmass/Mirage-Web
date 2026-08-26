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
import { nodo } from "@/kernel/organigrama/schema";

// diseño §6.2. FK directas a persona/nodo (kernel): la regla de
// fronteras es entre modules/ entre sí — con el kernel cualquier módulo
// puede referenciar su schema directamente (ver arbol.ts, que ya
// referencia persona igual).
export const clientesCliente = pgTable("clientes_cliente", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  cuit: text("cuit").notNull().unique(),
  estado: text("estado", { enum: ["activo", "inactivo"] })
    .notNull()
    .default("activo"),
  // Obligatorio: qué responsabilidad responde por la cuenta.
  nodoResponsableId: integer("nodo_responsable_id")
    .notNull()
    .references(() => nodo.id),
  // Obligatorio: la cara concreta que el cliente ve en su portal.
  contactoDirectoId: integer("contacto_directo_id")
    .notNull()
    .references(() => persona.id),
  creadoEn: timestamp("creado_en", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const clientesContacto = pgTable(
  "clientes_contacto",
  {
    id: serial("id").primaryKey(),
    clienteId: integer("cliente_id")
      .notNull()
      .references(() => clientesCliente.id),
    personaId: integer("persona_id")
      .notNull()
      .references(() => persona.id),
    cargo: text("cargo"),
    esPrincipal: boolean("es_principal").notNull().default(false),
  },
  (t) => [
    // Un contacto pertenece a un único cliente — invariante de la que
    // depende todo el aislamiento del portal (diseño §8, PR 7.1): si
    // una persona pudiera ser contacto de dos clientes, "el cliente de
    // esta sesión" dejaría de tener una única respuesta. Único por
    // personaId ya cubre "no se agrega la misma persona dos veces al
    // mismo cliente" (4.3) — es la restricción más fuerte, así que el
    // índice compuesto que hacía eso solo quedaría redundante.
    uniqueIndex("clientes_contacto_persona_unica").on(t.personaId),
  ],
);

export const clientesInteraccion = pgTable("clientes_interaccion", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id")
    .notNull()
    .references(() => clientesCliente.id),
  personaId: integer("persona_id")
    .notNull()
    .references(() => persona.id),
  // "whatsapp" separado de "otro" (PR 9 del rediseño de frontend): es el
  // canal real que más se termina consultando, y antes cualquier
  // interacción por WhatsApp se perdía dentro de "otro".
  tipo: text("tipo", {
    enum: ["llamada", "mail", "reunion", "whatsapp", "otro"],
  }).notNull(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull().defaultNow(),
  resumen: text("resumen").notNull(),
});
