// Geometría del dibujo por anillos concéntricos (diseño, PR 3.5). Pura
// a propósito — sin DB, sin SVG, sin React — así se prueba con datos de
// mentira y rápido. El componente que dibuja solo traduce esto a
// <circle>/<line>.
//
// Las dos raíces ("interno" y "externo") se reparten el círculo mitad y
// mitad (0°-180° y 180°-360°); cada nodo reparte su propio arco entre
// sus hijos, en orden. orden decide la posición angular dentro de ese
// arco, no el ángulo absoluto.
export interface NodoParaLayout {
  id: number;
  padreId: number | null;
  raiz: "interno" | "externo" | null;
  orden: number;
  anillo: number;
}

export interface PosicionNodo {
  id: number;
  x: number;
  y: number;
  anguloInicio: number;
  anguloFin: number;
  radio: number;
}

const RADIO_INICIAL = 50;
const RADIO_POR_ANILLO = 90;

export function calcularLayoutRadial(
  nodos: readonly NodoParaLayout[],
): Map<number, PosicionNodo> {
  const hijosPorPadre = new Map<number | null, NodoParaLayout[]>();
  for (const n of nodos) {
    const lista = hijosPorPadre.get(n.padreId);
    if (lista) {
      lista.push(n);
    } else {
      hijosPorPadre.set(n.padreId, [n]);
    }
  }
  for (const lista of hijosPorPadre.values()) {
    lista.sort((a, b) => a.orden - b.orden);
  }

  const resultado = new Map<number, PosicionNodo>();

  function ubicar(
    nodoId: number,
    anillo: number,
    anguloInicio: number,
    anguloFin: number,
  ) {
    const anguloMedio = (anguloInicio + anguloFin) / 2;
    const radio =
      anillo === 0 ? RADIO_INICIAL : RADIO_INICIAL + anillo * RADIO_POR_ANILLO;
    const rad = (anguloMedio * Math.PI) / 180;

    resultado.set(nodoId, {
      id: nodoId,
      x: radio * Math.cos(rad),
      y: radio * Math.sin(rad),
      anguloInicio,
      anguloFin,
      radio,
    });

    const hijos = hijosPorPadre.get(nodoId) ?? [];
    if (hijos.length === 0) return;

    const paso = (anguloFin - anguloInicio) / hijos.length;
    hijos.forEach((hijo, indice) => {
      ubicar(
        hijo.id,
        anillo + 1,
        anguloInicio + indice * paso,
        anguloInicio + (indice + 1) * paso,
      );
    });
  }

  const raices = hijosPorPadre.get(null) ?? [];
  const interno = raices.find((r) => r.raiz === "interno");
  const externo = raices.find((r) => r.raiz === "externo");

  if (interno) ubicar(interno.id, 0, 0, 180);
  if (externo) ubicar(externo.id, 0, 180, 360);

  // Cualquier otra raíz suelta (no debería pasar con las invariantes de
  // schema.ts, pero un dato corrupto no tiene por qué tirar abajo el
  // dibujo del resto): se ubica ocupando el círculo completo.
  for (const r of raices) {
    if (r.id !== interno?.id && r.id !== externo?.id) {
      ubicar(r.id, 0, 0, 360);
    }
  }

  return resultado;
}
