// Corre las migraciones pendientes contra DATABASE_URL. Se ejecuta al
// arrancar el contenedor (ver Dockerfile), antes de levantar el server.
//
// A propósito NO usa drizzle-kit (es devDependency, no viaja a la imagen
// de producción): usa el migrator de drizzle-orm directo, que sí es
// dependencia de runtime.
import { existsSync } from "node:fs";
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Falta DATABASE_URL");
}

const migrationsFolder = "./src/db/migrations";

// drizzle-kit generate recién crea meta/_journal.json cuando hay al menos
// una tabla. Hasta que exista la primera migración real (kernel/identidad,
// PR 3.1), no hay nada que aplicar.
if (!existsSync(`${migrationsFolder}/meta/_journal.json`)) {
  console.log("Sin migraciones todavía, nada que aplicar.");
  process.exit(0);
}

const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql);

await migrate(db, { migrationsFolder });
await sql.end();

console.log("Migraciones aplicadas.");
