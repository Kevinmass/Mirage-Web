import Link from "next/link";
import { DOMINIO_CANONICO } from "@/lib/dominio";

const navegacion = [
  { href: "/", etiqueta: "Inicio" },
  { href: "/servicios", etiqueta: "Servicios" },
  { href: "/casos", etiqueta: "Casos" },
  { href: "/contacto", etiqueta: "Contacto" },
];

const datosEstructurados = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Mirage",
  url: `https://${DOMINIO_CANONICO}`,
  email: "mirage.software.ar@gmail.com",
  description:
    "Mirage desarrolla software a medida: sistemas específicos para las necesidades de cada cliente.",
};

export default function LayoutPublico({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify de un objeto propio definido en este archivo, sin
        // datos de usuario ni de la base.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(datosEstructurados),
        }}
      />
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-semibold">
            Mirage
          </Link>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            {navegacion.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-foreground"
              >
                {item.etiqueta}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t">
        <div className="mx-auto max-w-3xl px-6 py-8 text-sm text-muted-foreground">
          Mirage — {new Date().getFullYear()}
        </div>
      </footer>
    </>
  );
}
