# Bitácora — PR 4 (`fix-04-alta-verificada`)

Identidad: `/setup` y alta con mail verificado. Rama sacada de `staging`
actualizado (ya con PR 1-3). No depende de 1-3. PR contra `staging`.

---

## 1. Qué se hizo (contra el §3, PR 4)

**Paso 1 — extraer la lógica de arranque.** ✅
`kernel/identidad/arranque.ts` nuevo: `crearPrimerEmpleado(datos, log?)`
(idempotente) + `existeAlgunaPersona()`. Es el cuerpo del viejo
`db/bootstrap.ts`, que ahora es un wrapper de 30 líneas que parsea argv y
llama a la función. Tira `Validacion` / `Conflicto` en vez de `process.exit`
para que `/setup` pueda manejarlo.

**Paso 2 — ruta `/setup`.** ✅
`(publico)/(sin-chasis)/setup/` — `page.tsx` (server, guarda) +
`formulario-setup.tsx` (client) + `actions.ts`. Responde solo si
`persona` está vacía **y** `?token=` coincide con `SETUP_TOKEN`; cualquier
otro caso → `notFound()` (404, no 403). La Server Action revalida las dos
condiciones (un guardia de página no alcanza para un endpoint). Al terminar,
loguea a la persona y redirige a `/app`.

**Paso 3 — verificación de mail obligatoria.** ✅
`kernel/identidad/auth.ts`:
- `emailAndPassword.requireEmailVerification: true` → `signInEmail` tira
  `EMAIL_NOT_VERIFIED` si el usuario no confirmó.
- `emailVerification`: `sendOnSignUp: false` (el mail de invitación ya
  cubre el caso, no queremos dos), `autoSignInAfterVerification: true`, y
  `sendVerificationEmail` que **encola** en notificaciones (nueva plantilla
  `auth.verificar-email` en `modules/notificaciones/internal/plantillas.ts`).
- La forma exacta de la config se verificó **contra el paquete instalado**
  (`better-auth@1.7.1`, leyendo `dist/api/routes/{sign-in,sign-up,password,
  email-verification}.mjs`), no contra la doc.
- `PLANTILLA_EXCLUIDA_DEL_FEED` pasó a ser un array
  (`PLANTILLAS_EXCLUIDAS_DEL_FEED`) — `auth.verificar-email` tampoco va al
  feed de la campana.

**Paso 4 — primer empleado nace verificado.** ✅
`crearPrimerEmpleado` hace `db.update(usuario).set({ emailVerified: true })`
después del `signUpEmail`. En una base nueva no hay Resend, no habría otra
forma de confirmar.

**Paso 5 — invitación.** ✅
- El flujo de `invitarPersona` no cambió (signup con contraseña al azar +
  `requestPasswordReset`), pero ahora **completar ese reset también deja el
  mail verificado**: `emailAndPassword.onPasswordReset` hace
  `emailVerified: true`. Un solo mail, un solo click, hace las dos cosas.
  (Un "olvidé mi contraseña" real también verifica de paso — clickear un
  link que llegó a tu inbox prueba lo mismo que "verificar".)
- `reenviarInvitacion(id)` nuevo: reenvía el link de reset a alguien
  invitado que todavía no lo completó.
- `kernel/identidad/personas.ts`: `listarPersonasConAcceso()` /
  `obtenerPersonaConAcceso()` devuelven `estadoAcceso`:
  `sin_acceso` (sin `usuarioId`) / `invitada` (`usuarioId` pero
  `!emailVerified`) / `confirmada`.
- `/app/personas`: badge de estado en cada card de empleado.
- `/app/personas/[id]`: badge de estado + botón "Invitar a tener acceso"
  (si `sin_acceso`) o "Reenviar invitación" (si `invitada`).

