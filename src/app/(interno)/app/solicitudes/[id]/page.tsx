import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NoEncontrado } from "@/kernel/errores";
import { listarPersonas } from "@/kernel/identidad/personas";
import { obtenerCliente } from "@/modules/clientes/api";
import {
  listarMensajesDeSolicitud,
  obtenerSolicitud,
} from "@/modules/solicitudes/api";
import {
  aceptarSolicitudAction,
  marcarEnEvaluacionAction,
  rechazarSolicitudAction,
} from "../actions";
import { FormularioMensaje } from "../mensaje-formulario";

const ETIQUETA_ESTADO: Record<string, string> = {
  recibida: "Recibida",
  en_evaluacion: "En evaluación",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
};

const ETIQUETA_TIPO: Record<string, string> = {
  funcionalidad_nueva: "Funcionalidad nueva",
  bug: "Bug",
  consulta: "Consulta",
  otro: "Otro",
};

export default async function PaginaSolicitud({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idNumerico = Number(id);
  if (!Number.isInteger(idNumerico)) {
    notFound();
  }

  const solicitud = await obtenerSolicitud(idNumerico).catch((error) => {
    if (error instanceof NoEncontrado) {
      notFound();
    }
    throw error;
  });

  const [cliente, mensajes, personas] = await Promise.all([
    obtenerCliente(solicitud.clienteId),
    listarMensajesDeSolicitud(solicitud.id),
    listarPersonas(),
  ]);
  const nombreDePersona = new Map(
    personas.map((p) => [p.id, `${p.nombre} ${p.apellido}`]),
  );

  const evaluable =
    solicitud.estado === "recibida" || solicitud.estado === "en_evaluacion";

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{solicitud.titulo}</h1>
        <span className="text-sm text-muted-foreground">
          {ETIQUETA_ESTADO[solicitud.estado]}
        </span>
      </div>
      <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
        <p>Cliente: {cliente.nombre}</p>
        <p>Tipo: {ETIQUETA_TIPO[solicitud.tipo]}</p>
        <p>
          Pedida por: {nombreDePersona.get(solicitud.creadaPorPersonaId) ?? "—"}
        </p>
        {solicitud.proyectoId && (
          <p>
            Convertida en el{" "}
            <Link
              href={`/app/proyectos/${solicitud.proyectoId}`}
              className="underline"
            >
              proyecto #{solicitud.proyectoId}
            </Link>
          </p>
        )}
      </div>

      <p className="mt-6 whitespace-pre-wrap text-sm">
        {solicitud.descripcion}
      </p>

      {evaluable && (
        <div className="mt-6 flex flex-wrap gap-2">
          {solicitud.estado === "recibida" && (
            <form action={marcarEnEvaluacionAction.bind(null, solicitud.id)}>
              <Button type="submit" size="sm" variant="secondary">
                Poner en evaluación
              </Button>
            </form>
          )}
          <form action={aceptarSolicitudAction.bind(null, solicitud.id)}>
            <Button type="submit" size="sm">
              Aceptar
            </Button>
          </form>
          <form action={rechazarSolicitudAction.bind(null, solicitud.id)}>
            <Button type="submit" size="sm" variant="destructive">
              Rechazar
            </Button>
          </form>
        </div>
      )}

      <div className="mt-10 border-t pt-6">
        <h2 className="text-lg font-semibold">Hilo</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {mensajes.map((m) => (
            <li
              key={m.id}
              className={`rounded-md border p-3 text-sm ${
                m.visibleParaCliente ? "" : "border-amber-400 bg-amber-50"
              }`}
            >
              <p className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{nombreDePersona.get(m.personaId) ?? "—"}</span>
                <span>{new Date(m.creadoEn).toLocaleString("es-AR")}</span>
              </p>
              {!m.visibleParaCliente && (
                <p className="text-xs font-medium text-amber-800">
                  Nota interna — el cliente no la vio
                </p>
              )}
              <p className="mt-1 whitespace-pre-wrap">{m.cuerpo}</p>
            </li>
          ))}
          {mensajes.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Todavía no hay mensajes.
            </p>
          )}
        </ul>

        <div className="mt-4">
          <FormularioMensaje solicitudId={solicitud.id} />
        </div>
      </div>
    </main>
  );
}
