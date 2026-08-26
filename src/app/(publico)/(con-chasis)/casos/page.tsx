import type { Metadata } from "next";
import { Suspense } from "react";
import { listarCasosPublicados } from "@/modules/contenido/api";
import { Recomendador } from "./recomendador";
import { Testimonios } from "./testimonios";

export const revalidate = 3600;
export const metadata: Metadata = { title: "Casos" };

// Dos mitades (§8.3): arriba los testimonios, abajo el recomendador —
// son independientes, un caso sin testimonio no le saca nada al
// recomendador, y viceversa.
export default async function PaginaCasos() {
  const casos = await listarCasosPublicados().catch(() => []);

  return (
    <main className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
      <h1 className="text-display font-heading font-bold tracking-[-0.025em]">
        Casos
      </h1>

      <div className="mt-10 sm:mt-16">
        <Testimonios casos={casos} />
      </div>

      <div className="mt-16 sm:mt-24">
        <h2 className="mb-8 text-center font-heading text-h2 font-semibold tracking-[-0.02em]">
          ¿No sabés bien qué necesitás?
        </h2>
        <Suspense fallback={null}>
          <Recomendador />
        </Suspense>
      </div>
    </main>
  );
}
