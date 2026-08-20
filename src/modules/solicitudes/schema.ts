import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { persona } from "@/kernel/identidad/schema";
import { nodo } from "@/kernel/organigrama/schema";

// diseño §6.4 — el módulo que reemplaza el WhatsApp. cliente_id y
// proyecto_id sin FK a propósito: clientes y proyectos son otros
// módulos, la regla de fronteras es entre ellos (mismo patrón que
// proyectos_proyecto.cliente_id) — se validan en api.ts.
//
// tipo no tiene un enum fijado en el diseño (a diferencia de estado);
// esta lista es una decisión de producto razonable, no algo que el
// diseño exigiera puntualmente — fácil de ajustar después si no
// encaja con cómo Mirage clasifica sus pedidos en la práctica.
export const solicitudesSolicitud = pgTable("solicitudes_solicitud", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id").notNull(),
  creadaPorPersonaId: integer("creada_por_persona_id")
    .notNull()
    .references(() => persona.id),
  titulo: text("titulo").notNull(),
  descripcion: text("descripcion").notNull(),
  tipo: text("tipo", {
    enum: ["funcionalidad_nueva", "bug", "consulta", "otro"],
  }).notNull(),
  estado: text("estado", {
    enum: ["recibida", "en_evaluacion", "aceptada", "rechazada"],
  })
    .notNull()
    .default("recibida"),
  // Heredado del cliente al crear (diseño: el cliente nunca elige un
  // nodo — no ve el organigrama, §8). FK a nodo sí, porque nodo es del
  // kernel, no de otro módulo.
  nodoResponsableId: integer("nodo_responsable_id")
    .notNull()
    .references(() => nodo.id),
  // null hasta que se acepta.
  proyectoId: integer("proyecto_id"),
  creadoEn: timestamp("creado_en", { withTimezone: true })
    .notNull()
    .defaultNow(),
  resueltoEn: timestamp("resuelto_en", { withTimezone: true }),
});

export const solicitudesMensaje = pgTable("solicitudes_mensaje", {
  id: serial("id").primaryKey(),
  solicitudId: integer("solicitud_id")
    .notNull()
    .references(() => solicitudesSolicitud.id),
  personaId: integer("persona_id")
    .notNull()
    .references(() => persona.id),
  cuerpo: text("cuerpo").notNull(),
  // Permite discutir internamente en el mismo hilo (diseño §6.4) — sin
  // esto la conversación interna vuelve a WhatsApp y se pierde el
  // contexto.
  visibleParaCliente: boolean("visible_para_cliente").notNull().default(true),
  creadoEn: timestamp("creado_en", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
