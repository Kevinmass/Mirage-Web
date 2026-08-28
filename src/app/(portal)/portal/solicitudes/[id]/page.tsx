import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { NoEncontrado } from "@/kernel/errores";
import { obtenerSesionPortal } from "@/lib/sesion-portal";
import { tiempoRelativo } from "@/lib/tiempo-relativo";
import {
  listarMensajesVisiblesParaCliente,
  obtenerSolicitudDeCliente,
} from "@/modules/solicitudes/api";
import { FormularioMensajePortal } from "../mensaje-formulario";

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
  bug: "Algo no está funcionando",
  consulta: "Consulta",
  otro: "Otro",
};

export default async function PaginaSolicitudPortal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idNumerico = Number(id);
  if (!Number.isInteger(idNumerico)) {
    notFound();
  }

  const sesion = await obtenerSesionPortal();
  if (!sesion) {
    return (
      <main>
        <p className="text-muted-foreground">
          Tu cuenta no está asociada a ningún cliente todavía.
        </p>
      </main>
    );
  }

  // obtenerSolicitudDeCliente, nunca obtenerSolicitud a secas — el
  // filtro por cliente_id vive en api.ts (diseño §8), y acá es lo que
  // convierte "pedir el id de la solicitud de otro cliente" en un 404
  // en vez de una filtración de datos.
  const solicitud = await obtenerSolicitudDeCliente(
    sesion.clienteId,
    idNumerico,
  ).catch((error) => {
    if (error instanceof NoEncontrado) {
      notFound();
    }
    throw error;
  });

  // listarMensajesVisiblesParaCliente, no listarMensajesDeSolicitud —
  // el filtro de qué mensaje entra al portal pasa por la consulta
  // (api.ts), no por ocultar filas en el render.
  const mensajes = await listarMensajesVisiblesParaCliente(solicitud.id);

  return (
    <main className="flex flex-col gap-6">
      <div>
        <Link
          href="/portal/solicitudes"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Tus solicitudes
        </Link>
        <div className="mt-2 flex items-center justify-between gap-3">
          <h1 className="text-h2 font-heading font-semibold">
            {solicitud.titulo}
          </h1>
          <Badge variant={VARIANTE_ESTADO[solicitud.estado]}>
            {ETIQUETA_ESTADO[solicitud.estado]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {ETIQUETA_TIPO[solicitud.tipo]}
        </p>
      </div>

      <p className="rounded-lg bg-muted p-4 whitespace-pre-wrap">
        {solicitud.descripcion}
      </p>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-heading font-semibold">Hilo</h2>
        {mensajes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay respuestas.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {mensajes.map((m) => {
              const esMio = m.personaId === sesion.personaId;
              const fecha = new Date(m.creadoEn);
              return (
                <li
                  key={m.id}
                  className={
                    esMio
                      ? "max-w-[85%] self-start rounded-lg rounded-bl-none bg-muted p-4"
                      : "max-w-[85%] self-end rounded-lg rounded-br-none bg-turquesa-50 p-4"
                  }
                >
                  <p className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
                    <span>{esMio ? "Vos" : "Mirage"}</span>
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

        <FormularioMensajePortal solicitudId={solicitud.id} />
      </div>
    </main>
  );
}
