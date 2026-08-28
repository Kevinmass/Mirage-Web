-- evento_auditoria es append-only (diseño §4.4): una auditoría editable
-- no es auditoría.
--
-- REVOKE UPDATE/DELETE no alcanza acá: en este proyecto la migración y
-- la aplicación se conectan con el mismo rol (una sola DATABASE_URL), y
-- ese rol es el dueño de la tabla — Postgres no aplica el ACL al dueño
-- de un objeto, así que un REVOKE sobre el propio dueño es un no-op
-- (confirmado a mano: UPDATE y DELETE pasan igual después del REVOKE).
-- Separar en dos roles (uno dueño/migrador, otro de aplicación
-- restringido) es la forma "de manual", pero exige dos DATABASE_URL
-- distintas y no hay garantía de poder crear roles adicionales en el
-- Postgres administrado de Render. Un trigger que rechaza UPDATE/DELETE
-- sin condición logra lo mismo — nadie puede modificar una fila ya
-- escrita, sea cual sea el rol — sin ese costo.
CREATE OR REPLACE FUNCTION evento_auditoria_bloquear_modificacion()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'evento_auditoria es append-only: % no está permitido', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER evento_auditoria_bloquear_update
  BEFORE UPDATE ON evento_auditoria
  FOR EACH ROW EXECUTE FUNCTION evento_auditoria_bloquear_modificacion();

CREATE TRIGGER evento_auditoria_bloquear_delete
  BEFORE DELETE ON evento_auditoria
  FOR EACH ROW EXECUTE FUNCTION evento_auditoria_bloquear_modificacion();
