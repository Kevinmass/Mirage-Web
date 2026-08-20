CREATE TABLE "solicitudes_mensaje" (
	"id" serial PRIMARY KEY NOT NULL,
	"solicitud_id" integer NOT NULL,
	"persona_id" integer NOT NULL,
	"cuerpo" text NOT NULL,
	"visible_para_cliente" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "solicitudes_solicitud" (
	"id" serial PRIMARY KEY NOT NULL,
	"cliente_id" integer NOT NULL,
	"creada_por_persona_id" integer NOT NULL,
	"titulo" text NOT NULL,
	"descripcion" text NOT NULL,
	"tipo" text NOT NULL,
	"estado" text DEFAULT 'recibida' NOT NULL,
	"nodo_responsable_id" integer NOT NULL,
	"proyecto_id" integer,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"resuelto_en" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "solicitudes_mensaje" ADD CONSTRAINT "solicitudes_mensaje_solicitud_id_solicitudes_solicitud_id_fk" FOREIGN KEY ("solicitud_id") REFERENCES "public"."solicitudes_solicitud"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes_mensaje" ADD CONSTRAINT "solicitudes_mensaje_persona_id_persona_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."persona"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes_solicitud" ADD CONSTRAINT "solicitudes_solicitud_creada_por_persona_id_persona_id_fk" FOREIGN KEY ("creada_por_persona_id") REFERENCES "public"."persona"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes_solicitud" ADD CONSTRAINT "solicitudes_solicitud_nodo_responsable_id_nodo_id_fk" FOREIGN KEY ("nodo_responsable_id") REFERENCES "public"."nodo"("id") ON DELETE no action ON UPDATE no action;