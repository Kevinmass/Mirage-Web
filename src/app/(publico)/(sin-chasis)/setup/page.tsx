import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { existeAlgunaPersona } from "@/kernel/identidad/arranque";
import { FormularioSetup } from "./formulario-setup";

export const metadata: Metadata = {
  title: "Primer acceso",
  robots: { index: false },
};

// Arranque en frío desde el navegador (PR 4 de la ronda de fixes): crea el
// primer empleado sin tocar SQL. Existe SOLO mientras se cumplan las dos
// condiciones a la vez:
//   - la tabla `persona` está vacía, y
//   - el request trae ?token= con el valor de SETUP_TOKEN.
// En cualquier otro caso: notFound() (404, no 403 — mismo criterio que el
// resto del sistema: un 403 confirmaría que la ruta existe). Apenas se crea
// la primera persona, la ruta deja de responder sola.
export default async function PaginaSetup({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const tokenEsperado = process.env.SETUP_TOKEN;

  if (!token || !tokenEsperado || token !== tokenEsperado) {
    notFound();
  }
  if (await existeAlgunaPersona()) {
    notFound();
  }

  return (
    <Card className="relative w-full max-w-md shadow-lg">
      <CardHeader>
        <Link href="/" className="font-heading text-xl font-bold">
          Mirage
        </Link>
        <p className="text-sm text-muted-foreground">
          Primer acceso: creá el empleado inicial. Esta pantalla desaparece
          apenas exista.
        </p>
      </CardHeader>
      <CardContent>
        <FormularioSetup token={token} />
      </CardContent>
    </Card>
  );
}
