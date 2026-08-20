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

// Next.js empaqueta el código de instrumentation.ts en un chunk de
// servidor separado del que corre cada ruta o Server Action — algo
// que se suscribió una sola vez al arrancar, ahí, nunca llega al
// chunk que termina llamando a publicar(): cada chunk se lleva su
// propia copia de este módulo, con su propio `suscripciones` vacío.
// Por eso publicar() se asegura, la primera vez que corre EN CADA
// chunk, de que las suscripciones de ESE chunk existan — importando
// el agregador (kernel/eventos/registro.ts), que a su vez importa el
// events.ts de cada módulo por su efecto de import. memoizado con una
// promesa para que llamadas concurrentes no lo disparen dos veces.
let inicializacion: Promise<unknown> | null = null;
function asegurarSuscripciones(): Promise<unknown> {
  inicializacion ??= import("./registro");
  return inicializacion;
}

// La regla que sostiene esto (diseño §4.5): si un suscriptor falla, el
// publicador no se entera. Se registra el error y se sigue con el resto
// de los suscriptores. Si la falla de un suscriptor debería invalidar la
// operación del publicador, no es un evento — es una llamada a api.ts.
export async function publicar<N extends NombreEvento>(
  nombre: N,
  payload: PayloadDe<N>,
): Promise<void> {
  await asegurarSuscripciones();

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
// No resetea `inicializacion` — volver a importar el agregador no
// hace nada nuevo (los módulos ya están cargados), así que no hace
// falta y evitarlo mantiene esto rápido entre tests.
export function _reiniciarParaTests(): void {
  suscripciones.length = 0;
}
