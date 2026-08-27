# Auditoría del interno — 27 de agosto de 2026 (PR 6 de la ronda de fixes)

> **Alcance real.** Esta auditoría es un **repaso estático** (lectura de
> código pantalla por pantalla), no un recorrido en vivo: la sesión de
> Claude Code que la produjo no tiene un navegador que componga frames ni
> una base con datos. Los hallazgos "confirmados" salen del código; los
> "a verificar" necesitan un recorrido con datos reales. `/portal` no se
> pudo recorrer y queda pendiente entero (§4).

Severidad: **crítico** (rompe un flujo), **molesto** (funciona pero
confunde o se ve mal), **cosmético**.

---

## 1. Lo que este PR arregló

| Sev | Pantalla | Qué pasaba | Arreglo |
|---|---|---|---|
| crítico | `/app/proyectos/[id]` — crear tarea | Ver §2. | Guardias de FormData + `idElegido` |
| crítico (latente) | Kanban / Gantt / crear proyecto / crear cliente / interacción | `Number(formData.get(...))` sin guardia: un `<select>` sin elegir manda `""` → `0` (id inexistente, mensaje cursado) o `NaN` → query de Postgres rota como error crudo (500). | `idElegido()` en `src/lib/form.ts` + guardias que devuelven un error legible |
| molesto | `/app/organigrama` — asignar persona (§1.12) | `Number("")` es `0` y `Number.isInteger(0)` es `true`: el guardia "Elegí una persona" no atrapaba el select vacío. | (ya venía del PR 5) ahora usa `idElegido` |
| molesto | `/app/proyectos/[id]`, `/app/personas`, `/app/proyectos` (repos) | Inputs y selects crudos (`rounded-md border px-2 py-1`, `<select>` nativo): sin foco, sin estados, distintos del resto. | Migrados a `<Input>` / `<Select>` |

---

## 2. Crear la primera tarea desde `/app/proyectos/[id]` (§1.10)

**No se pudo reproducir en vivo** (sin app corriendo). Repaso estático,
por probabilidad:

1. **`requiere(personaId, "proyectos.editar")` tira `NoAutorizado`.**
   `modules/proyectos/api.ts:crearTarea` lo chequea (es uno de los dos
   únicos usos reales de `requiere()` en el repo). El rol de la cuenta
   creada a mano puede no tener esa capacidad. `manejarError` traduce el
   `NoAutorizado` a `{ error: 'Falta la capacidad "proyectos.editar"' }` —
   así que **no es un 500**, es un rojo cursado debajo del form que a un
   admin no le dice nada. **Arreglo real: darle `proyectos.editar` (y las
   demás capacidades de módulo) al rol "Dirección" desde `/app/roles`** (la
   pantalla nueva del PR 5). Confirmado por el test
   `crearTarea tira NoAutorizado sin la capacidad proyectos.editar`.
2. **`nodoResponsableId` mal.** El `<select required>` con `<option value=""
   disabled>` debería bloquear el submit vacío en el navegador — pero si
   por lo que sea llega `""` o algo no numérico, `Number()` daba `0`/`NaN`
   y de ahí un `NoEncontrado("No existe el nodo 0")` o un 500. **Arreglado**:
   `crearTareaAction` / `crearTareaEnColumnaAction` ahora validan con
   `idElegido` y devuelven "Elegí un nodo responsable."
3. **`venceEn` vacío.** El código ya lo maneja (`x ? new Date(x) : undefined`).
   No es esto.

**Conclusión anotada para el review:** el síntoma más probable es (1) —
una cuestión de datos (el rol), no de código. La migración `0020` del PR 5
le da al rol "Dirección" solo las capacidades del **kernel**, no las de los
módulos; hay que tildar `proyectos.editar` a mano en `/app/roles`, o sumar
una migración que reparta las capacidades de módulo al rol más ancho. Ver
§5, deuda #1.

---

## 3. Repaso pantalla por pantalla (estático)

### `/app` (inicio / tablero)
- **a verificar** — el tablero mezcla widgets (organigrama-mini, tareas,
  etc.). No se detectó nada roto en el código; hay que ver que cada widget
  tolere "sin datos".

### `/app/personas` y `/app/personas/[id]`
- **ok** — estado de acceso + roles (PR 4/5) andan a nivel de test.
- **molesto (arreglado)** — `formulario-persona.tsx` estaba con inputs
  crudos y un `<select>` nativo. Migrado.
- **a verificar** — el checkbox de roles es optimista con rollback; ver que
  el rollback se sienta bien si el server rechaza.

### `/app/organigrama`
- **molesto** — `organigrama-formularios.tsx` (298 líneas) todavía tiene
  ~5 inputs crudos y 2 `<select>` nativos, envueltos en la lógica de
  tooltip/`deshabilitado`. **No migrado** (riesgo de regresión alto sin QA
  visual del canvas + la interacción disabled/tooltip). Deuda #2.
