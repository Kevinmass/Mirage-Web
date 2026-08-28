import { describe, expect, it } from "vitest";
import { renderizarPlantilla } from "./plantillas";

describe("modules/notificaciones/internal/plantillas", () => {
  it("cliente.creado incluye el nombre del cliente", () => {
    const { asunto, html } = renderizarPlantilla("cliente.creado", {
      clienteId: 1,
      nombre: "Acme Software",
    });

    expect(asunto).toContain("Acme Software");
    expect(html).toContain("Acme Software");
  });

  it("proyecto.creado incluye el nombre del proyecto", () => {
    const { asunto, html } = renderizarPlantilla("proyecto.creado", {
      proyectoId: 1,
      clienteId: 1,
      nombre: "Sitio institucional",
    });

    expect(asunto).toContain("Sitio institucional");
    expect(html).toContain("Sitio institucional");
  });

  it("proyecto.estado_cambiado incluye los dos estados", () => {
    const { asunto } = renderizarPlantilla("proyecto.estado_cambiado", {
      proyectoId: 1,
      nombre: "Sitio institucional",
      estadoAnterior: "propuesto",
      estadoNuevo: "activo",
    });

    expect(asunto).toContain("propuesto");
    expect(asunto).toContain("activo");
  });

  it("tarea.asignada incluye el título de la tarea", () => {
    const { asunto, html } = renderizarPlantilla("tarea.asignada", {
      tareaId: 1,
      personaId: 1,
      titulo: "Maquetar home",
    });

    expect(asunto).toContain("Maquetar home");
    expect(html).toContain("Maquetar home");
  });

  it("una plantilla sin registrar cae al genérico en vez de romper", () => {
    const { asunto, html } = renderizarPlantilla("evento.inventado", {
      x: 1,
    });

    expect(asunto).toContain("evento.inventado");
    expect(html).toContain('"x": 1');
  });
});
