import { listarPersonas } from "@/kernel/identidad/personas";
import { obtenerSesionActual } from "@/kernel/identidad/sesion";
import {
  nodosControladosPorPersona,
  obtenerArbolCompleto,
} from "@/kernel/organigrama/arbol";
import { OrganigramaCliente } from "./organigrama-cliente";

export default async function PaginaOrganigrama() {
  const [nodos, personas, sesion] = await Promise.all([
    obtenerArbolCompleto(),
    listarPersonas(),
    obtenerSesionActual(),
  ]);

  // Sin sesión (no debería pasar detrás de /app, pero un persona.tipo
  // sin nodos propios tampoco) no controla nada — todo queda
  // deshabilitado con el motivo, no oculto (diseño §8.7/§8.8).
  const nodosControlados = sesion
    ? await nodosControladosPorPersona(sesion.personaId)
    : new Set<number>();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Organigrama</h1>
      <div className="mt-6">
        <OrganigramaCliente
          nodos={nodos}
          personas={personas
            .filter((p) => p.activo)
            .map((p) => ({ id: p.id, nombre: p.nombre, apellido: p.apellido }))}
          nodosControladosIds={Array.from(nodosControlados)}
        />
      </div>
    </main>
  );
}