- **molesto (arreglado)** — el guardia `Number("")` de `asignarPersonaAction`.
- **agujero conocido** — crear/mover/archivar nodo **no tienen chequeo
  server-side de permiso** (solo asignar/desasignar, PR 5). Deuda #3.

### `/app/clientes` y `/app/clientes/[id]`
- **crítico (latente, arreglado)** — `leerDatosCliente` hacía
  `Number(formData.get("nodoResponsableId"))` sin guardia; ídem
  `registrarInteraccionAction`. Ahora tiran `Validacion` legible.
- **molesto** — `formulario-cliente.tsx`, `clientes-formularios.tsx`:
  inputs/selects crudos. **No migrados**. Deuda #2.

### `/app/proyectos` y `/app/proyectos/[id]`
- **crítico (arreglado)** — ver §2.
- **molesto (arreglado)** — `tareas-formularios.tsx` (crear tarea + fila de
  tarea con 2 selects), el `<select>` de estado de `[id]/page.tsx`,
  `repositorios-formulario.tsx`. Migrados.
- **molesto** — `formulario-proyecto.tsx`, `proyectos-formularios.tsx`,
  `proyectos-grid.tsx` (filtro): crudos. **No migrados**. Deuda #2.

### `/app/tareas` (Kanban + Gantt)
- **crítico (latente, arreglado a nivel action)** — `crearTareaEnColumnaAction`
  y `crearHitoAction` tenían `Number(formData.get("proyectoId"))` sin
  guardia. Arreglado.
- **molesto** — `kanban-tareas.tsx` y `gantt-tareas.tsx` tienen selects
  crudos inline. **No migrados** (drag + DnD, riesgo alto sin QA visual).
  Deuda #2.
- **a verificar** — el drag es "optimista y revierte si el server rechaza"
  (`moverTareaAction` devuelve `{ ok, error }`); ver que la reversión
  visual funcione.

### `/app/contenido`, `/app/solicitudes`, `/app/notificaciones`, `/app/ajustes`
- **a verificar** — no se recorrieron en detalle. `formulario-servicio.tsx`
  y `formulario-caso.tsx` tienen inputs crudos. Deuda #2.
- **crítico (operativo)** — la pantalla de **notificaciones fallidas** tiene
  dos filas viejas (`auth.recuperar-password` con `new Resend("re_123")`).
  Sin `RESEND_API_KEY` en el entorno no se pueden reintentar. Es tarea de
  deploy (PR 4 §6), no de código.

### `/app/roles` (nueva en PR 5)
- **ok** — a nivel de test. **a verificar** en vivo: tildar capacidades y
  que el rol quede con el set exacto; que un admin no se pueda quitar
  `identidad.administrar` y quedar afuera (hoy no está protegido — decisión
  del PR 5).

---

## 4. `/portal` — pendiente entero

No se recorrió (no se probó desde el PR 12 del rediseño, según el plan).
Hay que verificar con una cuenta `contacto_cliente` real:
- Aislamiento: toda consulta filtrada por `cliente_id` de la sesión, nunca
  de la URL (es la superficie de mayor riesgo).
- Estados vacío / carga / error en cada pantalla.
- Que un `contacto_cliente` que pide una ruta de `/app` reciba 404, no 403.

---

## 5. Deuda que queda (prioridad para la ronda siguiente) — **no se abre un PR 7**

1. **(crítico/datos)** Repartir las capacidades de módulo (`proyectos.editar`,
   `clientes.*`, `contenido.editar`, etc.) al rol "Dirección" de la base ya
   arrancada — o tildar a mano desde `/app/roles`. Es lo que hace que
   "crear tarea" falle para Kevin (§2).
2. **(molesto)** Terminar la migración de formularios crudos:
   `organigrama-formularios.tsx`, `formulario-cliente.tsx`,
   `clientes-formularios.tsx`, `formulario-proyecto.tsx`,
   `proyectos-formularios.tsx`, `formulario-servicio.tsx`,
   `formulario-caso.tsx`, los filtros de los `*-grid.tsx`, y los selects
   inline de `kanban-tareas.tsx` / `gantt-tareas.tsx`. Todos necesitan QA
   visual (sobre todo Kanban/Gantt por el drag).
3. **(molesto)** Chequeo server-side de permiso en crear/mover/archivar
   nodo del organigrama (hoy solo asignar/desasignar).
4. **(a verificar)** Recorrido en vivo de `/portal` completo (§4).
5. **(a verificar)** Recorrido en vivo de `/app` con datos: estados
   vacío/carga/error de cada pantalla, navegación por teclado, 390 px.
6. **(operativo)** Reintentar o purgar las 2 notificaciones fallidas viejas
   con `RESEND_API_KEY` cargada.
