// Capacidades que declara este módulo. Todavía nadie las tiene: el
// kernel de permisos (que las registra al arrancar, sin conocerlas de
// antemano) llega en el PR 2.3. Ver diseño §4.3.
export const capacidades = [
  {
    clave: "contenido.editar",
    modulo: "contenido",
    descripcion: "Editar páginas, servicios y casos de la web pública.",
  },
] as const;
