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
  clienteId: number;
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

const PLANTILLAS: Record<string, Renderizador> = {
  "cliente.creado": clienteCreado,
  "proyecto.creado": proyectoCreado,
  "proyecto.estado_cambiado": proyectoEstadoCambiado,
  "tarea.asignada": tareaAsignada,
  "auth.recuperar-password": authRecuperarPassword,
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
