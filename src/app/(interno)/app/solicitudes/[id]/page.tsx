import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NoEncontrado } from "@/kernel/errores";
import { listarPersonas } from "@/kernel/identidad/personas";
import { tiempoRelativo } from "@/lib/tiempo-relativo";
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

const VARIANTE_ESTADO: Record<
  string,
  "outline" | "accent" | "primary" | "destructive"
> = {
  recibida: "outline",
  en_evaluacion: "accent",
  aceptada: "primary",
  rechazada: "destructive",
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
    <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6">
      <Link
        href="/app/solicitudes"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground md:hidden"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Solicitudes
      </Link>

      <div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-semibold">{solicitud.titulo}</h1>
          <Badge variant={VARIANTE_ESTADO[solicitud.estado]}>
            {ETIQUETA_ESTADO[solicitud.estado]}
          </Badge>
        </div>
        <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
          <p>
            Cliente:{" "}
            <Link
              href={`/app/clientes/${cliente.id}`}
              className="underline underline-offset-2 hover:text-foreground"
            >
              {cliente.nombre}
            </Link>
          </p>
          <p>Tipo: {ETIQUETA_TIPO[solicitud.tipo]}</p>
          <p>
            Pedida por:{" "}
            {nombreDePersona.get(solicitud.creadaPorPersonaId) ?? "—"}
          </p>
          {solicitud.proyectoId && (
            <p>
              Convertida en el{" "}
              <Link
                href={`/app/proyectos/${solicitud.proyectoId}`}
                className="underline underline-offset-2 hover:text-foreground"
              >
                proyecto #{solicitud.proyectoId}
              </Link>
            </p>
          )}
        </div>
      </div>

      <p className="rounded-lg bg-muted p-4 text-sm whitespace-pre-wrap">
        {solicitud.descripcion}
      </p>

      <div className="flex flex-col gap-3 border-t border-border pt-6">
        <h2 className="text-sm font-medium text-muted-foreground">Hilo</h2>
        {mensajes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay mensajes.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {mensajes.map((m) => {
              const esDelCliente = m.personaId === solicitud.creadaPorPersonaId;
              const fecha = new Date(m.creadoEn);
              if (!m.visibleParaCliente) {
                return (
                  <li
                    key={m.id}
                    className="rounded-md border-l-4 border-accent bg-accent/10 p-3 text-sm"
                  >
                    <p className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-medium text-accent-foreground">
                        Nota interna — el cliente no la vio
                      </span>
                      <span title={fecha.toLocaleString("es-AR")}>
                        {tiempoRelativo(fecha)}
                      </span>
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{m.cuerpo}</p>
                  </li>
                );
              }
              return (
                <li
                  key={m.id}
                  className={
                    esDelCliente
                      ? "self-start max-w-[85%] rounded-lg rounded-bl-none bg-muted p-3 text-sm"
                      : "self-end max-w-[85%] rounded-lg rounded-br-none bg-turquesa-50 p-3 text-sm"
                  }
                >
                  <p className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
                    <span>{nombreDePersona.get(m.personaId) ?? "—"}</span>
                    <span title={fecha.toLocaleString("es-AR")}>
                      {tiempoRelativo(fecha)}
                    </span>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{m.cuerpo}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-4 border-t border-border pt-6">
        <FormularioMensaje solicitudId={solicitud.id} />

        {evaluable && (
          <div className="flex flex-wrap gap-2">
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
      </div>
    </div>
  );
}
