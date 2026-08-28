import type { Metadata } from "next";
import { FondoContinuo } from "@/components/fondo-continuo";
import { FondoSeccionAurora } from "@/components/fondo-seccion-aurora";
import { FormularioContacto } from "./formulario-contacto";
import { MetodosDirectos } from "./metodos-directos";

export const metadata: Metadata = { title: "Contacto" };

// Dos columnas en desktop, apiladas en móvil (§8.4). ?asunto= precarga
// el tipo de consulta — es lo que usan las páginas de servicio (PR 4) y
// el recomendador (PR 5) para pasar contexto.
export default async function PaginaContacto({
  searchParams,
}: {
  searchParams: Promise<{ asunto?: string }>;
}) {
  const { asunto } = await searchParams;

  return (
    <div className="relative isolate overflow-hidden">
      <FondoContinuo />
      <FondoSeccionAurora
        tono="turquesa"
        className="absolute inset-x-0 top-0 h-[65%]"
      />
      <main className="relative z-10 mx-auto max-w-4xl px-6 py-16 sm:py-24">
        <h1 className="text-display font-heading font-bold tracking-[-0.025em]">
          Contacto
        </h1>
        <p className="mt-3 max-w-[60ch] text-lead text-muted-foreground">
          Contanos qué necesitás y te contestamos por el mismo medio.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2">
          <MetodosDirectos />
          <FormularioContacto asuntoInicial={asunto} />
        </div>
      </main>
    </div>
  );
}
