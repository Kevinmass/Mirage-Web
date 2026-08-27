CREATE TABLE "proyectos_hito" (
	"id" serial PRIMARY KEY NOT NULL,
	"proyecto_id" integer NOT NULL,
	"nombre" text NOT NULL,
	"fecha" timestamp with time zone NOT NULL,
	"color" text
);
--> statement-breakpoint
ALTER TABLE "proyectos_tarea" ADD COLUMN "prioridad" text DEFAULT 'media' NOT NULL;--> statement-breakpoint
ALTER TABLE "proyectos_tarea" ADD COLUMN "empieza_en" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "proyectos_hito" ADD CONSTRAINT "proyectos_hito_proyecto_id_proyectos_proyecto_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos_proyecto"("id") ON DELETE no action ON UPDATE no action;