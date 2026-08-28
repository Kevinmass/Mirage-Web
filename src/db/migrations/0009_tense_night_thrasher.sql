CREATE TABLE "proyectos_repositorio" (
	"id" serial PRIMARY KEY NOT NULL,
	"proyecto_id" integer NOT NULL,
	"owner" text NOT NULL,
	"repo" text NOT NULL,
	"agregado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proyectos_repositorio_snapshot" (
	"repositorio_id" integer PRIMARY KEY NOT NULL,
	"commits_total" integer,
	"prs_abiertas" integer,
	"prs_cerradas" integer,
	"contribuyentes" integer,
	"ultimo_commit_en" timestamp with time zone,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "proyectos_repositorio" ADD CONSTRAINT "proyectos_repositorio_proyecto_id_proyectos_proyecto_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos_proyecto"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proyectos_repositorio_snapshot" ADD CONSTRAINT "proyectos_repositorio_snapshot_repositorio_id_proyectos_repositorio_id_fk" FOREIGN KEY ("repositorio_id") REFERENCES "public"."proyectos_repositorio"("id") ON DELETE no action ON UPDATE no action;