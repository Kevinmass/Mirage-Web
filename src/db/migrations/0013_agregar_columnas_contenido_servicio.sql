ALTER TABLE "contenido_servicio" ADD COLUMN "slug" varchar(255);--> statement-breakpoint
ALTER TABLE "contenido_servicio" ADD COLUMN "cuerpo" text;--> statement-breakpoint
ALTER TABLE "contenido_servicio" ADD COLUMN "imagen_url" text;--> statement-breakpoint
ALTER TABLE "contenido_servicio" ADD COLUMN "color" varchar(32);--> statement-breakpoint
ALTER TABLE "contenido_servicio" ADD COLUMN "proyecto_origen_id" integer;--> statement-breakpoint
ALTER TABLE "contenido_servicio" ADD CONSTRAINT "contenido_servicio_slug_unique" UNIQUE("slug");