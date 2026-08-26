import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardProyectoCompacta } from "@/components/ui/card-proyecto";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { NoEncontrado } from "@/kernel/errores";
import { obtenerPersona, listarPersonas } from "@/kernel/identidad/personas";
import { obtenerArbolCompleto, obtenerNodo } from "@/kernel/organigrama/arbol";
import {
  listarContactosDeCliente,
  listarInteraccionesDeCliente,
  obtenerCliente,
} from "@/modules/clientes/api";
import { listarProyectosDeCliente } from "@/modules/proyectos/api";
import { listarSolicitudesDeCliente } from "@/modules/solicitudes/api";
import {
  actualizarClienteAction,
  archivarClienteAction,
  invitarContactoAction,
} from "../actions";
import {
  FormularioContacto,
  FormularioInteraccion,
} from "../clientes-formularios";
import { FormularioCliente } from "../formulario-cliente";
import { LineaDeTiempo } from "../linea-de-tiempo";

const ETIQUETA_ESTADO_SOLICITUD: Record<string, string> = {
  recibida: "Recibida",
  en_evaluacion: "En evaluación",
};

export default async function PaginaCliente({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idNumerico = Number(id);
  if (!Number.isInteger(idNumerico)) {
    notFound();
  }

  const cliente = await obtenerCliente(idNumerico).catch((error) => {
    if (error instanceof NoEncontrado) {
      notFound();
    }
    throw error;
  });

  const [
    nodoResponsable,
    contactoDirecto,
    contactos,
    interacciones,
    nodos,
    personas,
    proyectos,
    solicitudes,
  ] = await Promise.all([
    obtenerNodo(cliente.nodoResponsableId),
    obtenerPersona(cliente.contactoDirectoId),
    listarContactosDeCliente(cliente.id),
    listarInteraccionesDeCliente(cliente.id),
    obtenerArbolCompleto(),
    listarPersonas(),
    listarProyectosDeCliente(cliente.id),
    listarSolicitudesDeCliente(cliente.id),
  ]);
  const empleados = personas.filter((p) => p.tipo === "empleado" && p.activo);
  const solicitudesAbiertas = solicitudes.filter(
    (s) => s.estado === "recibida" || s.estado === "en_evaluacion",
  );
  // Con quién puede haber una interacción: el contacto directo más los
  // contactos cargados, sin duplicar si ya coinciden.
  const personasParaInteraccion = [
    {
      id: contactoDirecto.id,
      nombre: contactoDirecto.nombre,
      apellido: contactoDirecto.apellido,
    },
    ...contactos
      .filter((c) => c.personaId !== contactoDirecto.id)
      .map((c) => ({
        id: c.personaId,
        nombre: c.nombre,
        apellido: c.apellido,
      })),
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{cliente.nombre}</h1>
          <Badge variant={cliente.estado === "activo" ? "primary" : "outline"}>
            {cliente.estado === "activo" ? "Activo" : "Inactivo"}
          </Badge>
        </div>
        {cliente.estado === "activo" && (
          <form action={archivarClienteAction.bind(null, cliente.id)}>
            <Button type="submit" size="sm" variant="destructive">
              Archivar
            </Button>
          </form>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Datos y contactos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-4 text-sm">
              <div>
                <h3 className="font-medium">Nodo responsable</h3>
                <p className="text-muted-foreground">
                  {nodoResponsable.nombre}
                </p>
              </div>
              <div>
                <h3 className="font-medium">Contacto directo</h3>
                <p className="text-muted-foreground">
                  {contactoDirecto.nombre} {contactoDirecto.apellido} —{" "}
                  {contactoDirecto.email}
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-medium">Editar</h3>
                <FormularioCliente
                  action={actualizarClienteAction.bind(null, cliente.id)}
                  nodos={nodos}
                  personas={empleados}
                  valoresIniciales={cliente}
                  textoBoton="Guardar"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 text-sm">
              <h3 className="font-medium">Contactos del cliente</h3>
              {contactos.length === 0 ? (
                <p className="text-muted-foreground">Sin contactos cargados.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {contactos.map((c) => (
                    <li key={c.id} className="flex items-center gap-2">
                      <span>
                        {c.nombre} {c.apellido}
                        {c.cargo ? ` — ${c.cargo}` : ""}
                        {c.esPrincipal ? " (principal)" : ""}
                      </span>
                      {c.usuarioId ? (
                        <span className="text-xs text-muted-foreground">
                          Ya tiene acceso al portal
                        </span>
                      ) : (
                        <form
                          action={invitarContactoAction.bind(
                            null,
                            cliente.id,
                            c.personaId,
                          )}
                        >
                          <Button type="submit" size="sm" variant="ghost">
                            Invitar al portal
                          </Button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-2">
                <FormularioContacto clienteId={cliente.id} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Proyectos vinculados</CardTitle>
          </CardHeader>
          <CardContent>
            {proyectos.length === 0 ? (
              <EstadoVacio
                titulo="Sin proyectos vinculados todavía."
                accion={
                  <Button
                    size="sm"
                    variant="secondary"
                    render={
                      <Link href="/app/proyectos/nuevo">Nuevo proyecto</Link>
                    }
                  />
                }
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {proyectos.map((p) => (
                  <CardProyectoCompacta
                    key={p.id}
                    id={p.id}
                    nombre={p.nombre}
                    estado={p.estado}
                    hechas={p.hechas}
                    totales={p.totales}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Solicitudes abiertas</CardTitle>
          </CardHeader>
          <CardContent>
            {solicitudesAbiertas.length === 0 ? (
              <EstadoVacio titulo="No hay solicitudes abiertas de este cliente." />
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {solicitudesAbiertas.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <Link
                      href={`/app/solicitudes/${s.id}`}
                      className="truncate hover:underline"
                    >
                      {s.titulo}
                    </Link>
                    <Badge variant="outline">
                      {ETIQUETA_ESTADO_SOLICITUD[s.estado] ?? s.estado}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Línea de tiempo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <LineaDeTiempo interacciones={interacciones} />
            <div className="border-t border-border pt-4">
              <FormularioInteraccion
                clienteId={cliente.id}
                personas={personasParaInteraccion}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
