CREATE TABLE "proyectos_inscripcion" (
	"id" serial PRIMARY KEY NOT NULL,
	"proyecto_id" integer NOT NULL,
	"persona_id" integer NOT NULL,
	"rol" text DEFAULT 'miembro' NOT NULL,
	"inscripto_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proyectos_proyecto" ADD COLUMN "cupo" integer;--> statement-breakpoint
ALTER TABLE "proyectos_proyecto" ADD COLUMN "color" text;--> statement-breakpoint
ALTER TABLE "proyectos_proyecto" ADD COLUMN "imagen_url" text;--> statement-breakpoint
ALTER TABLE "proyectos_inscripcion" ADD CONSTRAINT "proyectos_inscripcion_proyecto_id_proyectos_proyecto_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos_proyecto"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proyectos_inscripcion" ADD CONSTRAINT "proyectos_inscripcion_persona_id_persona_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."persona"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "proyectos_inscripcion_persona_unica" ON "proyectos_inscripcion" USING btree ("proyecto_id","persona_id");--> statement-breakpoint
CREATE UNIQUE INDEX "proyectos_inscripcion_lider_unico" ON "proyectos_inscripcion" USING btree ("proyecto_id") WHERE "proyectos_inscripcion"."rol" = 'lider';