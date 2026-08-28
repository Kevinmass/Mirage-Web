CREATE TABLE "proyectos_proyecto" (
	"id" serial PRIMARY KEY NOT NULL,
	"cliente_id" integer NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	"estado" text DEFAULT 'propuesto' NOT NULL,
	"nodo_responsable_id" integer NOT NULL,
	"fecha_inicio" timestamp with time zone,
	"fecha_fin_estimada" timestamp with time zone,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proyectos_tarea" (
	"id" serial PRIMARY KEY NOT NULL,
	"proyecto_id" integer NOT NULL,
	"titulo" text NOT NULL,
	"descripcion" text,
	"estado" text DEFAULT 'pendiente' NOT NULL,
	"nodo_responsable_id" integer NOT NULL,
	"persona_asignada_id" integer,
	"vence_en" timestamp with time zone,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"completada_en" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "proyectos_proyecto" ADD CONSTRAINT "proyectos_proyecto_nodo_responsable_id_nodo_id_fk" FOREIGN KEY ("nodo_responsable_id") REFERENCES "public"."nodo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proyectos_tarea" ADD CONSTRAINT "proyectos_tarea_proyecto_id_proyectos_proyecto_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos_proyecto"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proyectos_tarea" ADD CONSTRAINT "proyectos_tarea_nodo_responsable_id_nodo_id_fk" FOREIGN KEY ("nodo_responsable_id") REFERENCES "public"."nodo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proyectos_tarea" ADD CONSTRAINT "proyectos_tarea_persona_asignada_id_persona_id_fk" FOREIGN KEY ("persona_asignada_id") REFERENCES "public"."persona"("id") ON DELETE no action ON UPDATE no action;