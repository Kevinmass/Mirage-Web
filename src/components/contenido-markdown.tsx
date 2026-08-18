import Markdown from "react-markdown";

// Tipografía compartida para el cuerpo (markdown) de contenido_pagina.
// No usa el plugin de Tailwind Typography — con dos páginas no vale la
// pena la dependencia extra; esto es todo lo que se necesita.
export function ContenidoMarkdown({ children }: { children: string }) {
  return (
    <Markdown
      components={{
        h1: (props) => (
          <h1 className="text-3xl font-bold tracking-tight" {...props} />
        ),
        h2: (props) => <h2 className="mt-8 text-xl font-semibold" {...props} />,
        p: (props) => (
          <p
            className="mt-4 leading-relaxed text-muted-foreground"
            {...props}
          />
        ),
        a: (props) => (
          <a
            className="underline underline-offset-4 hover:text-foreground"
            {...props}
          />
        ),
      }}
    >
      {children}
    </Markdown>
  );
}
