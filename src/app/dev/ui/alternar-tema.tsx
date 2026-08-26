"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

// Toggle de tema solo para esta vitrina de desarrollo — el toggle real,
// accesible y persistido en localStorage, es del PR 2 (chasis público).
// Acá alcanza con poder revisar ambos temas sin salir de la pantalla.
export function AlternarTema() {
  const [oscuro, setOscuro] = useState(false);

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={() => {
        document.documentElement.classList.toggle("dark");
        setOscuro((valor) => !valor);
      }}
    >
      {oscuro ? "Ver tema claro" : "Ver tema oscuro"}
    </Button>
  );
}
