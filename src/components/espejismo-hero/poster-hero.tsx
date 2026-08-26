import { CampoArena } from "@/components/campo-arena";

// El póster estático obligatorio del hero (§5.2): gradiente + grano, sin
// JS. Reusa <CampoArena> tal cual — es exactamente lo que ese componente
// ya es, y es también el `loading` de next/dynamic mientras se decide
// (o se descarta) el canvas WebGL.
export function PosterHero() {
  return <CampoArena tinte="arena-turquesa" className="absolute inset-0" />;
}
