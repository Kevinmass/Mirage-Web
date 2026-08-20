// E.164: '+' seguido del código de país y el número, sin espacios ni
// guiones, 8 a 15 dígitos en total (diseño: "+5491122334455"). Lo usa
// quien escriba persona.telefono (el ABM de personas, PR 3.2) —
// normalizar después variantes de escritura es trabajo sucio y evitable.
const TELEFONO_E164 = /^\+[1-9]\d{7,14}$/;

export function esTelefonoE164Valido(telefono: string): boolean {
  return TELEFONO_E164.test(telefono);
}
