// /portal tiene sesión y datos por cliente — mismo motivo que
// (interno)/app/layout.tsx: nunca contenido cacheable entre visitantes.
export const dynamic = "force-dynamic";

export default function LayoutPortal({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