**Paso 6 — configuración real.** ✅ (documentada, no aplicada)
`.env.example`, sección "Variables de entorno" de `CLAUDE.md`, el README y
`render.yaml` documentan `RESEND_API_KEY`, `SETUP_TOKEN`, `GITHUB_TOKEN`
(las tres con `sync: false` en `render.yaml`). El dominio verificado en
Resend y la carga real de las env vars en Render **no** se pueden hacer
desde acá — quedan como tarea de quien tenga la cuenta.

**Paso 7 — tests de integración.** ✅
- `arranque.integration.test.ts` (nuevo): `existeAlgunaPersona` false→true;
  `crearPrimerEmpleado` crea persona + usuario verificado + rol "Dirección"
  con todas las capacidades + `persona_rol` + las dos raíces; idempotente
  (correrla de nuevo no duplica, devuelve `yaExistia: true`); rechaza
  contraseña corta.
- `auth.integration.test.ts`: se arregló lo que rompía
  `requireEmailVerification` (los tests que no son sobre verificación marcan
  el mail a mano); test nuevo "una persona sin el mail verificado no puede
  entrar"; el test de recuperación ahora también verifica que el reset deja
  `emailVerified: true`.
- `personas.integration.test.ts`: `estadoAcceso` va
  `sin_acceso → invitada → confirmada`, con el paso por el medio de que una
  persona invitada **no puede entrar** hasta completar el reset;
  `reenviarInvitacion` encola un segundo mail; rechaza si nunca se invitó.

---

## 2. Decisiones que tomé yo

- **El link de invitación es el reset de contraseña, y `onPasswordReset`
  verifica.** El plan pide "verificación + alta de contraseña en un solo
  mail". better-auth no tiene un flujo nativo que haga las dos; en vez de
  mandar dos mails (reset + verificación), el reset hace las dos cosas al
  completarse. Efecto colateral querido: un "olvidé mi contraseña" real
  self-cura una cuenta sin verificar.
- **`sendOnSignUp: false`.** Con `requireEmailVerification: true`,
  better-auth auto-manda verificación en el signup. Como `invitarPersona`
  hace `signUpEmail`, eso sería un segundo mail. Apagado.
- **`sendVerificationEmail` igual se implementa** (el plan lo pide y sirve
  para el "reenviar" y para cualquier signInEmail futuro con
  `sendOnSignIn`), solo que no se dispara en el signup.
- **`estadoAcceso` derivado, no una columna.** Es `usuarioId` + el
  `emailVerified` del usuario vía join. No hay estado que guardar ni
  desincronizar.
- **`/setup` con token por query param** (`?token=`). Es un GET; un header
  custom no lo puede poner el navegador al escribir una URL. El token nunca
  se loguea (no va en el form como texto visible más allá del hidden).
- **El primer empleado no es titular de la raíz externa todavía** — eso es
  el PR 5 (§4 de ese PR). `crearPrimerEmpleado` deja el comentario.

---

## 3. Desviaciones del plan

- El plan sugería `sendVerificationEmail` como el mecanismo principal de
  verificación. Terminó siendo secundario: el reset de contraseña de la
  invitación verifica de paso (§2). El bloque `emailVerification` existe y
  encola igual, pero no se dispara en el alta por invitación.

---

## 4. Archivos tocados

**Arranque**
- `src/kernel/identidad/arranque.ts` (nuevo) — la lógica.
- `src/db/bootstrap.ts` — ahora un wrapper de argv.
- `src/kernel/identidad/arranque.integration.test.ts` (nuevo).

**`/setup`**
- `src/app/(publico)/(sin-chasis)/setup/{page,formulario-setup}.tsx`,
  `.../setup/actions.ts` (nuevos).

**Verificación de mail**
- `src/kernel/identidad/auth.ts` — `requireEmailVerification`,
  `emailVerification`, `onPasswordReset`, helper `encolarMailDeIdentidad`.
- `src/modules/notificaciones/internal/plantillas.ts` — plantilla
  `auth.verificar-email`.
- `src/modules/notificaciones/api.ts` — exclusión del feed como array.

