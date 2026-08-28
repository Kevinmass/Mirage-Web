import { MessageSquareText } from "lucide-react";
import { EstadoVacio } from "@/components/ui/estado-vacio";

// El panel derecho de la bandeja (diseño §8.12) cuando todavía no se
// eligió ninguna solicitud. En móvil nunca se ve — bandeja-solicitudes.tsx
// oculta esta columna entera hasta que hay un id en la ruta.
export default function PaginaSolicitudesIndice() {
  return (
    <EstadoVacio
      icono={MessageSquareText}
      titulo="Elegí una solicitud de la lista para ver el hilo."
      className="h-full min-h-96 items-center justify-center"
    />
  );
}
