// Errores tipados que cualquier api.ts puede lanzar (diseño §9). La capa
// de UI los traduce a mensajes; nunca se filtra detalle interno al
// portal.
export class NoAutorizado extends Error {}
export class NoEncontrado extends Error {}
export class Validacion extends Error {}
export class Conflicto extends Error {}
