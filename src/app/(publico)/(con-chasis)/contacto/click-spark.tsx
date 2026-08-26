const ANGULOS = [0, 45, 90, 135, 180, 225, 270, 315];

// "click-spark" de React Bits (§6.1): reservado para el CTA del hero y
// el botón de enviar de este formulario, en ningún otro lado.
export function ClickSpark({ activo }: { activo: boolean }) {
  if (!activo) return null;

  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      {ANGULOS.map((angulo) => (
        <span
          key={angulo}
          style={{ "--spark-angulo": `${angulo}deg` } as React.CSSProperties}
          className="absolute top-1/2 left-1/2 h-3 w-0.5 origin-bottom -translate-x-1/2 -translate-y-1/2 animate-[click-spark_500ms_var(--ease-salida)_forwards] rounded-full bg-primary motion-reduce:hidden"
        />
      ))}
    </span>
  );
}
