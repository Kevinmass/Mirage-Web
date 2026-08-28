CREATE TABLE "asignacion" (
	"id" serial PRIMARY KEY NOT NULL,
	"persona_id" integer NOT NULL,
	"nodo_id" integer NOT NULL,
	"es_titular" boolean DEFAULT false NOT NULL,
	"desde" timestamp with time zone DEFAULT now() NOT NULL,
	"hasta" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "nodo" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	"padre_id" integer,
	"raiz" text,
	"orden" integer DEFAULT 0 NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"archivado_en" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "asignacion" ADD CONSTRAINT "asignacion_persona_id_persona_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."persona"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asignacion" ADD CONSTRAINT "asignacion_nodo_id_nodo_id_fk" FOREIGN KEY ("nodo_id") REFERENCES "public"."nodo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nodo" ADD CONSTRAINT "nodo_padre_id_nodo_id_fk" FOREIGN KEY ("padre_id") REFERENCES "public"."nodo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "asignacion_titular_vigente_unico" ON "asignacion" USING btree ("nodo_id") WHERE "asignacion"."es_titular" and "asignacion"."hasta" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "nodo_raiz_unica" ON "nodo" USING btree ("raiz") WHERE "nodo"."padre_id" is null;