import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { FondoSeccion } from "@/components/fondo-seccion";

// /ingresar y /restablecer-password: layout propio, sin header ni footer
// del sitio — es la puerta, no una página más (§8.5). Panel centrado
// sobre una banda quieta tintada de turquesa, con un solo enlace de
// vuelta al sitio.
export default function LayoutSinChasis({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <FondoSeccion tinte="turquesa" />
      <Link
        href="/"
        className="absolute top-6 left-6 z-10 inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" />
        Volver al inicio
      </Link>
      {children}
    </main>
  );
}
