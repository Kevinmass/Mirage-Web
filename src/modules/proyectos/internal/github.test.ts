import { describe, expect, it } from "vitest";
import { obtenerDatosDeRepositorio } from "./github";

function respuestaFalsa(
  cuerpo: unknown,
  init: { status?: number; link?: string } = {},
): Response {
  const headers = new Headers();
  if (init.link) headers.set("link", init.link);
  return new Response(JSON.stringify(cuerpo), {
    status: init.status ?? 200,
    headers,
  });
}

describe("modules/proyectos/internal/github", () => {
  it("arma los cuatro pedidos y devuelve los totales", async () => {
    const fetchFalso = async (url: string | URL) => {
      const u = url.toString();
      if (u.includes("/commits")) {
        return respuestaFalsa(
          [{ commit: { author: { date: "2026-08-01T00:00:00Z" } } }],
          { link: '<...&page=42>; rel="last"' },
        );
      }
      if (u.includes("state:open")) {
        return respuestaFalsa({ total_count: 3 });
      }
      if (u.includes("state:closed")) {
        return respuestaFalsa({ total_count: 17 });
      }
      if (u.includes("/contributors")) {
        return respuestaFalsa([{}], { link: '<...&page=5>; rel="last"' });
      }
      throw new Error(`URL inesperada: ${u}`);
    };

    const datos = await obtenerDatosDeRepositorio(
      "mirage",
      "web",
      fetchFalso as unknown as typeof fetch,
    );

    expect(datos).toEqual({
      commitsTotal: 42,
      prsAbiertas: 3,
      prsCerradas: 17,
      contribuyentes: 5,
      ultimoCommitEn: new Date("2026-08-01T00:00:00Z"),
    });
  });

  it("sin header Link (un solo repo chico), cuenta lo que vino en el array", async () => {
    const fetchFalso = async (url: string | URL) => {
      const u = url.toString();
      if (u.includes("/commits")) {
        return respuestaFalsa([
          { commit: { author: { date: "2026-01-01T00:00:00Z" } } },
        ]);
      }
      if (u.includes("state:open")) return respuestaFalsa({ total_count: 0 });
      if (u.includes("state:closed")) return respuestaFalsa({ total_count: 0 });
      if (u.includes("/contributors")) return respuestaFalsa([{}]);
      throw new Error(`URL inesperada: ${u}`);
    };

    const datos = await obtenerDatosDeRepositorio(
      "mirage",
      "web",
      fetchFalso as unknown as typeof fetch,
    );

    expect(datos.commitsTotal).toBe(1);
    expect(datos.contribuyentes).toBe(1);
  });

  it("propaga el error si GitHub responde con un status que no es 2xx", async () => {
    const fetchFalso = async () => respuestaFalsa({}, { status: 404 });

    await expect(
      obtenerDatosDeRepositorio(
        "no-existe",
        "no-existe",
        fetchFalso as unknown as typeof fetch,
      ),
    ).rejects.toThrow(/404/);
  });
});
