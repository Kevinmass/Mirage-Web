export interface PlantillaRenderizada {
  asunto: string;
  html: string;
}

type Renderizador = (datos: unknown) => PlantillaRenderizada;

// Convención: el nombre de la plantilla es el nombre del evento que la
// dispara — no hay necesidad de un mapeo N:1 en v1, y mantenerlos
// iguales evita una tabla de traducción extra. datos llega tal cual
// salió del evento (pasó por jsonb, así que son los mismos campos,
// sin fechas — ninguno de estos eventos lleva Date).

interface DatosClienteCreado {
  clienteId: number;
  nombre: string;
}

function clienteCreado(datos: unknown): PlantillaRenderizada {
  const d = datos as DatosClienteCreado;
  return {
    asunto: `Nuevo cliente: ${d.nombre}`,
    html: `<p>Se creó el cliente <strong>${d.nombre}</strong> y quedó bajo tu nodo responsable.</p>`,
  };
}

interface DatosProyectoCreado {
  proyectoId: number;
  clienteId: number | null;
  nombre: string;
}

function proyectoCreado(datos: unknown): PlantillaRenderizada {
  const d = datos as DatosProyectoCreado;
  return {
    asunto: `Nuevo proyecto: ${d.nombre}`,
    html: `<p>Se creó el proyecto <strong>${d.nombre}</strong> bajo tu nodo responsable.</p>`,
  };
}

interface DatosProyectoEstadoCambiado {
  proyectoId: number;
  nombre: string;
  estadoAnterior: string;
  estadoNuevo: string;
}

function proyectoEstadoCambiado(datos: unknown): PlantillaRenderizada {
  const d = datos as DatosProyectoEstadoCambiado;
  return {
    asunto: `${d.nombre}: ${d.estadoAnterior} → ${d.estadoNuevo}`,
    html: `<p>El proyecto <strong>${d.nombre}</strong> pasó de <em>${d.estadoAnterior}</em> a <em>${d.estadoNuevo}</em>.</p>`,
  };
}

interface DatosTareaAsignada {
  tareaId: number;
  personaId: number;
  titulo: string;
}

function tareaAsignada(datos: unknown): PlantillaRenderizada {
  const d = datos as DatosTareaAsignada;
  return {
    asunto: `Te asignaron una tarea: ${d.titulo}`,
    html: `<p>Se te asignó la tarea <strong>${d.titulo}</strong>.</p>`,
  };
}

interface DatosSolicitudCreada {
  solicitudId: number;
  clienteId: number;
  titulo: string;
}

function solicitudCreada(datos: unknown): PlantillaRenderizada {
  const d = datos as DatosSolicitudCreada;
  return {
    asunto: `Nueva solicitud: ${d.titulo}`,
    html: `<p>Llegó una nueva solicitud, <strong>${d.titulo}</strong>, para un cliente bajo tu nodo responsable.</p>`,
  };
}

interface DatosSolicitudAceptada {
  solicitudId: number;
  clienteId: number;
  titulo: string;
}

function solicitudAceptada(datos: unknown): PlantillaRenderizada {
  const d = datos as DatosSolicitudAceptada;
  return {
    asunto: `Tu solicitud fue aceptada: ${d.titulo}`,
    html: `<p>Tu solicitud <strong>${d.titulo}</strong> fue aceptada y se convirtió en un proyecto.</p>`,
  };
}

interface DatosSolicitudRechazada {
  solicitudId: number;
  clienteId: number;
  titulo: string;
}

function solicitudRechazada(datos: unknown): PlantillaRenderizada {
  const d = datos as DatosSolicitudRechazada;
  return {
    asunto: `Tu solicitud fue rechazada: ${d.titulo}`,
    html: `<p>Tu solicitud <strong>${d.titulo}</strong> fue rechazada.</p>`,
  };
}

interface DatosSolicitudMensajeAgregado {
  solicitudId: number;
  clienteId: number;
}

