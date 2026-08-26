import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EstadoError } from "@/components/ui/estado-error";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CampoArena } from "@/components/campo-arena";
import { AlternarTema } from "./alternar-tema";

const RAMPAS = [
  {
    nombre: "Arena",
    tonos: [
      "arena-50",
      "arena-100",
      "arena-200",
      "arena-300",
      "arena-400",
      "arena-500",
    ],
  },
  {
    nombre: "Tinta",
    tonos: ["tinta-900", "tinta-800", "tinta-700", "tinta-600", "tinta-400"],
  },
  {
    nombre: "Turquesa",
    tonos: [
      "turquesa-700",
      "turquesa-500",
      "turquesa-400",
      "turquesa-200",
      "turquesa-50",
    ],
  },
  {
    nombre: "Ámbar",
    tonos: ["ambar-600", "ambar-500", "ambar-300", "ambar-50"],
  },
  {
    nombre: "Coral",
    tonos: ["coral-700", "coral-500", "coral-300", "coral-50"],
  },
  {
    nombre: "Cielo",
    tonos: ["cielo-500", "cielo-200"],
  },
] as const;

const TOKENS_SEMANTICOS = [
  ["background", "bg-background text-foreground border border-border"],
  ["foreground", "bg-foreground text-background"],
  ["card", "bg-card text-card-foreground border border-border"],
  ["popover", "bg-popover text-popover-foreground border border-border"],
  ["muted", "bg-muted text-muted-foreground"],
  ["primary", "bg-primary text-primary-foreground"],
  ["secondary", "bg-secondary text-secondary-foreground"],
  ["accent", "bg-accent text-accent-foreground"],
  ["destructive", "bg-destructive text-destructive-foreground"],
  ["chart-1", "bg-chart-1 text-background"],
  ["chart-2", "bg-chart-2 text-background"],
  ["chart-3", "bg-chart-3 text-background"],
  ["chart-4", "bg-chart-4 text-background"],
  ["chart-5", "bg-chart-5 text-background"],
] as const;

// Vidriera del sistema visual "Espejismo cálido" — pantalla contra la
// que se revisa visualmente cada PR posterior del rediseño de frontend
// (docs/plan/2026-08-21-plan-frontend.md, PR 1). Bloqueada en producción
// (staging incluido — ver PR 0.4: Docker corre con NODE_ENV=production).
export default function PaginaDevUi() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="relative mx-auto flex max-w-4xl flex-col gap-14 overflow-hidden px-6 py-16">
      <CampoArena tinte="arena" />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-display font-heading">
            Sistema visual — /dev/ui
          </h1>
          <p className="text-muted-foreground">
            Espejismo cálido. Rampas, tokens y primitivas de{" "}
            <code>docs/specs/2026-08-21-sistema-visual-mirage.md</code>.
          </p>
        </div>
        <AlternarTema />
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2 font-heading">Tipografía</h2>
        <p className="text-hero font-heading font-extrabold tracking-[-0.03em]">
          Mirage
        </p>
        <p className="text-display font-heading font-bold tracking-[-0.025em]">
          Título de página
        </p>
        <p className="text-h2 font-heading font-semibold tracking-[-0.02em]">
          Encabezado de sección
        </p>
        <p className="text-h3 font-semibold">Subtítulo</p>
        <p className="text-lead text-foreground">
          Bajada en Inter, la que se lee en dos frases del hero o de una ficha.
        </p>
        <p className="text-body text-foreground">
          Cuerpo normal — el texto largo nunca pasa de 68ch de ancho de línea en
          pantallas de negocio.
        </p>
        <p className="font-mono text-sm tabular-nums text-muted-foreground">
          Geist Mono 0/8 — CUIT 30-71234567-4 — 2026-08-26
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2 font-heading">Paleta cruda</h2>
        {RAMPAS.map((rampa) => (
          <div key={rampa.nombre} className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              {rampa.nombre}
            </p>
            <div className="flex flex-wrap gap-2">
              {rampa.tonos.map((tono) => (
                <div
                  key={tono}
                  className="flex h-16 w-24 flex-col items-center justify-center rounded-md border border-border text-xs"
                  style={{ backgroundColor: `var(--${tono})` }}
                >
                  {tono}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2 font-heading">Tokens semánticos</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TOKENS_SEMANTICOS.map(([nombre, clases]) => (
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
        <h2 className="text-h2 font-heading">Sombras</h2>
        <div className="flex flex-wrap gap-6 py-4">
          <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-card text-xs shadow-sm">
            shadow-sm
          </div>
          <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-card text-xs shadow-md">
            shadow-md
          </div>
          <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-card text-xs shadow-lg">
            shadow-lg
          </div>
          <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-card text-xs shadow-cal">
            shadow-cal
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2 font-heading">Campo de arena</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative h-24 overflow-hidden rounded-lg border border-border">
            <CampoArena tinte="arena" />
          </div>
          <div className="relative h-24 overflow-hidden rounded-lg border border-border">
            <CampoArena tinte="arena-turquesa" />
          </div>
          <div className="relative h-24 overflow-hidden rounded-lg border border-border">
            <CampoArena tinte="arena-ambar" />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2 font-heading">Button</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="xs">xs</Button>
          <Button size="sm">sm</Button>
          <Button size="default">default (44px)</Button>
          <Button size="lg">lg</Button>
          <Button disabled>Deshabilitado</Button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2 font-heading">Badge</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="primary">Activo</Badge>
          <Badge variant="accent">Destacado</Badge>
          <Badge variant="destructive">Vencida</Badge>
          <Badge variant="outline">Inactivo</Badge>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2 font-heading">Campo y etiqueta</h2>
        <div className="flex max-w-sm flex-col gap-1">
          <Label htmlFor="dev-ui-nombre">Nombre</Label>
          <Input id="dev-ui-nombre" placeholder="Ada Lovelace" />
        </div>
        <div className="flex max-w-sm flex-col gap-1">
          <Label htmlFor="dev-ui-error">Con error</Label>
          <Input id="dev-ui-error" aria-invalid defaultValue="dato inválido" />
          <p className="text-sm text-destructive">Este campo es obligatorio.</p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2 font-heading">Table</h2>
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Persona</TableHead>
                <TableHead>Nodo</TableHead>
                <TableHead className="text-right">Ingreso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Ada Lovelace</TableCell>
                <TableCell>Dirección técnica</TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  2024-03-01
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Alan Turing</TableCell>
                <TableCell>Ingeniería</TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  2025-07-14
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2 font-heading">Estados vacío, carga y error</h2>
        <EstadoVacio
          titulo="Todavía no hay clientes cargados."
          descripcion="Los clientes que sumes van a aparecer acá."
          accion={<Button size="sm">Nuevo cliente</Button>}
        />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <EstadoError descripcion="No se pudo cargar la lista. Puede ser un problema de conexión." />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2 font-heading">Card</h2>
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
