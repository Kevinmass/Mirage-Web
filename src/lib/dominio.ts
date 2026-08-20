// Dominio canónico (diseño §3). miragesoftware.online es staging
// (noindex) y miragesoftware.store solo redirige — ver proxy.ts y
// robots.ts. Los tres dominios corren el mismo deploy; lo que cambia es
// el host de la request.
export const DOMINIO_CANONICO = "miragesoftware.com.ar";
export const DOMINIO_STAGING = "miragesoftware.online";
export const DOMINIO_STORE = "miragesoftware.store";

export function esHostCanonico(host: string | null): boolean {
  if (!host) return false;
  const sinPuerto = host.split(":")[0];
  return (
    sinPuerto === DOMINIO_CANONICO || sinPuerto === `www.${DOMINIO_CANONICO}`
  );
}
