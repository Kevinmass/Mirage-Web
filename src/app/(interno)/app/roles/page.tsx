import { obtenerSesionActual } from "@/kernel/identidad/sesion";
import { tienePermiso } from "@/kernel/permisos/evaluar";
import {
  capacidadesDeRol,
  listarCapacidades,
  listarRoles,
} from "@/kernel/permisos/roles";
import { EditorRoles } from "./editor-roles";

export default async function PaginaRoles() {
  const sesion = await obtenerSesionActual();
  const puedeAdministrar =
    !!sesion && (await tienePermiso(sesion.personaId, "identidad.administrar"));

  if (!puedeAdministrar) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-h3 font-heading font-semibold">Roles</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Necesitás la capacidad{" "}
          <code className="font-mono text-xs">identidad.administrar</code> para
          ver y cambiar los roles.
        </p>
      </main>
    );
  }

  const [roles, capacidades] = await Promise.all([
    listarRoles(),
    listarCapacidades(),
  ]);
  const capsPorRol = Object.fromEntries(
    await Promise.all(
      roles.map(async (r) => [r.id, await capacidadesDeRol(r.id)] as const),
    ),
  );

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-h3 font-heading font-semibold">Roles</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Un rol es un conjunto de capacidades. Las personas se asocian a roles
        desde su ficha.
      </p>
      <div className="mt-6">
        <EditorRoles
          roles={roles}
          capacidades={capacidades}
          capacidadesPorRol={capsPorRol}
        />
      </div>
    </main>
  );
}
