import Link from "next/link";

const COLUMNAS = [
  {
    titulo: "Empresa",
    enlaces: [
      { href: "/", etiqueta: "Inicio" },
      { href: "/casos", etiqueta: "Casos" },
    ],
  },
  {
    titulo: "Servicios",
    enlaces: [{ href: "/servicios", etiqueta: "Ver servicios" }],
  },
  {
    titulo: "Contacto",
    enlaces: [
      {
        href: "mailto:mirage.software.ar@gmail.com",
        etiqueta: "mirage.software.ar@gmail.com",
      },
      { href: "/contacto", etiqueta: "Formulario de contacto" },
    ],
  },
];

// Idéntico en las tres superficies (§6.3): decir "acá se terminó", no
// contenido colgado. La línea de degradado turquesa→ámbar→coral es la
// firma de la marca y el tope visual.
export function FooterMirage() {
  return (
    <footer className="relative border-t border-border bg-muted">
      <div
        aria-hidden
        className="absolute top-0 left-0 h-0.5 w-full bg-linear-to-r from-turquesa-500 via-ambar-500 to-coral-500"
      />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-4">
          <div className="flex flex-col gap-2 sm:col-span-1">
            <span className="font-heading text-lg font-bold">Mirage</span>
            <p className="text-sm text-muted-foreground">Software a medida.</p>
          </div>
          {COLUMNAS.map((columna) => (
            <div key={columna.titulo} className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-foreground">
                {columna.titulo}
              </p>
              {columna.enlaces.map((enlace) => (
                <Link
                  key={enlace.href}
                  href={enlace.href}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {enlace.etiqueta}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <p className="mt-10 text-sm text-muted-foreground">Mirage — 2026</p>
      </div>
    </footer>
  );
}
