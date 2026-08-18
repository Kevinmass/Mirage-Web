export type TipoPersona = "empleado" | "contacto_cliente";

export interface Sesion {
  personaId: number;
  tipo: TipoPersona;
  // Solo tiene sentido cuando tipo === "contacto_cliente".
  clienteId?: number;
}

// Placeholder hasta que exista login real: better-auth + persona llegan
// en el PR 3.1. Hoy no hay forma de autenticarse, así que toda request
// es anónima — esto existe para que el middleware de superficies
// (PR 2.4) tenga algo concreto contra qué evaluar sus reglas, y el
// PR 3.1 lo reemplaza por la lectura de la sesión real sin tocar a
// quien lo llama (misma firma).
export async function obtenerSesion(_request: Request): Promise<Sesion | null> {
  return null;
}
