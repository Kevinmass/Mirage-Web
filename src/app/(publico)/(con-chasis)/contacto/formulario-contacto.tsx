"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { enviarContactoAction, type EstadoContacto } from "./actions";
import { ClickSpark } from "./click-spark";

// "curved-input" de React Bits, reteñido (§6.1): el único lugar donde
// entra ese tratamiento — un radio bien grande en vez del --radius-md
// que usa <Input> en el resto del sitio.
const CLASE_CAMPO =
  "h-12 w-full rounded-3xl border border-input bg-card px-6 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-turquesa-200 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

export function FormularioContacto({
  asuntoInicial,
}: {
  asuntoInicial?: string;
}) {
  const [estado, accion, enviando] = useActionState<EstadoContacto, FormData>(
    enviarContactoAction,
    {},
  );

  const refNombre = useRef<HTMLInputElement>(null);
  const refEmail = useRef<HTMLInputElement>(null);
  const refTipoConsulta = useRef<HTMLInputElement>(null);
  const refMensaje = useRef<HTMLTextAreaElement>(null);

  // El foco va al primer campo con error (§8.4) — el orden acá importa,
  // es el mismo en que aparecen en el formulario.
  useEffect(() => {
    const errores = estado.erroresCampo;
    if (!errores) return;
    if (errores.nombre) refNombre.current?.focus();
    else if (errores.email) refEmail.current?.focus();
    else if (errores.tipoConsulta) refTipoConsulta.current?.focus();
    else if (errores.mensaje) refMensaje.current?.focus();
  }, [estado.erroresCampo]);

  if (estado.enviado) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-border bg-card p-8 text-center"
      >
        <p className="font-heading text-h3 font-semibold">
          Gracias por escribirnos
        </p>
        <p className="mt-2 text-muted-foreground">
          Te contestamos apenas leamos el mensaje.
        </p>
      </div>
    );
  }

  const valores = estado.valores;

  return (
    <form action={accion} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1">
        <Label htmlFor="contacto-nombre">Nombre</Label>
        <input
          ref={refNombre}
          id="contacto-nombre"
          name="nombre"
          required
          defaultValue={valores?.nombre}
          aria-invalid={!!estado.erroresCampo?.nombre}
          aria-describedby={
            estado.erroresCampo?.nombre ? "contacto-nombre-error" : undefined
          }
          className={CLASE_CAMPO}
        />
        {estado.erroresCampo?.nombre && (
          <p id="contacto-nombre-error" role="alert" className="text-sm text-destructive">
            {estado.erroresCampo.nombre}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="contacto-email">Email</Label>
        <input
          ref={refEmail}
          id="contacto-email"
          name="email"
          type="email"
          required
          defaultValue={valores?.email}
          aria-invalid={!!estado.erroresCampo?.email}
          aria-describedby={
            estado.erroresCampo?.email ? "contacto-email-error" : undefined
          }
          className={CLASE_CAMPO}
        />
        {estado.erroresCampo?.email && (
          <p id="contacto-email-error" role="alert" className="text-sm text-destructive">
            {estado.erroresCampo.email}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="contacto-tipo">¿Qué necesitás?</Label>
        <input
          ref={refTipoConsulta}
          id="contacto-tipo"
          name="tipoConsulta"
          required
          placeholder="Ej: un sistema nuevo, soporte, una pregunta general"
          defaultValue={valores?.tipoConsulta ?? asuntoInicial}
          aria-invalid={!!estado.erroresCampo?.tipoConsulta}
          aria-describedby={
            estado.erroresCampo?.tipoConsulta ? "contacto-tipo-error" : undefined
          }
          className={CLASE_CAMPO}
        />
        {estado.erroresCampo?.tipoConsulta && (
          <p id="contacto-tipo-error" role="alert" className="text-sm text-destructive">
            {estado.erroresCampo.tipoConsulta}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="contacto-mensaje">Mensaje</Label>
        <textarea
          ref={refMensaje}
          id="contacto-mensaje"
          name="mensaje"
          required
          rows={5}
          defaultValue={valores?.mensaje}
          aria-invalid={!!estado.erroresCampo?.mensaje}
          aria-describedby={
            estado.erroresCampo?.mensaje ? "contacto-mensaje-error" : undefined
          }
          className={cn(CLASE_CAMPO, "h-auto rounded-2xl py-3")}
        />
        {estado.erroresCampo?.mensaje && (
          <p id="contacto-mensaje-error" role="alert" className="text-sm text-destructive">
            {estado.erroresCampo.mensaje}
          </p>
        )}
      </div>

      {estado.error && (
        <p role="alert" className="text-sm text-destructive">
          {estado.error}
        </p>
      )}

      <div className="relative mt-2 w-fit">
        <Button type="submit" disabled={enviando} size="lg">
          Enviar mensaje
        </Button>
        <ClickSpark activo={enviando} />
      </div>
    </form>
  );
}
