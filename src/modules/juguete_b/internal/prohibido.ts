// Violación deliberada para probar la regla de frontera de módulos (PR 0.2):
// esto NO debería pasar el lint, porque cruza a internal/ de otro módulo.
import { secreto } from "@/modules/juguete_a/internal/secreto";

export function usaElSecretoAjeno(): string {
  return secreto;
}
