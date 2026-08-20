import Link from "next/link";
import { Button } from "@/components/ui/button";
import { listarClientes } from "@/modules/clientes/api";

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

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2">Nombre</th>
            <th className="py-2">CUIT</th>
            <th className="py-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="py-2">
                <Link
                  href={`/app/clientes/${c.id}`}
                  className="hover:underline"
                >
                  {c.nombre}
                </Link>
              </td>
              <td className="py-2">{c.cuit}</td>
              <td className="py-2">
                {c.estado === "activo" ? "Activo" : "Inactivo"}
              </td>
            </tr>
          ))}
          {filas.length === 0 && (
            <tr>
              <td
                colSpan={3}
                className="py-6 text-center text-muted-foreground"
              >
                Todavía no hay clientes cargados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
