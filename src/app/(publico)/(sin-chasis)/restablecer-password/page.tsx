import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormularioRestablecer } from "./formulario-restablecer";

export const metadata: Metadata = { title: "Restablecer contraseña" };

export default async function PaginaRestablecerPassword({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader>
        <CardTitle className="font-heading text-xl">
          Restablecer contraseña
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error || !token ? (
          <p role="alert" className="text-sm text-destructive">
            El link venció o no es válido. Pedí uno nuevo desde &quot;Olvidé mi
            contraseña&quot; en la pantalla de ingreso.
          </p>
        ) : (
          <FormularioRestablecer token={token} />
        )}
      </CardContent>
    </Card>
  );
}
