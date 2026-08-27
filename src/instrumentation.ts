// Next llama a register() una vez al arrancar el server node. Acá se
// registran las capacidades declaradas (kernel + módulos) en la tabla
// `capacidad`, para que un deploy que agrega o cambia capacidades las deje
// en la base sin depender de re-correr el bootstrap a mano.
//
// A diferencia del bus de eventos (que NO se puede inicializar desde acá —
// ver kernel/eventos/bus.ts: cada chunk se lleva su propia copia del array
// de suscripciones), esto es una escritura a la base: idempotente y sin
// estado en memoria que compartir entre chunks. Si falla, se loguea y el
// server arranca igual.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { registrarCapacidades } = await import("@/kernel/permisos/registro");
    const { capacidadesDeclaradas } =
      await import("@/kernel/permisos/capacidades-declaradas");
    await registrarCapacidades(capacidadesDeclaradas);
  } catch (error) {
    console.error(
      "[instrumentation] no se pudieron registrar las capacidades:",
      error,
    );
  }
}
