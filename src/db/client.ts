import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// No se valida DATABASE_URL acá arriba a propósito: este módulo se
// importa transitivamente desde páginas públicas prerenderizadas en el
// build, donde todavía no hay base — las migraciones corren recién al
// arrancar el contenedor, no en el build de Docker (PR 0.4). postgres-js
// no conecta hasta el primer query real, así que si falta la URL el
// error sale ahí, donde el caller (una página, un script) lo puede
// atajar con try/catch en vez de tirar abajo el build entero.
export const client = postgres(process.env.DATABASE_URL ?? "");

export const db = drizzle(client);