function solicitudMensajeAgregado(datos: unknown): PlantillaRenderizada {
  const d = datos as DatosSolicitudMensajeAgregado;
  return {
    asunto: `Nuevo mensaje en tu solicitud`,
    html: `<p>Hay un mensaje nuevo en la solicitud #${d.solicitudId}.</p>`,
  };
}

// No es un evento del bus — la dispara better-auth directo
// (kernel/identidad/auth.ts, sendResetPassword) tanto para invitar a
// alguien nuevo como para "olvidé mi contraseña": las dos usan el
// mismo mecanismo de better-auth y no hay forma de distinguirlas
// desde acá, así que la plantilla es neutra y sirve para ambas.
interface DatosRecuperarPassword {
  url: string;
}

function authRecuperarPassword(datos: unknown): PlantillaRenderizada {
  const d = datos as DatosRecuperarPassword;
  return {
    asunto: "Acceso a Mirage",
    html: `<p>Usá este link para poner tu contraseña de acceso a Mirage:</p><p><a href="${d.url}">${d.url}</a></p><p>Si no lo pediste vos, ignorá este mail.</p>`,
  };
}

// La dispara better-auth (auth.ts, sendVerificationEmail) cuando hace falta
// confirmar la dirección sin pasar por un reset de contraseña — p.ej. un
// "reenviar verificación" desde /app/personas. El alta por invitación ya
// verifica de paso al completar el reset, así que esta es la vía
// secundaria.
interface DatosVerificarEmail {
  url: string;
}

function authVerificarEmail(datos: unknown): PlantillaRenderizada {
  const d = datos as DatosVerificarEmail;
  return {
    asunto: "Confirmá tu mail en Mirage",
    html: `<p>Confirmá que esta es tu dirección para acceder a Mirage:</p><p><a href="${d.url}">${d.url}</a></p><p>Si no esperabas este mail, ignoralo.</p>`,
  };
}

const PLANTILLAS: Record<string, Renderizador> = {
  "cliente.creado": clienteCreado,
  "proyecto.creado": proyectoCreado,
  "proyecto.estado_cambiado": proyectoEstadoCambiado,
  "tarea.asignada": tareaAsignada,
  "solicitud.creada": solicitudCreada,
  "solicitud.aceptada": solicitudAceptada,
  "solicitud.rechazada": solicitudRechazada,
  "solicitud.mensaje_agregado": solicitudMensajeAgregado,
  "auth.recuperar-password": authRecuperarPassword,
  "auth.verificar-email": authVerificarEmail,
};

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

// La campana del interno (diseño §8.13): "cada notificación es un
// enlace a su origen". Los hrefs de acá son SIEMPRE rutas de /app —
// esta función solo la usa la campana interna (obtenerSesionActual ya
// garantiza que quien la ve es un empleado). solicitud.aceptada,
// solicitud.rechazada y auth.recuperar-password no tienen un origen de
// /app: las dos primeras siempre viajan a la persona que creó el
// pedido (un contacto_cliente, que nunca puede entrar a /app — ver
// decidirAcceso), y la tercera no es un evento del bus. Si el interno
// alguna vez necesita ver esas, hace falta un resolver aparte para
// /portal, no estirar este.
export function resolverEnlaceInterno(
  plantilla: string,
  datos: unknown,
): string | null {
  switch (plantilla) {
    case "cliente.creado":
      return `/app/clientes/${(datos as { clienteId: number }).clienteId}`;
    case "proyecto.creado":
    case "proyecto.estado_cambiado":
      return `/app/proyectos/${(datos as { proyectoId: number }).proyectoId}`;
    case "tarea.asignada":
      return `/app/proyectos/${(datos as { proyectoId: number }).proyectoId}`;
    case "solicitud.creada":
    case "solicitud.mensaje_agregado":
      return `/app/solicitudes/${(datos as { solicitudId: number }).solicitudId}`;
    default:
      return null;
  }
}

// El nombre de módulo (antes del primer punto) alcanza como categoría
// de filtro (diseño §8.13: "filtros por tipo") — no hay una taxonomía
// de producto más fina que valga la pena mantener aparte.
export function tipoDeNotificacion(plantilla: string): string {
  return plantilla.split(".")[0]!;
}
