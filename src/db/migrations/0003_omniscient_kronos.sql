CREATE TABLE "capacidad" (
	"clave" text PRIMARY KEY NOT NULL,
	"modulo" text NOT NULL,
	"descripcion" text NOT NULL,
	"huerfana" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "persona_rol" (
	"persona_id" integer NOT NULL,
	"rol_id" integer NOT NULL,
	CONSTRAINT "persona_rol_persona_id_rol_id_pk" PRIMARY KEY("persona_id","rol_id")
);
--> statement-breakpoint
CREATE TABLE "rol" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	CONSTRAINT "rol_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "rol_capacidad" (
	"rol_id" integer NOT NULL,
	"capacidad_clave" text NOT NULL,
	CONSTRAINT "rol_capacidad_rol_id_capacidad_clave_pk" PRIMARY KEY("rol_id","capacidad_clave")
);
--> statement-breakpoint
ALTER TABLE "persona_rol" ADD CONSTRAINT "persona_rol_rol_id_rol_id_fk" FOREIGN KEY ("rol_id") REFERENCES "public"."rol"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rol_capacidad" ADD CONSTRAINT "rol_capacidad_rol_id_rol_id_fk" FOREIGN KEY ("rol_id") REFERENCES "public"."rol"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rol_capacidad" ADD CONSTRAINT "rol_capacidad_capacidad_clave_capacidad_clave_fk" FOREIGN KEY ("capacidad_clave") REFERENCES "public"."capacidad"("clave") ON DELETE no action ON UPDATE no action;