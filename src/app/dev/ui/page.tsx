import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Vidriera de los primitivos de shadcn/ui que usa el sitio, para
// desarrollo. Bloqueada en producción (staging incluido — ver PR 0.4:
// Docker corre con NODE_ENV=production).
export default function PaginaDevUi() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-10 px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">
        Primitivos — /dev/ui
      </h1>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Tipografía</h2>
        <p className="text-foreground">
          Texto normal (foreground sobre background).
        </p>
        <p className="text-muted-foreground">
          Texto secundario (muted-foreground).
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Paleta</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              ["background", "bg-background text-foreground border"],
              ["foreground", "bg-foreground text-background"],
              ["primary", "bg-primary text-primary-foreground"],
              ["secondary", "bg-secondary text-secondary-foreground"],
              ["muted", "bg-muted text-muted-foreground"],
              ["accent", "bg-accent text-accent-foreground"],
              ["destructive", "bg-destructive text-white"],
              ["card", "bg-card text-card-foreground border"],
            ] as const
          ).map(([nombre, clases]) => (
            <div
              key={nombre}
              className={`flex h-16 items-center justify-center rounded-md text-xs ${clases}`}
            >
              {nombre}
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Button</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Card</h2>
        <Card>
          <CardHeader>
            <CardTitle>Título de ejemplo</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Descripción de ejemplo.</CardDescription>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
