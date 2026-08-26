import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { listarClientes } from "@/modules/clientes/api";
import { ClientesListado } from "./clientes-listado";

export default async function PaginaClientes() {
  const filas = await listarClientes();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <Button
          render={<Link href="/app/clientes/nuevo">Nuevo cliente</Link>}
        />
      </div>

      <div className="mt-6">
        {filas.length === 0 ? (
          <EstadoVacio
            titulo="Todavía no hay clientes cargados."
            accion={
              <Button
                size="sm"
                render={<Link href="/app/clientes/nuevo">Nuevo cliente</Link>}
              />
            }
          />
        ) : (
          <ClientesListado filas={filas} />
        )}
      </div>
    </main>
  );
}
