import { cn } from "@/lib/utils";

// Mismo lenguaje que <Input> (§6.5 del sistema visual): fondo --card,
// borde --input, radio --radius-md, foco con anillo turquesa. Alto
// mínimo de tres líneas y crece con el contenido (field-sizing).
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-turquesa-200",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
