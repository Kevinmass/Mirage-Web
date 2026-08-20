import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NoEncontrado } from "@/kernel/errores";
import { obtenerPersona, listarPersonas } from "@/kernel/identidad/personas";
import { obtenerArbolCompleto, obtenerNodo } from "@/kernel/organigrama/arbol";
import {
  listarContactosDeCliente,
  listarInteraccionesDeCliente,
  obtenerCliente,
} from "@/modules/clientes/api";
import { actualizarClienteAction, archivarClienteAction } from "../actions";
import {
  FormularioContacto,
  FormularioInteraccion,
} from "../clientes-formularios";
import { FormularioCliente } from "../formulario-cliente";

const ETIQUETA_TIPO: Record<string, string> = {
  llamada: "Llamada",
  mail: "Mail",
  reunion: "Reunión",
  otro: "Otro",
};

export default async function PaginaCliente({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idNumerico = Number(id);
  if (!Number.isInteger(idNumerico)) {
    notFound();
  }

  const cliente = await obtenerCliente(idNumerico).catch((error) => {
    if (error instanceof NoEncontrado) {
      notFound();
    }
    throw error;
  });

  const [
    nodoResponsable,
    contactoDirecto,
    contactos,
    interacciones,
    nodos,
    personas,
  ] = await Promise.all([
    obtenerNodo(cliente.nodoResponsableId),
    obtenerPersona(cliente.contactoDirectoId),
    listarContactosDeCliente(cliente.id),
    listarInteraccionesDeCliente(cliente.id),
    obtenerArbolCompleto(),
    listarPersonas(),
  ]);
  const empleados = personas.filter((p) => p.tipo === "empleado" && p.activo);
  // Con quién puede haber una interacción: el contacto directo más los
  // contactos cargados, sin duplicar si ya coinciden.
  const personasParaInteraccion = [
    {
      id: contactoDirecto.id,
      nombre: contactoDirecto.nombre,
      apellido: contactoDirecto.apellido,
    },
    ...contactos
      .filter((c) => c.personaId !== contactoDirecto.id)
      .map((c) => ({
        id: c.personaId,
        nombre: c.nombre,
        apellido: c.apellido,
      })),
  ];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{cliente.nombre}</h1>
        <span className="text-sm text-muted-foreground">
          {cliente.estado === "activo" ? "Activo" : "Inactivo"}
        </span>
      </div>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <section className="flex flex-col gap-1 text-sm">
          <h2 className="font-medium">Nodo responsable</h2>
          <p className="text-muted-foreground">{nodoResponsable.nombre}</p>
        </section>

        <section className="flex flex-col gap-1 text-sm">
          <h2 className="font-medium">Contacto directo</h2>
          <p className="text-muted-foreground">
            {contactoDirecto.nombre} {contactoDirecto.apellido} —{" "}
            {contactoDirecto.email}
          </p>
        </section>

        <section className="flex flex-col gap-2 text-sm">
          <h2 className="font-medium">Contactos del cliente</h2>
          {contactos.length === 0 ? (
            <p className="text-muted-foreground">Sin contactos cargados.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {contactos.map((c) => (
                <li key={c.id}>
                  {c.nombre} {c.apellido}
                  {c.cargo ? ` — ${c.cargo}` : ""}
                  {c.esPrincipal ? " (principal)" : ""}
                </li>
              ))}
            </ul>
          )}
          <FormularioContacto clienteId={cliente.id} />
        </section>

        <section className="flex flex-col gap-2 text-sm">
          <h2 className="font-medium">Últimas interacciones</h2>
          {interacciones.length === 0 ? (
            <p className="text-muted-foreground">Sin interacciones cargadas.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {interacciones.map((i) => (
                <li key={i.id}>
                  <span className="text-muted-foreground">
                    {i.fecha.toLocaleDateString("es-AR")} —{" "}
                    {ETIQUETA_TIPO[i.tipo]} con {i.nombre} {i.apellido}:{" "}
                  </span>
                  {i.resumen}
                </li>
              ))}
            </ul>
          )}
          <FormularioInteraccion
            clienteId={cliente.id}
            personas={personasParaInteraccion}
          />
        </section>
      </div>

      <div className="mt-10 flex flex-col gap-4 border-t pt-6">
        <h2 className="text-lg font-semibold">Editar</h2>
        <FormularioCliente
          action={actualizarClienteAction.bind(null, cliente.id)}
          nodos={nodos}
          personas={empleados}
          valoresIniciales={cliente}
          textoBoton="Guardar"
        />

        {cliente.estado === "activo" && (
          <form action={archivarClienteAction.bind(null, cliente.id)}>
            <Button type="submit" variant="destructive">
              Archivar
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
