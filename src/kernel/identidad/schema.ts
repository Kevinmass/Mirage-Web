import { boolean, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Tablas de better-auth (diseño §4.1: "la librería de autenticación es
// dueña de sus tablas `usuario`, `sesion`, `cuenta`"). Nombres de TABLA
// en español porque el diseño los pide explícitamente así; nombres de
// CAMPO en el default de better-auth (name, email, emailVerified...) sin
// traducir — better-auth los referencia por esa clave exacta cuando se
// le pasa un schema propio (ver auth.ts), y traducirlos es superficie
// para un mapeo mal hecho sin ningún beneficio real (no son texto que
// vea un usuario). Confirmado contra el paquete instalado
// (better-auth@1.7.1, getAuthTables), no contra la documentación —
// ver auth.ts.
export const usuario = pgTable("usuario", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sesion = pgTable("sesion", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => usuario.id, { onDelete: "cascade" }),
});

export const cuenta = pgTable("cuenta", {
  id: text("id").primaryKey(),
  issuer: text("issuer").notNull(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => usuario.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const verificacion = pgTable("verificacion", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// persona: modelo de dominio, aparte de las tablas de better-auth
// (diseño §4.1). usuario_id nullable a propósito: una persona puede
// existir antes de tener acceso — un contacto de cliente al que
// todavía no se invitó.
export const persona = pgTable("persona", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  apellido: text("apellido").notNull(),
  email: text("email").notNull().unique(),
  // E.164 (+5491122334455), validado al escribir — ver api.ts.
  telefono: text("telefono"),
  tipo: text("tipo", { enum: ["empleado", "contacto_cliente"] }).notNull(),
  usuarioId: text("usuario_id")
    .unique()
    .references(() => usuario.id),
  activo: boolean("activo").notNull().default(true),
  creadoEn: timestamp("creado_en", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
