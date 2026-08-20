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
//
// PR 7.5 convirtió en tests reales (Postgres real, dos clientes) los
// cuatro ítems de solicitudes de esta lista — viven en
// modules/solicitudes/api.integration.test.ts, no acá, mismo criterio
// que sesion-portal.integration.test.ts arriba: no duplicar el setup
// de dos-clientes-dos-contactos en dos archivos.
//   - listarSolicitudesDeCliente nunca devuelve solicitudes de otro
//     cliente ("listarSolicitudesDeCliente nunca devuelve...")
//   - obtenerSolicitudDeCliente tira NoEncontrado si la solicitud es
//     de otro cliente ("obtenerSolicitudDeCliente tira NoEncontrado...")
//   - listarMensajesVisiblesParaCliente nunca incluye mensajes internos
//     ("agregarMensaje: listarMensajesDeSolicitud ve todo,
//     listarMensajesVisiblesParaCliente solo lo visible")
//   - crearSolicitud toma clienteId/creadaPorPersonaId como parámetros
//     explícitos, no de un formulario — portal/solicitudes/actions.ts
//     los saca siempre de obtenerSesionPortal(), nunca de un campo;
//     no hay una ruta de datos por la que un valor de formulario
//     pueda llegar a esos parámetros.
describe("aislamiento del portal — contrato pendiente", () => {
  it.todo(
    "un contacto del cliente A no ve proyectos del cliente B en /portal (PR 7.7)",
  );
  it.todo(
    "la ficha de un proyecto en /portal solo trae el porcentaje de progreso — nunca commits, PRs, contribuyentes, tareas individuales, nodos ni asignaciones (PR 7.7)",
  );
});
