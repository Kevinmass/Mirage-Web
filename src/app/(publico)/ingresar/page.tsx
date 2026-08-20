import type { Metadata } from "next";
import { FormularioIngreso } from "./formulario-ingreso";
import { FormularioOlvide } from "./formulario-olvide";

export const metadata: Metadata = { title: "Ingresar" };

export default function PaginaIngresar() {
  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Ingresar</h1>
      <div className="mt-8 flex flex-col gap-4">
        <FormularioIngreso />
        <FormularioOlvide />
      </div>
    </main>
  );
}
