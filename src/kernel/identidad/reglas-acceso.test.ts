import { describe, expect, it } from "vitest";
import { decidirAcceso } from "./reglas-acceso";
import type { Sesion } from "./sesion";

const empleado: Sesion = { personaId: 1, tipo: "empleado" };
const contactoCliente: Sesion = {
  personaId: 2,
  tipo: "contacto_cliente",
  clienteId: 10,
};

describe("decidirAcceso", () => {
  it("/ se permite sin sesión", () => {
    expect(decidirAcceso("/", null)).toBe("permitir");
  });

  it("/ se permite con cualquier sesión", () => {
    expect(decidirAcceso("/", empleado)).toBe("permitir");
    expect(decidirAcceso("/", contactoCliente)).toBe("permitir");
  });

  it("/app se permite a un empleado", () => {
    expect(decidirAcceso("/app", empleado)).toBe("permitir");
    expect(decidirAcceso("/app/organigrama", empleado)).toBe("permitir");
  });

  it("/app sin sesión da no-encontrado", () => {
    expect(decidirAcceso("/app", null)).toBe("no-encontrado");
  });

  it("un contacto_cliente que pide /app recibe no-encontrado (404, no 403)", () => {
    expect(decidirAcceso("/app", contactoCliente)).toBe("no-encontrado");
    expect(decidirAcceso("/app/lo-que-sea", contactoCliente)).toBe(
      "no-encontrado",
    );
  });

  it("/portal se permite a un contacto_cliente", () => {
    expect(decidirAcceso("/portal", contactoCliente)).toBe("permitir");
  });

  it("/portal sin sesión da no-encontrado", () => {
    expect(decidirAcceso("/portal", null)).toBe("no-encontrado");
  });

  it("un empleado que pide /portal recibe no-encontrado", () => {
    expect(decidirAcceso("/portal", empleado)).toBe("no-encontrado");
  });
});
