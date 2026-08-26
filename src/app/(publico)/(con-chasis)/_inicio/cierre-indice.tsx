import Link from "next/link";

const SECCIONES = [
  { href: "/", etiqueta: "Inicio" },
  { href: "/servicios", etiqueta: "Servicios" },
  { href: "/casos", etiqueta: "Casos" },
  { href: "/contacto", etiqueta: "Contacto" },
];

// "flowing-menu" de React Bits, reteñido (§6.8): un índice grande que
// funciona como navegación expresiva y como despedida de la página.
// Reimplementado con un subrayado que crece desde la izquierda en CSS —
// la versión de React Bits desliza una segunda copia del texto por
// encima con GSAP; el gesto que importa (algo responde al hover) queda
// igual sin esa dependencia.
export function CierreIndice() {
  return (
    <nav aria-label="Secciones del sitio" className="flex flex-col">
      {SECCIONES.map((seccion) => (
        <Link
          key={seccion.href}
          href={seccion.href}
          className="group relative border-b border-border py-6 first:border-t"
        >
          <span className="font-heading text-display font-bold tracking-[-0.02em] text-foreground transition-colors group-hover:text-primary">
            {seccion.etiqueta}
          </span>
          <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary transition-[width] duration-(--dur-media) ease-(--ease-suave) group-hover:w-full motion-reduce:transition-none" />
        </Link>
      ))}
    </nav>
  );
}
