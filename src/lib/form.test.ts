import { describe, expect, it } from "vitest";
import { idElegido } from "./form";

describe("lib/form — idElegido", () => {
  it("un id válido pasa tal cual", () => {
    expect(idElegido("42")).toBe(42);
    expect(idElegido("1")).toBe(1);
  });

  it("un <select> sin elegir (cadena vacía) da null, no 0", () => {
    expect(idElegido("")).toBeNull();
  });

  it("campo ausente (null) da null, no 0", () => {
    expect(idElegido(null)).toBeNull();
  });

  it("un value no numérico da null, no NaN", () => {
    expect(idElegido("sin-asignar")).toBeNull();
    expect(idElegido("abc")).toBeNull();
  });

  it("cero y negativos dan null", () => {
    expect(idElegido("0")).toBeNull();
    expect(idElegido("-3")).toBeNull();
  });

  it("decimales dan null (un id es entero)", () => {
    expect(idElegido("3.5")).toBeNull();
  });
});
