CREATE TABLE "clientes_cliente" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"cuit" text NOT NULL,
	"estado" text DEFAULT 'activo' NOT NULL,
	"nodo_responsable_id" integer NOT NULL,
	"contacto_directo_id" integer NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clientes_cliente_cuit_unique" UNIQUE("cuit")
);
--> statement-breakpoint
CREATE TABLE "clientes_contacto" (
	"id" serial PRIMARY KEY NOT NULL,
	"cliente_id" integer NOT NULL,
	"persona_id" integer NOT NULL,
	"cargo" text,
	"es_principal" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clientes_interaccion" (
	"id" serial PRIMARY KEY NOT NULL,
	"cliente_id" integer NOT NULL,
	"persona_id" integer NOT NULL,
	"tipo" text NOT NULL,
	"fecha" timestamp with time zone DEFAULT now() NOT NULL,
	"resumen" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clientes_cliente" ADD CONSTRAINT "clientes_cliente_nodo_responsable_id_nodo_id_fk" FOREIGN KEY ("nodo_responsable_id") REFERENCES "public"."nodo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clientes_cliente" ADD CONSTRAINT "clientes_cliente_contacto_directo_id_persona_id_fk" FOREIGN KEY ("contacto_directo_id") REFERENCES "public"."persona"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clientes_contacto" ADD CONSTRAINT "clientes_contacto_cliente_id_clientes_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes_cliente"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clientes_contacto" ADD CONSTRAINT "clientes_contacto_persona_id_persona_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."persona"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clientes_interaccion" ADD CONSTRAINT "clientes_interaccion_cliente_id_clientes_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes_cliente"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clientes_interaccion" ADD CONSTRAINT "clientes_interaccion_persona_id_persona_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."persona"("id") ON DELETE no action ON UPDATE no action;