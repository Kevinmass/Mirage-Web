"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PREGUNTAS, calcularResultado } from "@/lib/recomendador/arbol";

// El recomendador (§8.3): una pregunta por pantalla, barra de progreso,
// estado en la URL (?p=3&r=a,c,b) para que sea compartible y para que
// "atrás" del navegador vuelva una pregunta en vez de salir de la
// página — cada respuesta hace un router.push() propio, así que cada
// una es una entrada de historial. Es un cuestionario de puntaje fijo
// (siempre las mismas 5 preguntas en el mismo orden), no un árbol
// ramificado: así la barra de progreso puede mostrar "3 de 5" sin tener
// que simular el resto del recorrido.
export function Recomendador() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const paso = Math.min(
    Math.max(Number(searchParams.get("p") ?? 0) || 0, 0),
    PREGUNTAS.length,
  );
  const respuestas = (searchParams.get("r") ?? "").split(",").filter(Boolean);
  const terminado = paso >= PREGUNTAS.length;
  const preguntaActual = !terminado ? PREGUNTAS[paso] : undefined;

  function elegir(valor: string) {
    const nuevasRespuestas = [...respuestas.slice(0, paso), valor];
    const params = new URLSearchParams();
    params.set("p", String(paso + 1));
    params.set("r", nuevasRespuestas.join(","));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function reiniciar() {
    router.push(pathname, { scroll: false });
  }

  const resultado = terminado ? calcularResultado(respuestas) : undefined;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div
        aria-hidden
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-(--dur-media) ease-(--ease-suave)"
          style={{
            width: `${(Math.min(paso, PREGUNTAS.length) / PREGUNTAS.length) * 100}%`,
          }}
        />
      </div>

      <div aria-live="polite" className="sr-only">
        {terminado
          ? `Resultado: ${resultado!.titulo}`
          : `Pregunta ${paso + 1} de ${PREGUNTAS.length}: ${preguntaActual!.texto}`}
      </div>

      {terminado ? (
        <div
          key="resultado"
          className="flex animate-[recomendador-entrar_var(--dur-entrada)_var(--ease-salida)_backwards] flex-col gap-4 rounded-2xl border border-border bg-card p-8 motion-reduce:animate-none"
        >
          <p className="text-sm font-medium text-primary">Te recomendamos</p>
          <h3 className="font-heading text-h2 font-semibold">
            {resultado!.titulo}
          </h3>
          <p className="text-muted-foreground">{resultado!.descripcion}</p>
          <div className="flex flex-wrap gap-3">
            <Button
              render={
                <Link
                  href={`/contacto?asunto=${encodeURIComponent(resultado!.asuntoContacto)}`}
                >
                  Hablemos
                </Link>
              }
            />
            <Button type="button" variant="secondary" onClick={reiniciar}>
              Volver a empezar
            </Button>
          </div>
        </div>
      ) : (
        <div
          key={paso}
          className="flex animate-[recomendador-entrar_var(--dur-entrada)_var(--ease-salida)_backwards] flex-col gap-4 motion-reduce:animate-none"
        >
          <p className="font-mono text-sm text-muted-foreground">
            Pregunta {paso + 1} de {PREGUNTAS.length}
          </p>
          <h3 className="font-heading text-h2 font-semibold">
            {preguntaActual!.texto}
          </h3>
          <div className="flex flex-col gap-2">
            {preguntaActual!.opciones.map((opcion) => (
              <button
                key={opcion.valor}
                type="button"
                onClick={() => elegir(opcion.valor)}
                className="rounded-lg border border-border bg-card px-4 py-3 text-left text-sm transition-colors hover:border-primary hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {opcion.etiqueta}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
