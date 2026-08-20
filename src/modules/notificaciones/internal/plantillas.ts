export interface PlantillaRenderizada {
  asunto: string;
  html: string;
}

type Renderizador = (datos: unknown) => PlantillaRenderizada;

// Vacío en el PR 6.1 a propósito: todavía no hay ningún evento
// suscripto (eso es 6.2). Una plantilla sin registrar cae al genérico
// de abajo en vez de romper el envío — la notificación igual sale,
// aunque menos linda, en vez de perderse por un nombre de plantilla
// que nadie registró todavía.
const PLANTILLAS: Record<string, Renderizador> = {};

function generica(plantilla: string, datos: unknown): PlantillaRenderizada {
  return {
    asunto: `Mirage — ${plantilla}`,
    html: `<pre>${JSON.stringify(datos, null, 2)}</pre>`,
  };
}

export function renderizarPlantilla(
  plantilla: string,
  datos: unknown,
): PlantillaRenderizada {
  const renderizador = PLANTILLAS[plantilla];
  return renderizador ? renderizador(datos) : generica(plantilla, datos);
}
