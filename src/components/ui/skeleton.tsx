import { cn } from "@/lib/utils";

// Skeletons con la forma del contenido real, pulso de 1.6s — nunca un
// spinner centrado en la página (§6.7).
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-md bg-muted [animation-duration:1.6s]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
