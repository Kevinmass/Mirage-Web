import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FormularioIngreso } from "./formulario-ingreso";
import { FormularioOlvide } from "./formulario-olvide";
import { SelectorIngreso } from "./selector-ingreso";

export const metadata: Metadata = { title: "Ingresar" };

export default function PaginaIngresar() {
  return (
    <Card className="relative w-full max-w-md shadow-lg">
      <CardHeader>
        <Link href="/" className="font-heading text-xl font-bold">
          Mirage
        </Link>
        <p className="text-sm text-muted-foreground">
          Ingresá con tu cuenta.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <SelectorIngreso />
        <FormularioIngreso />
        <FormularioOlvide />
      </CardContent>
    </Card>
  );
}
