import { afterEach, describe, expect, it, vi } from "vitest";
import { _reiniciarParaTests, publicar, suscribir } from "./bus";

afterEach(() => {
  _reiniciarParaTests();
});

describe("bus de eventos", () => {
  it("entrega el payload a un suscriptor", async () => {
    const manejador = vi.fn();
    suscribir("prueba.evento", manejador);

    await publicar("prueba.evento", { valor: 42 });

    expect(manejador).toHaveBeenCalledWith({ valor: 42 });
  });

  it("solo entrega a suscriptores del nombre exacto", async () => {
    const manejadorA = vi.fn();
    const manejadorB = vi.fn();
    suscribir("evento.a", manejadorA);
    suscribir("evento.b", manejadorB);

    await publicar("evento.a", {});

    expect(manejadorA).toHaveBeenCalledOnce();
    expect(manejadorB).not.toHaveBeenCalled();
  });

  it("si un suscriptor falla, el publicador no se entera", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    suscribir("prueba.evento", () => {
      throw new Error("el suscriptor explota");
    });

    // No debe rechazar ni tirar — esta es la regla que sostiene la
    // arquitectura (diseño §4.5): la falla de un suscriptor no puede
    // invalidar la operación de quien publicó.
    await expect(publicar("prueba.evento", {})).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalledOnce();

    consoleError.mockRestore();
  });

  it("un suscriptor que falla no bloquea a los demás suscriptores del mismo evento", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const segundoManejador = vi.fn();
    suscribir("prueba.evento", () => {
      throw new Error("el primero explota");
    });
    suscribir("prueba.evento", segundoManejador);

    await publicar("prueba.evento", {});

    expect(segundoManejador).toHaveBeenCalledOnce();

    consoleError.mockRestore();
  });

  it("también ataja el rechazo de un suscriptor async", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    suscribir("prueba.evento", async () => {
      throw new Error("async que explota");
    });

    await expect(publicar("prueba.evento", {})).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalledOnce();

    consoleError.mockRestore();
  });
});
