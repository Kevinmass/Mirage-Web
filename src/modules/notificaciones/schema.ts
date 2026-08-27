import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { persona } from "@/kernel/identidad/schema";

// diseño §6.5. ultimo_intento_en no está en la lista de columnas del
// diseño, pero hace falta para el backoff exponencial (1/2/4/8/16
// min): sin un ancla de tiempo del último intento, no hay forma de
// saber si "ya toca" reintentar.
export const notificacionesNotificacion = pgTable(
  "notificaciones_notificacion",
  {
    id: serial("id").primaryKey(),
    destinatarioPersonaId: integer("destinatario_persona_id")
      .notNull()
      .references(() => persona.id),
    plantilla: text("plantilla").notNull(),
    datos: jsonb("datos").notNull(),
    estado: text("estado", {
      enum: ["pendiente", "enviada", "fallida"],
    })
      .notNull()
      .default("pendiente"),
    intentos: integer("intentos").notNull().default(0),
    error: text("error"),
    creadoEn: timestamp("creado_en", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ultimoIntentoEn: timestamp("ultimo_intento_en", { withTimezone: true }),
    enviadoEn: timestamp("enviado_en", { withTimezone: true }),
    // PR 12: la campana del interno necesita leído/no leído, y esta
    // fila ya es "una notificación para esta persona, sobre este
    // evento" — reusar la cola de mails en vez de crear una tabla
    // nueva para el feed en pantalla (mismo dato, dos consumidores:
    // el worker de mail y la campana). Nullable porque toda fila
    // existente antes de este PR nace sin leer.
    leidaEn: timestamp("leida_en", { withTimezone: true }),
  },
);
