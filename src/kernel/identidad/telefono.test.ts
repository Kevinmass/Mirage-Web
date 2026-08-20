import { describe, expect, it } from "vitest";
import { esTelefonoE164Valido } from "./telefono";

describe("esTelefonoE164Valido", () => {
  it("acepta el ejemplo del diseño", () => {
    expect(esTelefonoE164Valido("+5491122334455")).toBe(true);
  });

  it("rechaza sin +", () => {
    expect(esTelefonoE164Valido("5491122334455")).toBe(false);
  });

  it("rechaza espacios o guiones", () => {
    expect(esTelefonoE164Valido("+54 9 11 2233-4455")).toBe(false);
  });

  it("rechaza que empiece con 0 después del +", () => {
    expect(esTelefonoE164Valido("+0491122334455")).toBe(false);
  });

  it("rechaza demasiado corto", () => {
    expect(esTelefonoE164Valido("+123456")).toBe(false);
  });

  it("rechaza demasiado largo", () => {
    expect(esTelefonoE164Valido("+1234567890123456")).toBe(false);
  });
});
