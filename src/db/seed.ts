// Seed del contenido real de Mirage para el módulo `contenido` (PR 1.1).
// Corre a mano, fuera del request (`pnpm db:seed`). Importa el schema del
// módulo directo, no su api.ts — api.ts es de solo lectura en v1, y
// sembrar es una operación de infraestructura, igual que migrar.
import "dotenv/config";
import { db } from "./client";
import {
  contenidoCaso,
  contenidoPagina,
  contenidoServicio,
} from "../modules/contenido/schema";

async function main() {
  await db
    .insert(contenidoPagina)
    .values([
      {
        slug: "inicio",
        titulo: "Mirage",
        cuerpo: [
          "# Mirage",
          "",
          "Desarrollamos software a medida: sistemas específicos para las",
          "necesidades de cada cliente, no productos estándar.",
          "",
          "Construimos y operamos sistemas completos, de punta a punta —",
          "desde la base de datos hasta la interfaz que el equipo usa todos",
          "los días.",
        ].join("\n"),
        publicada: true,
      },
      {
        slug: "contacto",
        titulo: "Contacto",
        cuerpo: [
          "# Contacto",
          "",
          "Escribinos a [mirage.software.ar@gmail.com](mailto:mirage.software.ar@gmail.com).",
        ].join("\n"),
        publicada: true,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(contenidoServicio)
    .values([
      {
        nombre: "Desarrollo de software a medida",
        slug: "desarrollo-de-software-a-medida",
        descripcion:
          "Sistemas a medida de punta a punta: relevamiento, diseño, desarrollo y operación.",
        orden: 0,
        activo: true,
      },
    ])
    .onConflictDoNothing();

  await db.insert(contenidoCaso).values([
    {
      titulo: "Sistema de gestión para un centro médico",
      // Sin nombrar al cliente (diseño §6.1): nombrarlo requiere
      // autorización explícita que se pide fuera del sistema.
      clienteId: null,
      resumen:
        "Turnos, historias clínicas, y un recordatorio automático por WhatsApp del turnero del día siguiente a cada médico.",
      publicado: true,
    },
  ]);

  console.log("Seed de contenido cargado.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
