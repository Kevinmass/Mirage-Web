import { suscribir } from "@/kernel/eventos/bus";
import { encolarNotificacion } from "./api";

// diseño §6.5/§7: notificaciones se suscribe a los eventos de v1 sin
// conocer a los módulos que los publican — cada handler solo sabe el
// nombre del evento y su payload (que declara, vía declaration
// merging sobre EventosRegistrados, el módulo que lo publica). Nunca
// importa modules/<otro>, ni siquiera su api.ts — si necesitara un
// dato que el payload no trae, el arreglo es pedirle al publicador que
// lo agregue (ver clientes/events.ts y proyectos/events.ts,
// destinatarioPersonaId), no ir a buscarlo cruzando módulos.
//
// El nombre de la plantilla es el nombre del evento — ver
// internal/plantillas.ts.
//
// Se llama sola al pie del archivo (efecto de import, no solo
// exportada) porque quien de verdad la dispara es
// kernel/eventos/registro.ts vía un import lazy dentro de bus.ts —
// ver el comentario de asegurarSuscripciones() ahí. También queda
// exportada para que los tests puedan volver a llamarla después de
// bus._reiniciarParaTests().
export function suscribirseAEventos(): void {
  suscribir("cliente.creado", async (payload) => {
    if (payload.destinatarioPersonaId === null) return;
    await encolarNotificacion({
      destinatarioPersonaId: payload.destinatarioPersonaId,
      plantilla: "cliente.creado",
      datos: payload,
    });
  });

  suscribir("proyecto.creado", async (payload) => {
    if (payload.destinatarioPersonaId === null) return;
    await encolarNotificacion({
      destinatarioPersonaId: payload.destinatarioPersonaId,
      plantilla: "proyecto.creado",
      datos: payload,
    });
  });

  suscribir("proyecto.estado_cambiado", async (payload) => {
    if (payload.destinatarioPersonaId === null) return;
    await encolarNotificacion({
      destinatarioPersonaId: payload.destinatarioPersonaId,
      plantilla: "proyecto.estado_cambiado",
      datos: payload,
    });
  });

  suscribir("tarea.asignada", async (payload) => {
    await encolarNotificacion({
      destinatarioPersonaId: payload.personaId,
      plantilla: "tarea.asignada",
      datos: payload,
    });
  });

  suscribir("solicitud.creada", async (payload) => {
    if (payload.destinatarioPersonaId === null) return;
    await encolarNotificacion({
      destinatarioPersonaId: payload.destinatarioPersonaId,
      plantilla: "solicitud.creada",
      datos: payload,
    });
  });

  suscribir("solicitud.aceptada", async (payload) => {
    if (payload.destinatarioPersonaId === null) return;
    await encolarNotificacion({
      destinatarioPersonaId: payload.destinatarioPersonaId,
      plantilla: "solicitud.aceptada",
      datos: payload,
    });
  });

  suscribir("solicitud.rechazada", async (payload) => {
    if (payload.destinatarioPersonaId === null) return;
    await encolarNotificacion({
      destinatarioPersonaId: payload.destinatarioPersonaId,
      plantilla: "solicitud.rechazada",
      datos: payload,
    });
  });

  suscribir("solicitud.mensaje_agregado", async (payload) => {
    if (payload.destinatarioPersonaId === null) return;
    await encolarNotificacion({
      destinatarioPersonaId: payload.destinatarioPersonaId,
      plantilla: "solicitud.mensaje_agregado",
      datos: payload,
    });
  });

  // tarea.vencida: evento de v1 (diseño §7) sin publicador todavía —
  // ningún job calcula tareas vencidas. Se agrega cuando ese job
  // exista y declare su payload real (mismo criterio que el resto:
  // no hay handler a ciegas para un payload inventado).
}

suscribirseAEventos();
