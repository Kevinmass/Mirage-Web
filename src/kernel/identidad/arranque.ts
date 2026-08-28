import { eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { Conflicto, Validacion } from "@/kernel/errores";
import { asignarPersona } from "@/kernel/organigrama/arbol";
import { nodo } from "@/kernel/organigrama/schema";
import { capacidadesDeclaradas } from "@/kernel/permisos/capacidades-declaradas";
import { registrarCapacidades } from "@/kernel/permisos/registro";
import { personaRol, rol, rolCapacidad } from "@/kernel/permisos/schema";
import { persona, usuario } from "./schema";

// Arranque en frío: crea el primer empleado con acceso a /app.
//
// Sin esto la base recién migrada es un callejón sin salida: no hay
// registro público (a propósito — el alta de personas vive en /app), y el
// ABM que crea empleados está detrás de /app. Alguien tiene que existir
// antes.
//
// Esta función es la lógica real; la comparten el script `pnpm db:bootstrap`
// (src/db/bootstrap.ts) y la ruta `/setup` (PR 4 de la ronda de fixes). Es
// idempotente: si la persona, el rol o el usuario ya existen, los reusa en
// vez de duplicarlos. Correrla dos veces no rompe nada.

const ROL_INICIAL = "Dirección";

// Las dos raíces del organigrama. El diseño (§4.2) las describe como "un
// dato fijo, dos filas con padre_id null" y crearNodo las excluye a
// propósito (siempre exige padreId) — pero nada las insertaba, así que una
// base recién migrada no tenía árbol y no había forma de empezarlo desde la
// UI. Los nombres salen de mirage-empresa/02-estructura: son
// responsabilidades, no personas (regla 1). Se pueden renombrar después
// desde /app/organigrama.
const RAICES = [
  { raiz: "interno" as const, nombre: "Actividades internas" },
  { raiz: "externo" as const, nombre: "Actividades externas" },
];

export interface DatosPrimerEmpleado {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
}

export interface ResultadoArranque {
  personaId: number;
  // false = se creó recién; true = ya había un empleado con ese email y se
  // completó / reusó lo que faltaba.
  yaExistia: boolean;
}

// Si loguear el progreso (el script sí, la ruta no).
type Log = (mensaje: string) => void;
const sinLog: Log = () => {};

export async function crearPrimerEmpleado(
  datos: DatosPrimerEmpleado,
  log: Log = sinLog,
): Promise<ResultadoArranque> {
  const email = datos.email.trim().toLowerCase();
  const { password, nombre, apellido } = datos;

  if (!email || !password) {
    throw new Validacion("Hacen falta email y contraseña.");
  }
  if (password.length < 8) {
    throw new Validacion(
      "La contraseña tiene que tener al menos 8 caracteres.",
    );
  }

  // 1. Las capacidades normalmente se registran al arrancar el server
  //    (instrumentation.ts). Acá se registran igual para no depender de que
  //    el server haya corrido antes: sin filas en `capacidad` el rol de
  //    abajo no tiene nada que asignar.
  await registrarCapacidades(capacidadesDeclaradas);
  log(`Capacidades registradas: ${capacidadesDeclaradas.length}`);

  // 2. Rol inicial con todas las capacidades. Es deliberadamente el rol más
  //    ancho posible — es el único que puede existir antes de que haya
  //    alguien que cree roles más finos.
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
    log(`Rol "${ROL_INICIAL}" creado.`);
  } else {
    log(`Rol "${ROL_INICIAL}" ya existía, se reusa.`);
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

  // 3. La persona. Puede existir ya (creada a mano en la base) sin usuario
  //    vinculado — ese caso se completa en vez de fallar.
  let [personaInicial] = await db
    .select()
    .from(persona)
    .where(eq(persona.email, email));

  const yaExistia = Boolean(personaInicial);

  if (!personaInicial) {
    [personaInicial] = await db
      .insert(persona)
      .values({ nombre, apellido, email, tipo: "empleado" })
      .returning();
    log(`Persona creada: ${nombre} ${apellido} <${email}>`);
  } else if (personaInicial.tipo !== "empleado") {
    throw new Conflicto(
      `Ya existe una persona con ese email y es "${personaInicial.tipo}", no empleado. ` +
        "Usá otro email: el portal y el sistema interno no comparten cuenta.",
    );
  } else {
    log(`Persona ya existía: ${email}`);
  }

  // 4. El usuario de better-auth. signUpEmail hashea la contraseña con el
  //    mismo algoritmo que valida el login. El primer empleado nace con el
  //    mail ya verificado (PR 4): en una base nueva no hay Resend
  //    configurado y no habría forma de confirmar de otra manera.
  if (personaInicial!.usuarioId) {
    await db
      .update(usuario)
      .set({ emailVerified: true })
      .where(eq(usuario.id, personaInicial!.usuarioId));
    log("Esa persona ya tenía acceso; no se toca la contraseña.");
  } else {
    const { auth } = await import("./auth");
    const { user } = await auth.api.signUpEmail({
      body: { email, password, name: `${nombre} ${apellido}` },
    });
    await db
      .update(usuario)
      .set({ emailVerified: true })
      .where(eq(usuario.id, user.id));
    await db
      .update(persona)
      .set({ usuarioId: user.id })
      .where(eq(persona.id, personaInicial!.id));
    log("Usuario creado y vinculado a la persona (mail verificado).");
  }

  // 5. El rol: sin esto entra a /app pero no puede hacer nada (tienePermiso
  //    mira persona_rol → rol_capacidad).
  await db
    .insert(personaRol)
    .values({ personaId: personaInicial!.id, rolId: rolInicial!.id })
    .onConflictDoNothing();

  // 6. Las dos raíces del organigrama, y la persona como titular de las
  //    dos. Sin raíces no hay árbol donde colgar nada; sin titular en la
  //    rama externa, esa rama nace muerta y nadie puede asignar ahí desde
  //    la UI (PR 5 de la ronda de fixes).
  const raicesExistentes = await db
    .select({ raiz: nodo.raiz, id: nodo.id })
    .from(nodo)
    .where(isNull(nodo.padreId));

  for (const { raiz, nombre: nombreRaiz } of RAICES) {
    const existente = raicesExistentes.find((r) => r.raiz === raiz);
    let raizId = existente?.id;

    if (!raizId) {
      const [creada] = await db
        .insert(nodo)
        .values({ nombre: nombreRaiz, raiz, padreId: null })
        .returning();
      raizId = creada!.id;
      log(`Raíz "${nombreRaiz}" (${raiz}) creada.`);
    }

    await asignarPersona(personaInicial!.id, raizId, true).catch(() => {
      // Ya hay un titular vigente — no es un error para algo que se puede
      // correr dos veces.
    });
  }

  return { personaId: personaInicial!.id, yaExistia };
}

// ¿Hay al menos una persona en la base? La ruta /setup existe solo mientras
// esto sea false.
export async function existeAlgunaPersona(): Promise<boolean> {
  const [fila] = await db.select({ id: persona.id }).from(persona).limit(1);
  return Boolean(fila);
}
