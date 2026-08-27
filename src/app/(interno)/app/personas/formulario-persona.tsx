"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EstadoFormulario } from "./actions";

interface Props {
  action: (
    previo: EstadoFormulario,
    formData: FormData,
  ) => Promise<EstadoFormulario>;
  valoresIniciales?: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string | null;
    tipo: string;
  };
  textoBoton: string;
}

export function FormularioPersona({
  action,
  valoresIniciales,
  textoBoton,
}: Props) {
  const [estado, formAction, enviando] = useActionState<
    EstadoFormulario,
    FormData
  >(action, {});

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="persona-nombre">Nombre</Label>
        <Input
          id="persona-nombre"
          name="nombre"
          required
          defaultValue={valoresIniciales?.nombre}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="persona-apellido">Apellido</Label>
        <Input
          id="persona-apellido"
          name="apellido"
          required
          defaultValue={valoresIniciales?.apellido}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="persona-email">Email</Label>
        <Input
          id="persona-email"
          name="email"
          type="email"
          required
          defaultValue={valoresIniciales?.email}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="persona-telefono">
          Teléfono (E.164, ej: +5491122334455)
        </Label>
        <Input
          id="persona-telefono"
          name="telefono"
          defaultValue={valoresIniciales?.telefono ?? ""}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label>Tipo</Label>
        <Select name="tipo" defaultValue={valoresIniciales?.tipo ?? "empleado"}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="empleado">Empleado</SelectItem>
            <SelectItem value="contacto_cliente">
              Contacto de cliente
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {estado.error && (
        <p role="alert" className="text-sm text-destructive">
          {estado.error}
        </p>
      )}

      <Button type="submit" disabled={enviando}>
        {textoBoton}
      </Button>
    </form>
  );
}
