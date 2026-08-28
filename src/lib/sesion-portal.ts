import { obtenerSesionActual } from "@/kernel/identidad/sesion";
import { obtenerClienteDeContacto } from "@/modules/clientes/api";

export interface SesionPortal {
  personaId: number;
  clienteId: number;
}

// El helper obligatorio del diseño §8: "toda consulta del portal se
// filtra por el cliente_id derivado de la sesión, nunca de un
// parámetro de la URL". Vive en src/lib, no en kernel/identidad,
// porque resolver "a qué cliente pertenece este contacto" necesita
// clientes_contacto — una tabla de módulo — y el kernel no puede
// importar modules/<lo que sea>. Toda pantalla y toda Server Action
// de /portal pasa por acá para conseguir su clienteId; ninguna lo lee
// de un parámetro.
export async function obtenerSesionPortal(): Promise<SesionPortal | null> {
  const sesion = await obtenerSesionActual();
  if (!sesion || sesion.tipo !== "contacto_cliente") {
    return null;
  }

  const clienteId = await obtenerClienteDeContacto(sesion.personaId);
  if (clienteId === null) {
    return null;
  }

  return { personaId: sesion.personaId, clienteId };
}
