CREATE TABLE "contenido_caso" (
	"id" serial PRIMARY KEY NOT NULL,
	"titulo" text NOT NULL,
	"cliente_id" integer,
	"resumen" text NOT NULL,
	"publicado" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contenido_pagina" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"titulo" text NOT NULL,
	"cuerpo" text NOT NULL,
	"publicada" boolean DEFAULT false NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contenido_pagina_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "contenido_servicio" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"activo" boolean DEFAULT true NOT NULL
);
