"use client";

import { Button } from "@/components/ui/button";
import { reintentarNotificacionAction } from "./actions";

export function BotonReintentar({ id }: { id: number }) {
  return (
    <form action={reintentarNotificacionAction.bind(null, id)}>
      <Button type="submit" size="sm" variant="secondary">
        Reintentar ahora
      </Button>
    </form>
  );
}
