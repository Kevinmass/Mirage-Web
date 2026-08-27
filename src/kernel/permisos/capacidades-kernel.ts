import type { CapacidadDeclarada } from "./registro";

// Capacidades que declara el propio kernel — mismo formato que el
// permissions.ts de cada módulo, pero acá el "módulo" es el kernel. Se
// suman a capacidades-declaradas.ts para que registro.ts las procese
// igual que las de los módulos (PR 5 de la ronda de fixes).
//
// El control por árbol del organigrama (nodosControladosPorPersona) sigue
// siendo el camino por defecto: se ocupa un nodo, se administra ese nodo y
// su subárbol. `organigrama.administrar` es la excepción — saltea el árbol
// y deja administrar cualquier nodo, se ocupe la rama o no. Era la única
// forma de destrabar la rama externa, que el arranque dejaba sin titular.
export const capacidadesKernel = [
  {
    clave: "organigrama.ver",
    modulo: "kernel",
    descripcion: "Ver el organigrama completo.",
  },
  {
    clave: "organigrama.editar",
    modulo: "kernel",
    descripcion:
      "Crear, renombrar, mover y archivar nodos del organigrama (dentro del árbol que se controla).",
  },
  {
    clave: "organigrama.administrar",
    modulo: "kernel",
    descripcion:
      "Asignar y desasignar personas en cualquier nodo del organigrama, se ocupe esa rama o no.",
  },
  {
    clave: "identidad.administrar",
    modulo: "kernel",
    descripcion:
      "Ver y cambiar los roles de las personas, y administrar los roles y sus capacidades.",
  },
] as const satisfies readonly CapacidadDeclarada[];
