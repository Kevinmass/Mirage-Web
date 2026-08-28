"use client";

import { useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const CLAVE = "mirage-ingreso-tab";

type Pestana = "equipo" | "clientes";

const PESTANAS: { valor: Pestana; etiqueta: string }[] = [
  { valor: "equipo", etiqueta: "Equipo Mirage" },
  { valor: "clientes", etiqueta: "Clientes" },
];

function leerPestanaGuardada(): Pestana {
  return window.localStorage.getItem(CLAVE) === "clientes"
    ? "clientes"
    : "equipo";
}

function noSuscribirse() {
  return () => {};
}

// Selector de dos pestañas (§8.5): no cambia qué campos pide el
// formulario — a dónde entra cada quien ya lo decide el servidor según
// el tipo de persona (kernel/identidad/reglas-acceso.ts). Es una
// orientación para quien está por escribir su contraseña, con la
// preferencia recordada entre visitas. useSyncExternalStore lee
// localStorage una sola vez sin desincronizar la hidratación (el server
// siempre arranca en "equipo"); el click después es estado local común.
export function SelectorIngreso() {
  const guardada = useSyncExternalStore(
    noSuscribirse,
    leerPestanaGuardada,
    () => "equipo" as Pestana,
  );
  const [elegida, setElegida] = useState<Pestana | null>(null);
  const activa = elegida ?? guardada;

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Quién ingresa"
        className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
      >
        {PESTANAS.map((pestana) => (
          <button
            key={pestana.valor}
            type="button"
            role="tab"
            aria-selected={activa === pestana.valor}
            onClick={() => {
              setElegida(pestana.valor);
              window.localStorage.setItem(CLAVE, pestana.valor);
            }}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors duration-(--dur-rapida)",
              activa === pestana.valor
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {pestana.etiqueta}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {activa === "equipo"
          ? "Con tu cuenta del equipo entrás al sistema interno."
          : "Con tu cuenta de cliente entrás al portal de tus proyectos."}
      </p>
    </div>
  );
}
