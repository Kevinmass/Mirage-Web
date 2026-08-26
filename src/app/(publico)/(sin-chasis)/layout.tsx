import { CampoArena } from "@/components/campo-arena";

// /ingresar y /restablecer-password: layout propio, sin header ni footer
// del sitio — es la puerta, no una página más (§8.5). Panel centrado
// sobre el CampoArena en su versión más oscura.
export default function LayoutSinChasis({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <CampoArena tinte="arena-turquesa" />
      {children}
    </main>
  );
}
