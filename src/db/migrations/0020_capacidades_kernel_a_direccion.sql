-- PR 5 de la ronda de fixes. Migración de datos (sin cambio de schema).
--
-- El kernel pasa a declarar capacidades propias (organigrama.ver/editar/
-- administrar, identidad.administrar). En una base ya arrancada, el rol
-- "Dirección" que creó el bootstrap no las tiene asignadas — y la pantalla
-- para asignarlas está detrás de identidad.administrar, así que sin esto
-- quedaría inalcanzable.
--
-- Se registran las cuatro filas en `capacidad` (por si el server todavía no
-- corrió instrumentation.ts) y se le dan al rol "Dirección" si existe. Todo
-- ON CONFLICT DO NOTHING: idempotente, y en una base recién migrada (sin rol
-- "Dirección" todavía) no hace nada — el bootstrap las asigna igual.

INSERT INTO "capacidad" ("clave", "modulo", "descripcion", "huerfana") VALUES
  ('organigrama.ver', 'kernel', 'Ver el organigrama completo.', false),
  ('organigrama.editar', 'kernel', 'Crear, renombrar, mover y archivar nodos del organigrama (dentro del árbol que se controla).', false),
  ('organigrama.administrar', 'kernel', 'Asignar y desasignar personas en cualquier nodo del organigrama, se ocupe esa rama o no.', false),
  ('identidad.administrar', 'kernel', 'Ver y cambiar los roles de las personas, y administrar los roles y sus capacidades.', false)
ON CONFLICT ("clave") DO NOTHING;
--> statement-breakpoint
INSERT INTO "rol_capacidad" ("rol_id", "capacidad_clave")
SELECT "rol"."id", v."clave"
FROM "rol"
CROSS JOIN (VALUES
  ('organigrama.ver'),
  ('organigrama.editar'),
  ('organigrama.administrar'),
  ('identidad.administrar')
) AS v("clave")
WHERE "rol"."nombre" = 'Dirección'
ON CONFLICT ("rol_id", "capacidad_clave") DO NOTHING;
