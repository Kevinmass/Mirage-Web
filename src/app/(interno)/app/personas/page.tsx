import Link from "next/link";
import { Button } from "@/components/ui/button";
import { listarPersonas } from "@/kernel/identidad/personas";

export default async function PaginaPersonas() {
  const filas = await listarPersonas();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Personas</h1>
        <Button
          render={<Link href="/app/personas/nueva">Nueva persona</Link>}
        />
      </div>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2">Nombre</th>
            <th className="py-2">Email</th>
            <th className="py-2">Tipo</th>
            <th className="py-2">Acceso</th>
            <th className="py-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-2">
                <Link
                  href={`/app/personas/${p.id}`}
                  className="hover:underline"
                >
                  {p.nombre} {p.apellido}
                </Link>
              </td>
              <td className="py-2">{p.email}</td>
              <td className="py-2">{p.tipo}</td>
              <td className="py-2">{p.usuarioId ? "Sí" : "No"}</td>
              <td className="py-2">{p.activo ? "Activa" : "Archivada"}</td>
            </tr>
          ))}
          {filas.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="py-6 text-center text-muted-foreground"
              >
                Todavía no hay personas cargadas.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
