import { describe, it } from "vitest";

// PR 7.1, diseño §8/§10: "los tests existen, están marcados como
// pendientes de implementación, y el PR 7.6 no puede mergearse hasta
// que estén todos en verde". No son it.skip (que implica "esto
// existe y no corre por algo") — son it.todo: el contrato existe,
// la funcionalidad todavía no. Cada uno se convierte en un test real
// (Postgres real, dos clientes, dos contactos) en el PR que construye
// esa superficie, no antes.
//
// La pieza que SÍ existe desde este PR — de la que depende todo lo de
// acá abajo — está probada de verdad en sesion-portal.integration.test.ts:
// obtenerClienteDeContacto nunca resuelve al cliente equivocado.
describe("aislamiento del portal — contrato pendiente", () => {
  it.todo(
    "un contacto del cliente A no ve solicitudes del cliente B en /portal (PR 7.5)",
  );
  it.todo(
    "un contacto del cliente A no puede leer una solicitud de B pidiéndola por id (PR 7.5)",
  );
  it.todo(
    "el hilo de una solicitud, visto desde /portal, nunca trae mensajes con visible_para_cliente = false — ni en el HTML, no solo escondidos en el render (PR 7.5)",
  );
  it.todo(
    "un contacto del cliente A no ve proyectos del cliente B en /portal (PR 7.7)",
  );
  it.todo(
    "la ficha de un proyecto en /portal solo trae el porcentaje de progreso — nunca commits, PRs, contribuyentes, tareas individuales, nodos ni asignaciones (PR 7.7)",
  );
  it.todo(
    "crear una solicitud en /portal la asocia siempre al cliente de la sesión, nunca a uno pasado por parámetro (PR 7.5)",
  );
});
