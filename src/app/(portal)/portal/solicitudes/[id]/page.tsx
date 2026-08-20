import Link from "next/link";
import { notFound } from "next/navigation";
import { NoEncontrado } from "@/kernel/errores";
import { obtenerSesionPortal } from "@/lib/sesion-portal";
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
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Tus solicitudes
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-3xl font-semibold">{solicitud.titulo}</h1>
          <span className="text-sm text-muted-foreground">
            {ETIQUETA_ESTADO[solicitud.estado]}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {ETIQUETA_TIPO[solicitud.tipo]}
        </p>
      </div>

      <p className="whitespace-pre-wrap rounded-lg border bg-background p-4">
        {solicitud.descripcion}
      </p>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Hilo</h2>
        {mensajes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay respuestas.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {mensajes.map((m) => (
              <li key={m.id} className="rounded-lg border bg-background p-4">
                <p className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {m.personaId === sesion.personaId ? "Vos" : "Mirage"}
                  </span>
                  <span>{new Date(m.creadoEn).toLocaleString("es-AR")}</span>
                </p>
                <p className="mt-1 whitespace-pre-wrap">{m.cuerpo}</p>
              </li>
            ))}
          </ul>
        )}

        <FormularioMensajePortal solicitudId={solicitud.id} />
      </div>
    </main>
  );
}
