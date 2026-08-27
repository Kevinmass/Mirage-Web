import { FondoSeccion } from "@/components/fondo-seccion";

// El póster estático obligatorio del hero (§5.2): banda quieta + grano,
// sin JS. Reusa <FondoSeccion> — es el `loading` de next/dynamic
// mientras se decide (o se descarta, en el PR 2) el canvas WebGL.
export function PosterHero() {
  return <FondoSeccion tinte="turquesa" className="absolute inset-0" />;
}
