// Errores tipados que cualquier api.ts puede lanzar (diseño §9). La capa
// de UI los traduce a mensajes; nunca se filtra detalle interno al
// portal.
export class NoAutorizado extends Error {}
export class NoEncontrado extends Error {}
export class Validacion extends Error {}
export class Conflicto extends Error {
  // Datos estructurados del conflicto para quien lo atrapa (p.ej. la
  // lista de qué reasignar antes de archivar un nodo) — el mensaje solo
  // es para humanos, esto es para código.
  constructor(
    message: string,
    public readonly detalle?: unknown,
  ) {
    super(message);
  }
}
