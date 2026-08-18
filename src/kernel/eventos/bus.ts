// Bus de eventos en proceso, síncrono (no hay cola externa en v1 — ver
// diseño §4.5) y tipado. Los módulos publican y se suscriben por nombre,
// sin conocerse entre sí.
//
// Registro de tipos: cada módulo extiende este mapa por declaration
// merging cuando declara sus eventos, por ejemplo en su events.ts:
//
//   declare module "@/kernel/eventos/bus" {
//     interface EventosRegistrados {
//       "cliente.creado": { clienteId: number };
//     }
//   }
//
// Nadie lo extiende todavía (no hay módulos con eventos reales); el mapa
// arranca vacío y `publicar`/`suscribir` siguen aceptando cualquier
// nombre de evento, sin autocompletado hasta que algo lo registre.
export interface EventosRegistrados {
  [nombre: string]: unknown;
}

type NombreEvento = keyof EventosRegistrados & string;
type PayloadDe<N extends NombreEvento> = EventosRegistrados[N];
type Manejador<N extends NombreEvento> = (
  payload: PayloadDe<N>,
) => void | Promise<void>;

interface Suscripcion {
  nombre: NombreEvento;
  manejador: Manejador<NombreEvento>;
}

const suscripciones: Suscripcion[] = [];

export function suscribir<N extends NombreEvento>(
  nombre: N,
  manejador: Manejador<N>,
): void {
  suscripciones.push({
    nombre,
    manejador: manejador as Manejador<NombreEvento>,
  });
}

// La regla que sostiene esto (diseño §4.5): si un suscriptor falla, el
// publicador no se entera. Se registra el error y se sigue con el resto
// de los suscriptores. Si la falla de un suscriptor debería invalidar la
// operación del publicador, no es un evento — es una llamada a api.ts.
export async function publicar<N extends NombreEvento>(
  nombre: N,
  payload: PayloadDe<N>,
): Promise<void> {
  const interesados = suscripciones.filter((s) => s.nombre === nombre);

  for (const suscripcion of interesados) {
    try {
      await suscripcion.manejador(payload);
    } catch (error) {
      console.error(`[eventos] suscriptor de "${nombre}" falló`, error);
    }
  }
}

// Solo para tests: vuelve el bus a su estado inicial entre pruebas.
export function _reiniciarParaTests(): void {
  suscripciones.length = 0;
}
