"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EstadoFormulario } from "./actions";

interface OpcionProyecto {
  id: number;
  nombre: string;
}

interface Props {
  action: (
    previo: EstadoFormulario,
    formData: FormData,
  ) => Promise<EstadoFormulario>;
  proyectos: OpcionProyecto[];
  valoresIniciales?: {
    nombre: string;
    descripcion: string;
    cuerpo: string | null;
    imagenUrl: string | null;
    color: string | null;
    proyectoOrigenId: number | null;
    orden: number;
    activo: boolean;
  };
  textoBoton: string;
}

// Formulario estandarizado del ABM (§8.2 del plan de frontend): nombre,
// resumen, cuerpo, imagen o color, orden, activo, proyecto de origen.
// Sin campo de slug — se deriva de "nombre" en el Server Action.
export function FormularioServicio({
  action,
  proyectos,
  valoresIniciales,
  textoBoton,
}: Props) {
  const [estado, formAction, enviando] = useActionState<
    EstadoFormulario,
    FormData
  >(action, {});

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="servicio-nombre">Nombre</Label>
        <Input
          id="servicio-nombre"
          name="nombre"
          required
          defaultValue={valoresIniciales?.nombre}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="servicio-descripcion">Resumen</Label>
        <textarea
          id="servicio-descripcion"
          name="descripcion"
          required
          rows={2}
          defaultValue={valoresIniciales?.descripcion}
          className="rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-turquesa-200"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="servicio-cuerpo">
          Cuerpo (Markdown, para la página de detalle)
        </Label>
        <textarea
          id="servicio-cuerpo"
          name="cuerpo"
          rows={8}
          defaultValue={valoresIniciales?.cuerpo ?? ""}
          className="rounded-md border border-input bg-card px-3 py-2 font-mono text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-turquesa-200"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="servicio-imagen">Imagen (URL)</Label>
          <Input
            id="servicio-imagen"
            name="imagenUrl"
            type="url"
            defaultValue={valoresIniciales?.imagenUrl ?? ""}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="servicio-color">Color (si no hay imagen)</Label>
          <Input
            id="servicio-color"
            name="color"
            type="text"
            placeholder="oklch(0.649 0.114 182)"
            defaultValue={valoresIniciales?.color ?? ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="servicio-orden">Orden</Label>
          <Input
            id="servicio-orden"
            name="orden"
            type="number"
            defaultValue={valoresIniciales?.orden ?? 0}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="servicio-proyecto">Proyecto de origen</Label>
          <select
            id="servicio-proyecto"
            name="proyectoOrigenId"
            defaultValue={valoresIniciales?.proyectoOrigenId ?? ""}
            className="h-11 rounded-md border border-input bg-card px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-turquesa-200"
          >
            <option value="">Ninguno</option>
            {proyectos.map((proyecto) => (
              <option key={proyecto.id} value={proyecto.id}>
                {proyecto.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Label className="flex-row items-center gap-2">
        <input
          type="checkbox"
          name="activo"
          defaultChecked={valoresIniciales?.activo ?? true}
          className="size-4"
        />
        Publicado (visible en /servicios)
      </Label>

      {estado.error && (
        <p role="alert" className="text-sm text-destructive">
          {estado.error}
        </p>
      )}

      <Button type="submit" disabled={enviando} className="mt-2">
        {textoBoton}
      </Button>
    </form>
  );
}
