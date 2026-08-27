import { ArrowUpRight, Mail, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const EMAIL_CONTACTO = "mirage.software.ar@gmail.com";

// Sin número de WhatsApp/teléfono público confirmado todavía — se
// activan solos apenas estas dos dejen de ser null, sin tocar el resto
// de la pantalla. No se inventa un número para no publicar un dato
// falso (§8.4 pide wa.me y tel: con el dato a la vista, y "a la vista"
// implica que sea real).
const WHATSAPP_CONTACTO: string | null = null;
const TELEFONO_CONTACTO: string | null = null;

function BloqueContacto({
  icono: Icono,
  etiqueta,
  dato,
  href,
}: {
  icono: typeof Mail;
  etiqueta: string;
  dato: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm outline-none transition-[transform,box-shadow,border-color] duration-(--dur-rapida) ease-(--ease-suave)",
        "hover:-translate-y-0.5 hover:border-primary hover:shadow-md",
        "focus-visible:-translate-y-0.5 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-turquesa-200",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
      )}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icono className="size-5" />
      </span>
      <span className="flex flex-col">
        <span className="text-sm text-muted-foreground">{etiqueta}</span>
        <span className="font-medium">{dato}</span>
      </span>
      <ArrowUpRight
        aria-hidden
        className="ml-auto size-5 shrink-0 text-muted-foreground transition-transform duration-(--dur-rapida) ease-(--ease-suave) group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground motion-reduce:transition-none"
      />
    </Link>
  );
}

// Los métodos directos (§8.4): bloques grandes y clickeables, el dato
// siempre visible — no escondido detrás del enlace.
export function MetodosDirectos() {
  return (
    <div className="flex flex-col gap-3">
      {WHATSAPP_CONTACTO && (
        <BloqueContacto
          icono={MessageCircle}
          etiqueta="WhatsApp"
          dato={WHATSAPP_CONTACTO}
          href={`https://wa.me/${WHATSAPP_CONTACTO.replace(/\D/g, "")}?text=${encodeURIComponent("Hola, te escribo desde miragesoftware.com.ar")}`}
        />
      )}
      <BloqueContacto
        icono={Mail}
        etiqueta="Email"
        dato={EMAIL_CONTACTO}
        href={`mailto:${EMAIL_CONTACTO}`}
      />
      {TELEFONO_CONTACTO && (
        <BloqueContacto
          icono={Phone}
          etiqueta="Teléfono"
          dato={TELEFONO_CONTACTO}
          href={`tel:${TELEFONO_CONTACTO}`}
        />
      )}
    </div>
  );
}
