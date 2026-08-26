// Límite de tasa en memoria, por IP (§8.4 del plan de frontend: "un
// formulario público sin límite es un formulario que va a recibir
// spam"). A propósito no usa una tabla — es un mitigador de spam, no un
// límite de seguridad duro, y una ventana en memoria que se reinicia en
// cada deploy es una pérdida aceptable para eso. Si el proceso corre en
// más de una instancia esto no comparte estado entre ellas; hoy es un
// solo servicio de Render (CLAUDE.md, "Multi-dominio por host").
const intentosPorClave = new Map<string, number[]>();

export function permitirIntento(
  clave: string,
  maximo: number,
  ventanaMs: number,
): boolean {
  const ahora = Date.now();
  const intentos = (intentosPorClave.get(clave) ?? []).filter(
    (marca) => ahora - marca < ventanaMs,
  );

  if (intentos.length >= maximo) {
    intentosPorClave.set(clave, intentos);
    return false;
  }

  intentos.push(ahora);
  intentosPorClave.set(clave, intentos);
  return true;
}
