import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IndicadorCarga } from "@/components/ui/indicador-carga";
import { NoEncontrado } from "@/kernel/errores";
import { obtenerPersonaConAcceso } from "@/kernel/identidad/personas";
import { obtenerSesionActual } from "@/kernel/identidad/sesion";
import { obtenerArbolCompleto } from "@/kernel/organigrama/arbol";
import { tienePermiso } from "@/kernel/permisos/evaluar";
import { listarRoles, rolesDePersona } from "@/kernel/permisos/roles";
import {
  actualizarPersonaAction,
  archivarPersonaAction,
  invitarPersonaAction,
  reenviarInvitacionAction,
} from "../actions";
import { FormularioPersona } from "../formulario-persona";
import { RolesDePersona } from "../roles-persona";

const ETIQUETA_ESTADO = {
  sin_acceso: "Sin acceso",
  invitada: "Invitada — esperando que confirme el mail",
  confirmada: "Acceso confirmado",
} as const;

export default async function PaginaPersona({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idNumerico = Number(id);
  if (!Number.isInteger(idNumerico)) {
    notFound();
  }

  const [persona, nodos, sesion, rolesDeEsta] = await Promise.all([
    obtenerPersonaConAcceso(idNumerico).catch((error) => {
      if (error instanceof NoEncontrado) {
        notFound();
      }
      throw error;
    }),
    obtenerArbolCompleto(),
    obtenerSesionActual(),
    rolesDePersona(idNumerico),
  ]);
  const nodosQueOcupa = nodos.filter((n) =>
    n.ocupantes.some((o) => o.personaId === idNumerico),
  );
  const puedeAdministrarRoles =
    !!sesion && (await tienePermiso(sesion.personaId, "identidad.administrar"));
  const todosLosRoles = puedeAdministrarRoles ? await listarRoles() : [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-h3 font-heading font-semibold">
        {persona.nombre} {persona.apellido}
      </h1>

      <div className="mt-6 flex flex-col gap-6">
        <div>
          <p className="mb-2 text-sm font-medium">Nodos que ocupa</p>
          <div className="flex flex-wrap items-center gap-2">
            <IndicadorCarga cantidadDeNodos={nodosQueOcupa.length} />
            {nodosQueOcupa.map((n) => (
              <Link
                key={n.id}
                href="/app/organigrama"
                className="text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                {n.nombre}
              </Link>
            ))}
          </div>
        </div>

        <FormularioPersona
          action={actualizarPersonaAction.bind(null, idNumerico)}
          valoresIniciales={persona}
          textoBoton="Guardar"
        />

        <div>
          <p className="mb-2 text-sm font-medium">Roles</p>
          {puedeAdministrarRoles ? (
            <RolesDePersona
              personaId={idNumerico}
              roles={todosLosRoles}
              rolesActuales={rolesDeEsta.map((r) => r.id)}
            />
          ) : rolesDeEsta.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              {rolesDeEsta.map((r) => r.nombre).join(", ")}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Sin roles.</p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Badge
              variant={
                persona.estadoAcceso === "confirmada"
                  ? "primary"
                  : persona.estadoAcceso === "invitada"
                    ? "accent"
                    : "outline"
              }
            >
              {ETIQUETA_ESTADO[persona.estadoAcceso]}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-3">
            {persona.estadoAcceso === "sin_acceso" && (
              <form action={invitarPersonaAction.bind(null, idNumerico)}>
                <Button type="submit" variant="secondary">
                  Invitar a tener acceso
                </Button>
              </form>
            )}
            {persona.estadoAcceso === "invitada" && (
              <form action={reenviarInvitacionAction.bind(null, idNumerico)}>
                <Button type="submit" variant="secondary">
                  Reenviar invitación
                </Button>
              </form>
            )}

            {persona.activo && (
              <form action={archivarPersonaAction.bind(null, idNumerico)}>
                <Button type="submit" variant="destructive">
                  Archivar
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
