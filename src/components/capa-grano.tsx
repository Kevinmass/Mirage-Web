// La capa de grano del sistema visual (§4 del sistema visual): un solo
// elemento en el layout raíz, SVG con feTurbulence inline, que hace que
// el arena se lea como material y no como un color plano. Estático, sin
// JS, cuesta prácticamente nada.
export function CapaGrano() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 opacity-[0.03] mix-blend-multiply dark:opacity-[0.05] dark:mix-blend-overlay"
    >
      <svg width="100%" height="100%">
        <filter id="grano-mirage">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grano-mirage)" />
      </svg>
    </div>
  );
}
