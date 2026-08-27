# Bitácora — PR 5 (`fix-05-permisos-roles`)

Permisos: roles administrables y organigrama. Rama sacada de `staging`
actualizado (ya con PR 1-4). Depende del PR 4. PR contra `staging`.

---

## 1. Qué se hizo (contra el §3, PR 5)

**Paso 1 — capacidades del kernel.** ✅
`kernel/permisos/capacidades-kernel.ts` (nuevo, mismo formato que el
`permissions.ts` de un módulo) con `organigrama.ver`, `organigrama.editar`,
`organigrama.administrar` e `identidad.administrar`. Sumado a
`capacidades-declaradas.ts` (van primeras).

**Contradicción con el código real que resolví (§0.1.5):** el `CLAUDE.md`
dice que las capacidades se registran en `instrumentation.ts` al arrancar el
server — pero ese archivo **nunca existió** (el bus de eventos se
auto-inicializa justamente porque instrumentation no funcionaba para él). El
único lugar que registraba capacidades era `crearPrimerEmpleado`. Sin shell
en Render free, un deploy que agrega capacidades no las podía dejar en la
base. Dos piezas para cerrarlo:
  - `src/instrumentation.ts` (nuevo): `register()` llama a
    `registrarCapacidades(capacidadesDeclaradas)`. A diferencia del bus, esto
    es una escritura idempotente a la base, sin estado en memoria que
    compartir entre chunks. Si falla, se loguea y el server arranca igual.
  - Migración de datos `0020_capacidades_kernel_a_direccion.sql`: siembra las
    cuatro capacidades del kernel en `capacidad` y se las da al rol
    "Dirección" si existe (`ON CONFLICT DO NOTHING`). Sin esto, en la base
    ya arrancada de Kevin nadie tendría `identidad.administrar` y la pantalla
    de roles quedaría inalcanzable.

**Paso 2 — `organigrama.administrar` saltea el árbol.** ✅
`kernel/organigrama/arbol.ts`: `puedeAdministrarNodo(personaId, nodoId)` =
`tienePermiso("organigrama.administrar")` **o** el nodo está en
`nodosControladosPorPersona`. El control por árbol sigue siendo el default.
- `organigrama/page.tsx` pasa `administraTodo` (la capacidad) al cliente;
  `organigrama-cliente.tsx` habilita todos los nodos si está.
- **Chequeo server-side nuevo** en `asignarPersonaAction` y
  `finalizarAsignacionAction` (`exigirAdministrarNodo`): el gateo de la UI
  era solo cosmético, las acciones llamaban a `arbol.*` directo. Para
  `finalizarAsignacion` (que solo trae el id de la asignación) se agregó
  `nodoIdDeAsignacion`.

**Paso 3 — pantalla de roles.** ✅
- `kernel/permisos/roles.ts` (nuevo): `listarRoles`, `listarCapacidades`,
  `capacidadesDeRol`, `rolesDePersona`, `crearRol`, `fijarCapacidadesDeRol`
  (reemplaza el conjunto entero — es lo que manda un form de checkboxes),
  `asignarRolAPersona` / `quitarRolDePersona`.
- `/app/roles` (nuevo, en la sidebar): por rol, checkboxes de capacidades
  agrupadas por módulo; form para crear un rol. Protegida por
  `identidad.administrar` (si falta, muestra el motivo, no 404).
- `/app/personas/[id]`: sección "Roles" con checkbox por rol (asignar/quitar,
  optimista con rollback). Si la sesión no tiene `identidad.administrar`, se
  ve solo lectura.

**Paso 4 — las dos raíces.** ✅
`crearPrimerEmpleado` deja al fundador titular de la raíz interna **y** de la
externa. Sin eso la rama externa nace muerta.

