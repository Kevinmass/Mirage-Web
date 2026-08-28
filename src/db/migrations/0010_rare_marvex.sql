CREATE TABLE "notificaciones_notificacion" (
	"id" serial PRIMARY KEY NOT NULL,
	"destinatario_persona_id" integer NOT NULL,
	"plantilla" text NOT NULL,
	"datos" jsonb NOT NULL,
	"estado" text DEFAULT 'pendiente' NOT NULL,
	"intentos" integer DEFAULT 0 NOT NULL,
	"error" text,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"ultimo_intento_en" timestamp with time zone,
	"enviado_en" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "notificaciones_notificacion" ADD CONSTRAINT "notificaciones_notificacion_destinatario_persona_id_persona_id_fk" FOREIGN KEY ("destinatario_persona_id") REFERENCES "public"."persona"("id") ON DELETE no action ON UPDATE no action;