"use client";

import Link from "next/link";
import { useRef } from "react";

import { cn } from "@/lib/utils";
import { useMovimientoReducido } from "@/lib/usar-movimiento-reducido";

// Del inventario cerrado de React Bits (§6.8): "Ficha de persona". No hay
// ningún campo de foto en `persona` todavía (ninguna pantalla sube
// imágenes hoy, y better-auth solo llenaría `usuario.image` vía OAuth,
// que este proyecto no usa) — el avatar es de iniciales siempre, no un
// caso de "foto ausente" que valga la pena distinguir.
function AvatarIniciales({
  nombre,
  apellido,
}: {
  nombre: string;
  apellido: string;
}) {
  const iniciales = `${nombre[0] ?? ""}${apellido[0] ?? ""}`.toUpperCase();
  return (
    <div
      aria-hidden
      className="flex size-14 shrink-0 items-center justify-center rounded-full bg-secondary font-heading text-lg font-semibold text-secondary-foreground"
    >
      {iniciales}
    </div>
  );
}

export function ProfileCard({
  href,
  nombre,
  apellido,
  className,
  children,
}: {
  href: string;
  nombre: string;
  apellido: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reducido = useMovimientoReducido();

  function alMover(e: React.PointerEvent<HTMLAnchorElement>) {
    if (reducido || e.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.setProperty("--tilt-x", `${py * -5}deg`);
    ref.current.style.setProperty("--tilt-y", `${px * 5}deg`);
  }

  function alSalir() {
    ref.current?.style.setProperty("--tilt-x", "0deg");
    ref.current?.style.setProperty("--tilt-y", "0deg");
  }

  return (
    <Link
      ref={ref}
      href={href}
      onPointerMove={alMover}
      onPointerLeave={alSalir}
      style={{
        transform:
          "perspective(700px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))",
      }}
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-transform duration-(--dur-rapida) ease-(--ease-suave) will-change-transform hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <AvatarIniciales nombre={nombre} apellido={apellido} />
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">
            {nombre} {apellido}
          </p>
        </div>
      </div>
      {children}
    </Link>
  );
}
