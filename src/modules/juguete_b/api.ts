import { saludoDesdeA } from "@/modules/juguete_a/api";

export function saludoDesdeB(): string {
  return `${saludoDesdeA()} + hola desde juguete_b`;
}
