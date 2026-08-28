import { DOMINIO_CANONICO } from "@/lib/dominio";

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
      {children}
    </>
  );
}
