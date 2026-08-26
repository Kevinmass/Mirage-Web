import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

// Fondo --card, borde --input (arena-500, el que sí se ve contra el
// fondo), radio --radius-md, altura 44px (§6.5 del sistema visual).
function Input({ className, ...props }: InputPrimitive.Props) {
  return (
    <InputPrimitive
      data-slot="input"
      className={cn(
        "flex h-11 w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm text-card-foreground shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[color:var(--turquesa-200)]",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
