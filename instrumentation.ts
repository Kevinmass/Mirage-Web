// Next.js corre register() una vez al arrancar el server (node, no edge)
// — es "al arrancar" para esta app (diseño §4.3: el kernel registra las
// capacidades de cada módulo al arrancar).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { registrarCapacidades } = await import("@/kernel/permisos/registro");
  const { capacidadesDeclaradas } =
    await import("@/kernel/permisos/capacidades-declaradas");

  try {
    await registrarCapacidades(capacidadesDeclaradas);
  } catch (error) {
    // No tirar abajo el arranque del server por esto — se loguea y sigue
    // (p.ej. si la base todavía no tiene la migración de permisos
    // aplicada en medio de un deploy).
    console.error(
      "[permisos] no se pudieron registrar las capacidades al arrancar",
      error,
    );
  }

  // Job de sync de repositorios (diseño §6.3): cada 30 minutos, en
  // proceso, nunca dentro de un request. sincronizarRepositorio ya
  // atrapa sus propios errores de red/GitHub y los deja en
  // repositorio_snapshot.error — este catch es solo para lo
  // inesperado (p.ej. la base caída), para que el setInterval no se
  // corte silenciosamente.
  const TREINTA_MINUTOS = 30 * 60 * 1000;
  const { sincronizarTodosLosRepositorios } =
    await import("@/modules/proyectos/api");
  const correrSyncDeRepositorios = () => {
    sincronizarTodosLosRepositorios().catch((error) => {
      console.error("[proyectos] sync de repositorios falló", error);
    });
  };
  correrSyncDeRepositorios();
  setInterval(correrSyncDeRepositorios, TREINTA_MINUTOS);
}
