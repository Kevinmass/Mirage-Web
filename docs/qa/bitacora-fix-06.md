# Bitácora — PR 6 (`fix-06-interno-qa`)

Interno: auditoría, arreglos y tests. Cierra la ronda de fixes — **no se
abre un PR 7**. Rama sacada de `staging` actualizado (ya con PR 1-5).
Depende de PR 1 y PR 5. PR contra `staging`.

---

## 1. Qué se hizo (contra el §3, PR 6)

**Paso 1 — auditoría pantalla por pantalla.** 🟡 Parcial.
`docs/qa/2026-08-27-auditoria.md`: **repaso estático** (lectura de código),
no un recorrido en vivo — la sesión no tiene navegador que componga ni base
con datos. Hallazgos con severidad, lo arreglado en este PR, y una lista de
deuda priorizada. `/portal` queda pendiente entero (no se pudo recorrer).

**Paso 2 — el fallo de crear la primera tarea (§1.10).** 🟡 Analizado, no
reproducido en vivo.
Repaso estático concluyente: el síntoma más probable es que
`modules/proyectos/api.ts:crearTarea` llama a
`requiere(personaId, "proyectos.editar")`, y el rol de la cuenta creada a
mano no tiene esa capacidad → `NoAutorizado` → `manejarError` lo traduce a
`{ error: 'Falta la capacidad "proyectos.editar"' }` (rojo cursado, no
500). **No es un bug de código: es un dato (el rol).** El arreglo es
tildar `proyectos.editar` para "Dirección" en `/app/roles` (pantalla nueva
del PR 5). Anotado en la auditoría §2 y en la deuda #1.
- El segundo sospechoso (nodo responsable mal) **sí era un bug de código y
  se arregló**: ver paso 4.

**Paso 3 — migrar formularios crudos.** 🟡 Parcial (los de mayor tráfico /
menor riesgo).
Migrados a `<Input>` / `<Select>` del PR 1:
- `proyectos/tareas-formularios.tsx` (crear tarea + los 2 selects de la fila
  de tarea) — es la pantalla del §1.10.
- `proyectos/[id]/page.tsx` (el `<select>` de estado del proyecto).
- `proyectos/repositorios-formulario.tsx` (2 inputs).
- `personas/formulario-persona.tsx` (4 inputs + el `<select>` de tipo).

**No migrados** (riesgo de regresión alto sin QA visual): los formularios
grandes de clientes/proyectos/contenido, los filtros de los `*-grid.tsx`,
`organigrama-formularios.tsx` (por la lógica disabled/tooltip + el canvas),
y los selects inline de `kanban-tareas.tsx` / `gantt-tareas.tsx` (por el
drag). Listados en la auditoría §5, deuda #2.

**Paso 4 — ningún error de dominio que se escape como 500.** ✅
El agujero real: `Number(formData.get("<id>"))` sin guardia en varias
Server Actions. `Number("")` es `0` (id inexistente → mensaje cursado);
`Number("x")` es `NaN` → la query de Postgres revienta como error crudo →
500 de Server Action.
- `src/lib/form.ts`: `idElegido(valor)` → entero positivo o `null`. Con
  test unitario (`form.test.ts`).
- Guardias que devuelven un error legible en: `crearTareaAction`,
  `crearTareaEnColumnaAction`, `crearProyectoAction`, `crearHitoAction`,
  `agregarAlEquipoAction`, `asignarPersonaATareaAction` (proyectos);
  `asignarPersonaAction`, `moverNodoAction` (organigrama — los de PR 5,
  ahora vía `idElegido`); `leerDatosCliente`, `registrarInteraccionAction`
  (clientes).
- Repaso de los `catch` de las Server Actions: `proyectos/actions.ts` y
  `organigrama/actions.ts` ya centralizan en `manejarError` /
  `mensajeDeError` (traducen los errores tipados, re-tiran el resto).
  `clientes/actions.ts` repite el bloque inline pero cubre lo mismo. No
  encontré un `catch` que se coma un error tipado ni uno que devuelva un
  500 evitable.

**Paso 5 — tests de integración de los flujos críticos.** ✅ (con matiz).
Al revisar, la mayoría **ya tenían red** a nivel de módulo:
- `modules/proyectos/api.integration.test.ts`: `crearTarea` exige
  proyecto + nodo existentes; `crearTarea` tira `NoAutorizado` sin
  `proyectos.editar`; `inscribirPersona` rechaza con el cupo lleno;
  `asignarPersonaATarea` exige persona existente.
- `kernel/organigrama/arbol.integration.test.ts`: `asignarPersona` +
  `puedeAdministrarNodo` (PR 5).
- `kernel/identidad/{auth,personas}.integration.test.ts`: invitar + verificar
  (PR 4).