**Invitación / estado de acceso**
- `src/kernel/identidad/personas.ts` — `listarPersonasConAcceso`,
  `obtenerPersonaConAcceso`, `reenviarInvitacion`, tipo `EstadoAcceso`.
- `src/app/(interno)/app/personas/{page,personas-grid}.tsx`,
  `.../personas/actions.ts`, `.../personas/[id]/page.tsx`.

**Config**
- `.env.example`, `CLAUDE.md` (§Variables de entorno), `README.md`,
  `render.yaml`.

**Tests**
- `src/kernel/identidad/{auth,personas}.integration.test.ts` (ajustes +
  casos nuevos).

---

## 5. Qué verifiqué y cómo

- `pnpm lint` / `pnpm typecheck` / `pnpm build` → verde. `/setup` compila
  como ruta dinámica.
- `pnpm test` → **25 archivos, 198 tests, todos pasan.** Hubo que ajustar
  `sesion.integration.test.ts` además de `auth` y `personas`:
  `requireEmailVerification` rompía cualquier `signInEmail` sobre un usuario
  recién creado. Los tests que no son sobre verificación marcan
  `emailVerified` a mano; el flujo real tiene sus propios casos. Contra
  Postgres real en testcontainers, cubren: arranque idempotente, que una
  persona invitada no entra hasta verificar, y las transiciones de estado.
- La config de better-auth se leyó del paquete instalado (los `.mjs` de
  `dist/api/routes/`), no de la doc.

**No verificado desde acá** (sin navegador que componga ni DB propia):
- El flujo de `/setup` en el navegador (formulario → crea → redirige a
  `/app`). La lógica (`crearPrimerEmpleado`) sí está cubierta por
  integración; el guardia de la ruta (`notFound()` con token mal o persona
  existente) no — necesita contexto de request.
- El mail real saliendo por Resend (no hay key acá).
- Que la pantalla de notificaciones fallidas quede vacía (criterio de
  aceptación 3) — es una tarea operativa sobre la base de producción
  (reintentar/purgar las 2 fallidas viejas), no de código.

---

## 6. Dudas y sospechas

- **`onPasswordReset` verifica cualquier reset**, no solo el de
  invitación. Es a propósito (§2), pero si en algún momento se quiere
  distinguir "primer set de contraseña" de "cambio de contraseña", hace
  falta otra señal.
- **`autoSignInAfterVerification: true`** solo aplica al flujo de
  `sendVerificationEmail` (verify-email endpoint), que hoy no se usa en el
  alta. Si se llega a usar, revisar que el redirect post-verificación
  (`callbackURL`) apunte a algo útil.
- **`/setup` bundlea `arranque.ts`** que arrastra organigrama + permisos +
  el agregador de capacidades. Es una ruta que casi siempre 404ea, así que
  el peso no importa mucho, pero está.
- **El token de `/setup` viaja en la URL.** Privacidad: no debería quedar
  en logs de acceso con el valor real más de lo imprescindible. Alternativa
  si molesta: aceptarlo también por header y que el form lo mande por POST
  a un endpoint que setea una cookie de sesión de setup. No lo hice —
  `SETUP_TOKEN` es de un solo uso y se borra después.
- **Los tests de `auth.integration.test.ts` que marcan `emailVerified` a
  mano** ahora dependen de ese detalle. Si el schema de `usuario` cambia el
  nombre del campo, esos tests lo agarran.

---

## 7. Deuda que dejo

1. **Configuración real en Render** (paso 6): cargar `RESEND_API_KEY`,
   `SETUP_TOKEN`, `GITHUB_TOKEN`; verificar el dominio en Resend para
   `no-reply@miragesoftware.com.ar`. No se puede desde acá.
2. **Reintentar o purgar las 2 notificaciones fallidas viejas** una vez que
   haya `RESEND_API_KEY` (criterio de aceptación 3).
3. **Probar `/setup` en el navegador** de punta a punta en una base limpia.
4. Un test del guardia de `/setup` (404 con token mal / persona existente)
   — necesita un helper que simule el request a la Server Action / la
   página; no lo armé.