**Paso 5 — validación de `asignarPersonaAction` (§1.12).** ✅
`Number("")` es `0` y `Number.isInteger(0)` es `true` — el guardia "Elegí una
persona" no atrapaba el `<select>` vacío. Ahora exige `> 0`. Mismo arreglo en
`moverNodoAction` (`nuevoPadreId`).
- `grep -rn "Number(formData.get" src` → el resto de los usos con este patrón
  están en `clientes/actions.ts` y `proyectos/actions.ts`, y ahí **no hay
  ningún guardia** (pasan `NaN`/`0` directo al kernel). Eso es la clase de
  bug del §1.10, que el PR 6 tiene que reproducir primero — no lo toqué acá
  para no tapar la reproducción.

**Paso 6 — mensajes de permiso.** ✅
- `requiere()` del kernel ya dice `Falta la capacidad "X"`.
- `/app/roles` sin permiso: nombra `identidad.administrar`.
- Organigrama: el `MOTIVO_SIN_PERMISO` del tooltip y el error server-side
  nombran `organigrama.administrar` como la vía alternativa.

**Paso 7 — tests.** ✅
- `kernel/permisos/roles.integration.test.ts` (nuevo): crear rol + Conflicto
  por duplicado; `fijarCapacidadesDeRol` reemplaza el set e ignora claves
  inválidas; asignar/quitar rol de persona (idempotente).
- `kernel/organigrama/arbol.integration.test.ts`: `puedeAdministrarNodo` —
  por defecto true solo en la rama propia; con `organigrama.administrar`,
  true en cualquier nodo aunque no se ocupe.
- `kernel/identidad/arranque.integration.test.ts`: el fundador es titular
  vigente de las dos raíces.
- `registro.integration.test.ts`: se agregó un `truncate` de `capacidad`
  después de migrar — la migración 0020 ahora pre-siembra filas y ese test
  es sobre `registrarCapacidades` en aislamiento.

---

## 2. Decisiones que tomé yo

- **`src/instrumentation.ts` + migración de datos 0020** en vez de solo
  "agregar capacidades-kernel.ts" (§1) — la contradicción del §0.1.5. Ver §1.
- **`fijarCapacidadesDeRol` = lista final, no deltas.** Es lo que manda
  naturalmente un `<form>` con checkboxes (`getAll("capacidad")`). Menos
  superficie que un add/remove por capacidad.
- **El chequeo de `organigrama.administrar` server-side solo en asignar /
  desasignar**, no en crear/mover/archivar nodo — es lo que pide el §2, y las
  otras acciones nunca tuvieron chequeo server-side (deuda preexistente,
  anotada abajo).
- **El rol "Dirección" no se auto-completa** en cada arranque: la migración
  0020 le da las capacidades nuevas una vez, y de ahí en más la pantalla de
  roles manda. `arranque.ts` sigue diciendo que se puede recortar.
- **No convertí las cards de "Servicios destacados" / "Casos" en enlaces**
  (era de otro PR igual) — nada que ver acá, lo aclaro porque el grep del
  §5 tocaba archivos de esas áreas.

---

## 3. Desviaciones del plan

- El §1 asumía que registrar capacidades "ya funciona". No funcionaba fuera
  del bootstrap. Se agregó `instrumentation.ts` + la migración 0020.
- El §5 pedía "buscar el mismo patrón `Number("")`". Aparece en
  `clientes`/`proyectos`, pero sin guardia — es §1.10, del PR 6. Lo dejo
  documentado, sin tocar.

---

## 4. Archivos tocados

**Capacidades del kernel**
- `src/kernel/permisos/capacidades-kernel.ts` (nuevo).
- `src/kernel/permisos/capacidades-declaradas.ts`.
- `src/instrumentation.ts` (nuevo).
- `src/db/migrations/0020_capacidades_kernel_a_direccion.sql` (+ journal +
  snapshot).

**Roles**
- `src/kernel/permisos/roles.ts` (nuevo) + `roles.integration.test.ts` (nuevo).
- `src/app/(interno)/app/roles/{page,editor-roles,actions}.tsx|ts` (nuevos).
- `src/app/(interno)/app/_guardas.ts` (nuevo — helper de permisos para
  Server Actions, no "use server").
