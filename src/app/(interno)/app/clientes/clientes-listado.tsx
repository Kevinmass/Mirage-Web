"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface FilaCliente {
  id: number;
  nombre: string;
  cuit: string;
  estado: "activo" | "inactivo";
}

type Columna = "nombre" | "cuit" | "estado";

const FILTROS_ESTADO = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "activo", etiqueta: "Activos" },
  { valor: "inactivo", etiqueta: "Inactivos" },
] as const;

type ValorFiltroEstado = (typeof FILTROS_ESTADO)[number]["valor"];

function IconoOrden({
  activa,
  ascendente,
}: {
  activa: boolean;
  ascendente: boolean;
}) {
  if (!activa)
    return <ArrowUpDown className="size-3.5 text-muted-foreground" />;
  return ascendente ? (
    <ArrowUp className="size-3.5" />
  ) : (
    <ArrowDown className="size-3.5" />
  );
}

export function ClientesListado({ filas }: { filas: FilaCliente[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState<ValorFiltroEstado>("todos");
  const [columna, setColumna] = useState<Columna>("nombre");
  const [ascendente, setAscendente] = useState(true);

  function ordenarPor(c: Columna) {
    if (c === columna) {
      setAscendente((a) => !a);
    } else {
      setColumna(c);
      setAscendente(true);
    }
  }

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const resultado = filas.filter((f) => {
      if (estado !== "todos" && f.estado !== estado) return false;
      if (!q) return true;
      return (
        f.nombre.toLowerCase().includes(q) || f.cuit.toLowerCase().includes(q)
      );
    });
    resultado.sort((a, b) => {
      const cmp = a[columna].localeCompare(b[columna]);
      return ascendente ? cmp : -cmp;
    });
    return resultado;
  }, [filas, busqueda, estado, columna, ascendente]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Buscar por nombre o CUIT…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="sm:max-w-xs"
          aria-label="Buscar cliente"
        />
        <div
          className="flex gap-1"
          role="group"
          aria-label="Filtrar por estado"
        >
          {FILTROS_ESTADO.map((f) => (
            <button
              key={f.valor}
              type="button"
              onClick={() => setEstado(f.valor)}
              aria-pressed={estado === f.valor}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                estado === f.valor
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)]",
              )}
            >
              {f.etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        {filtradas.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Ningún cliente coincide con ese filtro.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => ordenarPor("nombre")}
                    className="flex items-center gap-1"
                  >
                    Nombre
                    <IconoOrden
                      activa={columna === "nombre"}
                      ascendente={ascendente}
                    />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => ordenarPor("cuit")}
                    className="flex items-center gap-1"
                  >
                    CUIT
                    <IconoOrden
                      activa={columna === "cuit"}
                      ascendente={ascendente}
                    />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => ordenarPor("estado")}
                    className="flex items-center gap-1"
                  >
                    Estado
                    <IconoOrden
                      activa={columna === "estado"}
                      ascendente={ascendente}
                    />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link
                      href={`/app/clientes/${c.id}`}
                      className="hover:underline"
                    >
                      {c.nombre}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">
                    {c.cuit}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={c.estado === "activo" ? "primary" : "outline"}
                    >
                      {c.estado === "activo" ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
