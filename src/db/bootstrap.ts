// Arranque en frío: crea el primer empleado con acceso a /app.
//
// Sin esto la base recién migrada es un callejón sin salida: no hay
// registro público (a propósito — el alta de personas vive en /app), y
// el ABM que crea empleados está detrás de /app. Alguien tiene que
// existir antes. Este script es ese alguien, y corre una sola vez:
//
//   pnpm db:bootstrap tu@email.com "tu-password" Nombre Apellido
//
// Es idempotente: si la persona o el rol ya existen, los reusa en vez
// de duplicarlos. Correrlo dos veces no rompe nada.
import "dotenv/config";
import { eq, isNull } from "drizzle-orm";
import { db } from "./client";
import { auth } from "@/kernel/identidad/auth";
import { persona } from "@/kernel/identidad/schema";
import { asignarPersona } from "@/kernel/organigrama/arbol";
import { nodo } from "@/kernel/organigrama/schema";
import { capacidadesDeclaradas } from "@/kernel/permisos/capacidades-declaradas";
import { registrarCapacidades } from "@/kernel/permisos/registro";
import { personaRol, rol, rolCapacidad } from "@/kernel/permisos/schema";

const ROL_INICIAL = "Dirección";

// Las dos raíces del organigrama. El diseño (§4.2) las describe como "un
// dato fijo, dos filas con padre_id null" y crearNodo las excluye a
// propósito (siempre exige padreId) — pero nada las insertaba, así que
// una base recién migrada no tenía árbol y no había forma de empezarlo
// desde la UI. Los nombres salen de mirage-empresa/02-estructura: son
// responsabilidades, no personas (regla 1). Se pueden renombrar después
// desde /app/organigrama.
const RAICES = [
  { raiz: "interno" as const, nombre: "Actividades internas" },
  { raiz: "externo" as const, nombre: "Actividades externas" },
];

function leerArgumentos() {
  const [email, password, nombre, apellido] = process.argv.slice(2);

  if (!email || !password) {
    console.error(
      "Uso: pnpm db:bootstrap <email> <password> [nombre] [apellido]\n" +
        'Ej:  pnpm db:bootstrap kevin@miragesoftware.store "una-password-larga" Kevin Massaccesi',
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("La contraseña tiene que tener al menos 8 caracteres.");
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
  const { email, password, nombre, apellido } = leerArgumentos();

  // 1. Las capacidades normalmente se registran al arrancar el server
  //    (instrumentation.ts). Acá se registran igual para no depender de
  //    que el server haya corrido antes: sin filas en `capacidad` el rol
  //    de abajo no tiene nada que asignar.
  await registrarCapacidades(capacidadesDeclaradas);
  console.log(`Capacidades registradas: ${capacidadesDeclaradas.length}`);

  // 2. Rol inicial con todas las capacidades. Es deliberadamente el rol
  //    más ancho posible — es el único que puede existir antes de que
  //    haya alguien que cree roles más finos. Recortarlo (o crear roles
  //    por área) es trabajo de /app una vez que estés adentro.
  let [rolInicial] = await db
    .select()
    .from(rol)
    .where(eq(rol.nombre, ROL_INICIAL));

  if (!rolInicial) {
    [rolInicial] = await db
      .insert(rol)
      .values({
        nombre: ROL_INICIAL,
        descripcion: "Rol de arranque: todas las capacidades declaradas.",
      })
      .returning();
    console.log(`Rol "${ROL_INICIAL}" creado.`);
  } else {
    console.log(`Rol "${ROL_INICIAL}" ya existía, se reusa.`);
  }

  await db
    .insert(rolCapacidad)
    .values(
      capacidadesDeclaradas.map((c) => ({
        rolId: rolInicial!.id,
        capacidadClave: c.clave,
      })),
    )
    .onConflictDoNothing();

  // 3. La persona. Puede existir ya (creada a mano en la base) sin
  //    usuario vinculado — ese caso se completa en vez de fallar.
  let [personaInicial] = await db
    .select()
    .from(persona)
    .where(eq(persona.email, email));

  if (!personaInicial) {
    [personaInicial] = await db
      .insert(persona)
      .values({ nombre, apellido, email, tipo: "empleado" })
      .returning();
    console.log(`Persona creada: ${nombre} ${apellido} <${email}>`);
  } else if (personaInicial.tipo !== "empleado") {
    console.error(
      `Ya existe una persona con ese email y es "${personaInicial.tipo}", no empleado. ` +
        "Usá otro email: el portal y el sistema interno no comparten cuenta.",
    );
    process.exit(1);
  } else {
    console.log(`Persona ya existía: ${email}`);
  }

  // 4. El usuario de better-auth. signUpEmail hashea la contraseña con
  //    el mismo algoritmo que valida el login — por eso se crea así y no
  //    con un INSERT a mano.
  if (personaInicial!.usuarioId) {
    console.log("Esa persona ya tenía acceso; no se toca la contraseña.");
  } else {
    const { user } = await auth.api.signUpEmail({
      body: { email, password, name: `${nombre} ${apellido}` },
    });
    await db
      .update(persona)
      .set({ usuarioId: user.id })
      .where(eq(persona.id, personaInicial!.id));
    console.log("Usuario creado y vinculado a la persona.");
  }

  // 5. El rol: sin esto entra a /app pero no puede hacer nada
  //    (tienePermiso mira persona_rol → rol_capacidad).
  await db
    .insert(personaRol)
    .values({ personaId: personaInicial!.id, rolId: rolInicial!.id })
    .onConflictDoNothing();

  // 6. Las dos raíces del organigrama, y la persona como titular de la
  //    interna. Sin raíces no hay árbol donde colgar nada, y sin nodo no
  //    se puede crear un cliente (crearCliente exige nodoResponsableId),
  //    y sin cliente no hay contactos ni portal. Es el primer eslabón de
  //    toda esa cadena.
  const raicesExistentes = await db
    .select({ raiz: nodo.raiz, id: nodo.id })
    .from(nodo)
    .where(isNull(nodo.padreId));

  for (const { raiz, nombre } of RAICES) {
    if (raicesExistentes.some((r) => r.raiz === raiz)) {
      continue;
    }
    const [creada] = await db
      .insert(nodo)
      .values({ nombre, raiz, padreId: null })
      .returning();
    console.log(`Raíz "${nombre}" (${raiz}) creada.`);

    if (raiz === "interno") {
      await asignarPersona(personaInicial!.id, creada!.id, true).catch(() => {
        // Ya hay un titular vigente — no es un error para un script que
        // se puede correr dos veces.
      });
    }
  }

  console.log(
    `\nListo. Entrá en http://localhost:3000/ingresar con ${email} y te lleva a /app.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