- `src/app/(interno)/app/personas/{roles-persona.tsx (nuevo),actions.ts,[id]/page.tsx}`.
- `src/components/sidebar-interna/nav-interna.ts` (ítem "Roles").

**Organigrama**
- `src/kernel/organigrama/arbol.ts` (`puedeAdministrarNodo`,
  `nodoIdDeAsignacion`).
- `src/app/(interno)/app/organigrama/{page,organigrama-cliente,organigrama-formularios,actions}.tsx|ts`.

**Arranque**
- `src/kernel/identidad/arranque.ts` + `arranque.integration.test.ts`.

**Tests ajustados por la migración 0020**
- `src/kernel/permisos/registro.integration.test.ts`.

---

## 5. Qué verifiqué y cómo

- `pnpm lint` / `pnpm typecheck` / `pnpm build` → verde. `/app/roles`
  compila como ruta dinámica.
- `pnpm test` → **26 archivos, 203 tests, todos pasan.** Los focos de
  identidad, permisos y organigrama corren verde contra Postgres real: roles
  CRUD, `puedeAdministrarNodo` con y sin la capacidad, fundador titular de
  las dos raíces, y la migración 0020 no rompe `registrarCapacidades`.

**No verificado desde acá** (sin navegador que componga ni DB propia):
- El flujo en el navegador: darle un rol a alguien desde `/app/personas/[id]`,
  tildar capacidades en `/app/roles`, y que un `organigrama.administrar` real
  destrabe la rama externa. El criterio de aceptación ("Kevin le da un rol a
  Joaquin y lo asigna a actividades externas sin una query") es exactamente
  eso — hay que probarlo con datos.
- Que `instrumentation.ts` corra en el arranque real de Next (en dev lo hace;
  en el build de Docker con `NODE_ENV=production` conviene confirmar el log).

---

## 6. Dudas y sospechas

- **La migración 0020 depende del nombre del rol ("Dirección").** Si alguien
  renombró ese rol en la base, la migración no le da las capacidades nuevas y
  hay que tildarlas a mano en `/app/roles` desde otra cuenta que ya tenga
  `identidad.administrar`. En la base de Kevin el rol se llama "Dirección"
  (lo crea el bootstrap), así que debería andar.
- **Si nadie tiene `identidad.administrar`** (migración no aplicada, rol
  renombrado), `/app/roles` queda sin dueño. No hay escape hatch — es
  deliberado (no quería un "si nadie lo tiene, cualquiera puede"), pero
  conviene saberlo. El arreglo manual es un `INSERT` a `rol_capacidad`.
- **`instrumentation.ts` y el build de Docker.** El `register()` importa
  `@/kernel/permisos/registro` que toca la base. Si `DATABASE_URL` no está
  al momento del `register()` (no debería: el contenedor la tiene), el
  try/catch lo traga y loguea. Confirmar el log en el primer deploy.
- **Crear/mover/archivar nodo siguen sin chequeo server-side de permiso** —
  deuda preexistente, fuera del §2. Solo asignar/desasignar quedaron
  cerradas.
- **`fijarCapacidadesDeRol` no impide dejar un rol sin ninguna capacidad**,
  ni impide quitarse a uno mismo `identidad.administrar`. Un admin se puede
  bloquear solo. No lo protegí — es simétrico a cómo el resto del sistema
  trata a Dirección.

---

## 7. Deuda que dejo

1. **Probar el flujo de punta a punta** en el navegador con datos
   (criterio de aceptación).
2. **Confirmar que `instrumentation.ts` corre** en el deploy de Docker
   (mirar el log de arranque).
3. Los `Number(formData.get(...))` sin guardia de `clientes` y `proyectos` —
   son del §1.10, los cierra el PR 6.
4. Chequeo server-side de permiso en crear/mover/archivar nodo — fuera del
   alcance del §2, pero es un agujero.
