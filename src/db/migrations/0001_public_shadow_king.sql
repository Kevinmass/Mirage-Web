CREATE TABLE "evento_auditoria" (
	"id" serial PRIMARY KEY NOT NULL,
	"persona_id" integer,
	"accion" text NOT NULL,
	"entidad" text NOT NULL,
	"entidad_id" integer,
	"datos" jsonb,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
