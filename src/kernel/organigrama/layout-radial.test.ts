import { describe, expect, it } from "vitest";
import { calcularLayoutRadial } from "./layout-radial";

describe("calcularLayoutRadial", () => {
  it("ubica las dos raíces en semicírculos opuestos", () => {
    const layout = calcularLayoutRadial([
      { id: 1, padreId: null, raiz: "interno", orden: 0, anillo: 0 },
      { id: 2, padreId: null, raiz: "externo", orden: 0, anillo: 0 },
    ]);

    expect(layout.get(1)).toMatchObject({ anguloInicio: 0, anguloFin: 180 });
    expect(layout.get(2)).toMatchObject({
      anguloInicio: 180,
      anguloFin: 360,
    });
  });

  it("las dos raíces quedan al mismo radio (el más chico)", () => {
    const layout = calcularLayoutRadial([
      { id: 1, padreId: null, raiz: "interno", orden: 0, anillo: 0 },
      { id: 2, padreId: null, raiz: "externo", orden: 0, anillo: 0 },
    ]);

    expect(layout.get(1)!.radio).toBe(layout.get(2)!.radio);
  });

  it("un nodo reparte su arco en partes iguales entre sus hijos", () => {
    const layout = calcularLayoutRadial([
      { id: 1, padreId: null, raiz: "interno", orden: 0, anillo: 0 },
      { id: 2, padreId: 1, raiz: null, orden: 0, anillo: 1 },
      { id: 3, padreId: 1, raiz: null, orden: 1, anillo: 1 },
    ]);

    const hijoA = layout.get(2)!;
    const hijoB = layout.get(3)!;
    expect(hijoA.anguloInicio).toBe(0);
    expect(hijoA.anguloFin).toBe(90);
    expect(hijoB.anguloInicio).toBe(90);
    expect(hijoB.anguloFin).toBe(180);
  });

  it("orden decide qué hijo va primero, no el orden de inserción", () => {
    const layout = calcularLayoutRadial([
      { id: 1, padreId: null, raiz: "interno", orden: 0, anillo: 0 },
      { id: 2, padreId: 1, raiz: null, orden: 5, anillo: 1 },
      { id: 3, padreId: 1, raiz: null, orden: 1, anillo: 1 },
    ]);

    // El nodo 3 tiene orden menor (1 < 5): debe quedar primero en el
    // arco (más cerca de 0°) aunque en la lista de entrada va segundo.
    expect(layout.get(3)!.anguloInicio).toBeLessThan(
      layout.get(2)!.anguloInicio,
    );
  });

  it("cada anillo aumenta el radio de forma monótona", () => {
    const layout = calcularLayoutRadial([
      { id: 1, padreId: null, raiz: "interno", orden: 0, anillo: 0 },
      { id: 2, padreId: 1, raiz: null, orden: 0, anillo: 1 },
      { id: 3, padreId: 2, raiz: null, orden: 0, anillo: 2 },
    ]);

    expect(layout.get(1)!.radio).toBeLessThan(layout.get(2)!.radio);
    expect(layout.get(2)!.radio).toBeLessThan(layout.get(3)!.radio);
  });

  it("un nodo sin hijos no rompe el cálculo del resto del árbol", () => {
    const layout = calcularLayoutRadial([
      { id: 1, padreId: null, raiz: "interno", orden: 0, anillo: 0 },
      { id: 2, padreId: null, raiz: "externo", orden: 0, anillo: 0 },
    ]);

    expect(layout.size).toBe(2);
  });

  it("las coordenadas x/y son consistentes con ángulo y radio (trigonometría)", () => {
    const layout = calcularLayoutRadial([
      { id: 1, padreId: null, raiz: "interno", orden: 0, anillo: 0 },
    ]);
    const pos = layout.get(1)!;
    const anguloMedioRad =
      (Math.PI * (pos.anguloInicio + pos.anguloFin)) / 2 / 180;

    expect(pos.x).toBeCloseTo(pos.radio * Math.cos(anguloMedioRad));
    expect(pos.y).toBeCloseTo(pos.radio * Math.sin(anguloMedioRad));
  });
});
