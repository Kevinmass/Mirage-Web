import { FondoSeccion } from "@/components/fondo-seccion";

// /ingresar y /restablecer-password: layout propio, sin header ni footer
// del sitio — es la puerta, no una página más (§8.5). Panel centrado
// sobre una banda quieta tintada de turquesa.
export default function LayoutSinChasis({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <FondoSeccion tinte="turquesa" />
      {children}
    </main>
  );
}
