-- Backfill de "slug" desde "nombre" (PR 4 del rediseño de frontend,
-- §8.2 del sistema visual). Se suma el id siempre, no solo ante
-- colisión: dos filas seed ya existen con el mismo nombre exacto
-- ("Desarrollo de software a medida"), y un slugify sin sufijo
-- violaría la restricción unique agregada en la migración anterior.
UPDATE "contenido_servicio"
SET "slug" = trim(both '-' from lower(regexp_replace("nombre", '[^a-zA-Z0-9]+', '-', 'g'))) || '-' || "id"::text
WHERE "slug" IS NULL;
--> statement-breakpoint
ALTER TABLE "contenido_servicio" ALTER COLUMN "slug" SET NOT NULL;
