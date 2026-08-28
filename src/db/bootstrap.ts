// Arranque en frío desde la línea de comandos:
//
//   pnpm db:bootstrap tu@email.com "tu-password" Nombre Apellido
//
// La lógica real (idempotente) vive en kernel/identidad/arranque.ts y la
// comparte con la ruta /setup. Este archivo solo parsea argumentos y
// loguea. Correrlo dos veces no rompe nada.
import "dotenv/config";
import { crearPrimerEmpleado } from "@/kernel/identidad/arranque";

function leerArgumentos() {
  const [email, password, nombre, apellido] = process.argv.slice(2);

  if (!email || !password) {
    console.error(
      "Uso: pnpm db:bootstrap <email> <password> [nombre] [apellido]\n" +
        'Ej:  pnpm db:bootstrap kevin@miragesoftware.store "una-password-larga" Kevin Massaccesi',
    );
    process.exit(1);
  }

  return {
    email: email.trim().toLowerCase(),
    password,
    nombre: nombre ?? "Primer",
    apellido: apellido ?? "Empleado",
  };
}

async function main() {
  const datos = leerArgumentos();
  await crearPrimerEmpleado(datos, (mensaje) => console.log(mensaje));
  console.log(
    `\nListo. Entrá en http://localhost:3000/ingresar con ${datos.email} y te lleva a /app.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
