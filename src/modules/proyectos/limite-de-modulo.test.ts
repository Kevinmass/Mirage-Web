import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// PR 7.6, criterio de aceptación: "una verificación de que
// modules/proyectos/ no importa nada de modules/solicitudes/". La
// regla de fronteras de eslint.config.mjs ya bloquea importar el
// interior de otro módulo (schema/events/permissions/ui/internal),
// pero SÍ deja pasar `modules/solicitudes/api` — porque esa es la
// puerta pública normal entre módulos. Acá la dirección es al revés:
// solicitudes depende de proyectos.api (crearProyecto), nunca al
// revés — proyectos ni siquiera puede saber que solicitudes existe,
// se comunican solo por el nombre de un evento
// ("solicitud.aceptada"). Este test verifica ESO puntualmente: cero
// imports de modules/solicitudes en todo el módulo, ni siquiera de su
// api.ts.
function listarArchivosTs(dir: string): string[] {
  return readdirSync(dir).flatMap((entrada) => {
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) {
      return listarArchivosTs(ruta);
    }
    return /\.(ts|tsx)$/.test(entrada) ? [ruta] : [];
  });
}

describe("modules/proyectos — frontera con solicitudes", () => {
  it("ningún archivo de modules/proyectos importa nada de modules/solicitudes", () => {
    const dir = join(__dirname);
    const archivos = listarArchivosTs(dir).filter(
      (ruta) => !ruta.includes(".test."),
    );

    // Solo import/require reales — un comentario que mencione
    // "modules/solicitudes" (como el de events.ts explicando por qué
    // NO se importa) no cuenta como violación.
    const patronImport =
      /(?:from\s+["'][^"']*modules\/solicitudes[^"']*["']|(?:import|require)\(\s*["'][^"']*modules\/solicitudes[^"']*["']\s*\))/;
    const conImportProhibido = archivos.filter((ruta) => {
      const contenido = readFileSync(ruta, "utf-8");
      return patronImport.test(contenido);
    });

    expect(conImportProhibido).toEqual([]);
  });
});
