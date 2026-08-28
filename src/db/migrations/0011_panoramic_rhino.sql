DROP INDEX "clientes_contacto_cliente_persona_unico";--> statement-breakpoint
CREATE UNIQUE INDEX "clientes_contacto_persona_unica" ON "clientes_contacto" USING btree ("persona_id");