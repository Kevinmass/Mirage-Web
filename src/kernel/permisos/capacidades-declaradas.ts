// Punto central que agrega las capacidades que cada módulo declara en su
// permissions.ts — mismo patrón que db/schema.ts con las tablas. El
// kernel (registro.ts) no conoce ningún módulo en particular, solo
// procesa esta lista; un módulo nuevo con capacidades agrega una línea
// acá.
import { capacidades as capacidadesClientes } from "@/modules/clientes/permissions";
import { capacidades as capacidadesContenido } from "@/modules/contenido/permissions";
import type { CapacidadDeclarada } from "./registro";

export const capacidadesDeclaradas: readonly CapacidadDeclarada[] = [
  ...capacidadesClientes,
  ...capacidadesContenido,
];