Lo que **faltaba red** era la capa de Server Actions (parseo de FormData +
guardias), que es donde vivían §1.10 / §1.12. Eso lo cubre
`src/lib/form.test.ts` (`idElegido` con todos los casos borde: `""`, `null`,
no-numérico, `0`, negativos, decimales).

---

## 2. Decisiones que tomé yo

- **La auditoría es estática y lo dice arriba de todo.** Un recorrido en
  vivo lo hace Kevin; el documento le deja la lista de qué mirar.
- **`idElegido` en `src/lib/form.ts`**, no en cada `actions.ts` — un
  `"use server"` no puede exportar helpers (todo export es una Server
  Action), y así se puede testear como función pura.
- **No migré los formularios de riesgo alto.** El §1.10 y los guardias son
  lo que rompe flujos; los inputs crudos son molestos pero funcionan.
  Migrar Kanban/Gantt a ciegas es peor que dejarlos.
- **No toqué el rol "Dirección" para darle las capacidades de módulo.**
  El §2 lo pide como "arreglo", pero es una decisión de datos (¿todas las
  capacidades a Dirección para siempre? ¿una migración? ¿a mano?) que
  prefiero que tome Kevin — está la pantalla `/app/roles` para hacerlo.

---

## 3. Desviaciones del plan

- §1 (auditoría): estática, no recorrido en vivo. Limitación de la sesión.
- §2 (§1.10): analizado a fondo, no reproducido. El plan preveía este caso
  ("Si no se reproduce, decirlo en la bitácora en vez de parchear a
  ciegas") — hecho: la parte de código se arregló, la parte de datos queda
  anotada.
- §3 (formularios): parcial. El resto en la auditoría §5.

---

## 4. Archivos tocados

**Guardias de FormData / §1.10 / §1.12**
- `src/lib/form.ts` + `src/lib/form.test.ts` (nuevos).
- `src/app/(interno)/app/proyectos/actions.ts`.
- `src/app/(interno)/app/organigrama/actions.ts`.
- `src/app/(interno)/app/clientes/actions.ts`.

**Formularios migrados a los primitivos del PR 1**
- `src/app/(interno)/app/proyectos/tareas-formularios.tsx`.
- `src/app/(interno)/app/proyectos/[id]/page.tsx`.
- `src/app/(interno)/app/proyectos/repositorios-formulario.tsx`.
- `src/app/(interno)/app/personas/formulario-persona.tsx`.

**Documentación**
- `docs/qa/2026-08-27-auditoria.md` (nuevo).
- `docs/qa/bitacora-fix-06.md` (nuevo).

---

## 5. Qué verifiqué y cómo

- `pnpm lint` / `pnpm typecheck` / `pnpm build` → verde.
- `pnpm test` → **27 archivos, 209 tests, todos pasan.** `form.test.ts`
  suma 6 (todos los casos borde de `idElegido`). El resto de los flujos
  críticos ya tenían cobertura a nivel de módulo (ver paso 5).
- **No verificado desde acá**: cómo se ven los formularios migrados en el
  navegador (el `<Select>` de Base UI se comporta distinto que el `<select>`
  nativo — submit por input oculto, teclado, móvil); el recorrido en vivo
  de `/app` y `/portal` (auditoría §3-4).

---

## 6. Dudas y sospechas

- **`<Select>` de Base UI en un `<form>`**: manda el valor por un input
  oculto con `name`. Verificar en el navegador que `crearTareaAction`
  recibe `nodoResponsableId` bien, y que `defaultValue` se respeta al
  reabrir la fila de una tarea.
- **`personaId="sin-asignar"`**: cambié el value del `<SelectItem>` "Sin
  asignar" de `""` a `"sin-asignar"` (Base UI no quiere value vacío).
  `asignarPersonaATareaAction` ahora usa `idElegido`, que devuelve `null`
  para "sin-asignar" → desasigna. Cubierto por lógica, no por test de esa
  action puntual.
- **§1.10**: si al probar en vivo resulta que NO es la capacidad
  `proyectos.editar`, hay que volver sobre el sospechoso 2 (nodo) — pero
  ese ya está blindado, así que el error sería otro y visible.
- El `manejarError` de `proyectos/actions.ts` **re-tira** lo que no es un
  error tipado. Eso es correcto (un bug de infra debe fallar fuerte), pero
  significa que un `PostgresError` sí sube como 500. Los guardias nuevos
  cortan las causas conocidas; puede quedar alguna no cubierta.

---

## 7. Deuda que dejo

Toda en `docs/qa/2026-08-27-auditoria.md` §5, en orden de prioridad:
1. Repartir las capacidades de módulo al rol "Dirección" (lo que rompe
   "crear tarea").
2. Terminar la migración de formularios (con QA visual).
3. Chequeo server-side de permiso en crear/mover/archivar nodo.
4. Recorrido en vivo de `/portal`.
5. Recorrido en vivo de `/app` con datos.
6. Reintentar/purgar las 2 notificaciones fallidas viejas.
