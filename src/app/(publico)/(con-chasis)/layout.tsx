import { FooterMirage } from "@/components/footer-mirage";
import { HeaderPublico } from "@/components/header-publico";

// El chasis de las cuatro páginas públicas (§6.2, §6.3 del sistema
// visual): header de tres modos + footer, iguales en todas. Vive en su
// propio grupo de rutas para que /ingresar y /restablecer-password (el
// grupo hermano "sin-chasis") puedan quedar sin ninguno de los dos, sin
// mover la estructura de carpetas fija de (publico)/ desde el PR 0.1.
export default function LayoutConChasis({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <HeaderPublico />
      {children}
      <FooterMirage />
    </>
  );
}
