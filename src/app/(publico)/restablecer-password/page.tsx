import type { Metadata } from "next";
import { FormularioRestablecer } from "./formulario-restablecer";

export const metadata: Metadata = { title: "Restablecer contraseña" };

export default async function PaginaRestablecerPassword({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">
        Restablecer contraseña
      </h1>
      {error || !token ? (
        <p className="mt-8 text-sm text-destructive">
          El link venció o no es válido. Pedí uno nuevo desde &quot;Olvidé mi
          contraseña&quot; en la pantalla de ingreso.
        </p>
      ) : (
        <div className="mt-8">
          <FormularioRestablecer token={token} />
        </div>
      )}
    </main>
  );
}
