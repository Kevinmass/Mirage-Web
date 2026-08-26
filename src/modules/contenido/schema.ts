import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const contenidoPagina = pgTable("contenido_pagina", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  titulo: text("titulo").notNull(),
  cuerpo: text("cuerpo").notNull(), // markdown
  publicada: boolean("publicada").notNull().default(false),
  actualizadoEn: timestamp("actualizado_en", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const contenidoServicio = pgTable("contenido_servicio", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion").notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  cuerpo: text("cuerpo"), // markdown, para /servicios/[slug]
  imagenUrl: text("imagen_url"),
  color: varchar("color", { length: 32 }),
  // Sin FK: proyectos es otro módulo y los módulos no comparten schema
  // entre sí, solo api.ts (mismo patrón que contenido_caso.cliente_id).
  proyectoOrigenId: integer("proyecto_origen_id"),
  orden: integer("orden").notNull().default(0),
  activo: boolean("activo").notNull().default(true),
});

export const contenidoCaso = pgTable("contenido_caso", {
  id: serial("id").primaryKey(),
  titulo: text("titulo").notNull(),
  // Nullable a propósito (diseño §6.1): por defecto el caso no nombra al
  // cliente, nombrarlo requiere autorización explícita que se pide fuera
  // del sistema. Sin FK: clientes es otro módulo (fase 4) y los módulos no
  // comparten schema entre sí, solo api.ts.
  clienteId: integer("cliente_id"),
  resumen: text("resumen").notNull(),
  publicado: boolean("publicado").notNull().default(false),
  // Los cuatro nullable (PR 5 del rediseño de frontend, §1.3): un caso
  // publicado sin testimonio sigue siendo válido (es lo que hay hoy),
  // el testimonio se completa cuando el cliente lo autoriza.
  testimonio: text("testimonio"),
  autor: text("autor"),
  cargoAutor: text("cargo_autor"),
  imagenUrl: text("imagen_url"),
});
