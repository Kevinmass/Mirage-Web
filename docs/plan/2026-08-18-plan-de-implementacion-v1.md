# Plataforma Mirage — plan de implementación de la v1

**Fecha:** 18 de agosto de 2026
**Basado en:** `docs/specs/2026-08-14-plataforma-mirage-design.md` (aprobado para planificación)
**Ejecutor:** una persona, part-time (~8-10 h/semana)
**Estado:** propuesto

---

## 0. Cómo leer este plan

El plan corta la v1 en **8 fases** y **38 PRs**. Cada PR es la unidad de trabajo:
entra a `main` solo, con CI en verde, y deja el sistema funcionando. Ninguna fase
depende de que la siguiente exista.

Tres reglas que valen para todos los PRs:

1. **Un PR no rompe `main`.** Si algo queda a medias, va detrás de una capacidad
   que nadie tiene todavía o de una ruta que nadie linkea.
2. **Migraciones aditivas.** Agregar columnas y tablas; renombrar y borrar son
   operaciones de dos pasos y se hacen aparte. El antecedente de CAIF —plan chico
   sin recuperación a un punto en el tiempo— justifica la cautela.
3. **El PR que agrega un módulo agrega también su test de `api.ts`.** No hay PR
   "los tests después". Con dedicación part-time, "después" es dentro de tres
   semanas y para entonces nadie recuerda las invariantes.

Las estimaciones están en **sesiones** (una sesión ≈ 3-4 h de trabajo real). A
8-10 h por semana eso es 2-3 sesiones semanales.

### Por qué este orden

El orden no es el del documento de diseño. Sigue tres criterios, en este orden de
prioridad:

- **Lo que tarda por calendario arranca primero.** DNS, reputación de envío y
  verificación de dominio no dependen de cuánto trabajes: dependen de cuántos días
  pasaron. Van en la semana 1 aunque el código que los usa llegue en la semana 12.
- **Lo irreversible antes que lo cosmético.** El kernel y las fronteras entre
  módulos son caros de cambiar tarde. La UI no.
- **Valor visible temprano.** Trabajando part-time y solo, tres meses sin nada que
  mostrar es el escenario en el que el proyecto muere. La web pública sale segunda,
  no última.

---

## 1. Las dos decisiones abiertas, resueltas

El diseño dejó dos decisiones sin cerrar. Ambas bloquean PRs de la fase 0, así que
se resuelven acá.

### 1.1 Autenticación: **better-auth**

**Elegido:** better-auth.

**Por qué:** en septiembre de 2025 el equipo de Auth.js anunció que el proyecto
pasa a modo mantenimiento bajo la conducción de Better Auth, con solo arreglos de
seguridad y críticos, y recomendó Better Auth para proyectos nuevos. Auth.js v5
sigue en beta desde hace cerca de dos años y no hay fecha de estable. Empezar un
proyecto de agosto de 2026 sobre una beta sin roadmap es aceptar deuda el primer
día.

Además encaja con lo que ya hay decidido: better-auth es dueño de sus tablas
(`usuario`, `sesion`, `cuenta`) y tiene adaptador de Drizzle, que es exactamente
la forma que el diseño ya asume en §4.1.

**Se descarta:** Auth.js v5 (beta indefinida, mantenimiento reducido); Clerk y
servicios equivalentes (costo por usuario y la identidad —la pieza que más
integrada tiene que estar con `persona`, `rol` y auditoría— viviendo afuera).

**Consecuencia para el plan:** el adaptador de Drizzle de better-auth genera sus
tablas. `persona.usuario_id` apunta ahí. Ver PR 3.1.

### 1.2 UI: **Tailwind CSS v4 + shadcn/ui**

**Elegido:** Tailwind CSS v4 con shadcn/ui, más Lucide para iconos.

**Por qué:** shadcn/ui no es una dependencia sino un generador — copia el código
del componente a tu repo y a partir de ahí es tuyo. Para un proyecto que va a vivir
años con mantenimiento part-time, eso elimina la clase de problema más molesta:
quedarse trabado en una versión de una librería de componentes que dejó de
mantenerse o que rompió la API. El costo es que las actualizaciones no llegan
solas; a esta escala es un costo barato.

**Se descarta:** MUI y Mantine (buenos, pero el sistema visual es de ellos y
salirse cuesta); construir todo a mano (los componentes accesibles —combobox,
dialog, date picker— son mucho más trabajo del que parecen).

**Nota de alcance:** las tres superficies comparten los primitivos pero **no el
layout ni la densidad**. `/app` es denso, con tablas y atajos. `/portal` es amplio
y explicativo: el cliente entra una vez por semana y no aprende la herramienta. `/`
no comparte nada más que la tipografía y la paleta.

---

## 2. Mapa de fases

| # | Fase | PRs | Sesiones | Qué queda funcionando al terminar |
|---|---|---|---|---|
| 0 | Cimientos | 5 | 6-8 | Repo, CI con frontera de módulos, base de datos, deploy vacío en staging |
| 1 | Web pública | 4 | 6-8 | `miragesoftware.com.ar` en línea, indexable, con contenido real |
| 2 | Kernel — infraestructura | 4 | 7-9 | Eventos, auditoría, permisos y las tres superficies con sus reglas de acceso |
| 3 | Kernel — identidad y organigrama | 6 | 12-15 | Login, personas, y el organigrama de Mirage cargado y navegable |
| 4 | Clientes | 4 | 6-8 | Los 2 clientes reales cargados, con contactos e historial |
| 5 | Proyectos y tareas | 5 | 10-12 | Proyectos con progreso real y actividad de GitHub |
| 6 | Notificaciones | 3 | 5-6 | Mails saliendo, con reintentos y visibilidad de fallas |
| 7 | Solicitudes y portal | 7 | 14-17 | El flujo completo de solicitud a proyecto, con clientes adentro |
| | **Total** | **38** | **66-83** | |

**Traducción a calendario:** 66-83 sesiones a 2-3 por semana son **22 a 42 semanas**.
Con la dispersión propia del trabajo part-time, planificar sobre **9 meses** y
tratar los 6 como el escenario optimista.

Eso es mucho tiempo sin que la plataforma esté completa, y es la razón del orden:
al terminar la **fase 1** (mes 1) Mirage ya tiene cara pública, y al terminar la
**fase 5** (mes 5-6) el equipo ya trabaja adentro. El portal —lo que cambia la
relación con el cliente— es lo último porque es lo que más depende de todo lo
demás.

### Dependencias entre fases

```
0 ─┬─> 1 (web pública, independiente del resto)
   └─> 2 ─> 3 ─┬─> 4 ─> 5 ─┐
               │           ├─> 7
               └─> 6 ──────┘
```

La fase 1 puede intercalarse en cualquier momento; está primera por el DNS y
porque conviene tener algo en línea. Las fases 4→5 y 6 son paralelizables si
alguna vez entra una segunda persona.

---

## 3. Semana 0 — lo que no es código y arranca ya

Estas tareas no producen commits pero bloquean fases enteras por calendario. Van
antes que el PR 0.1.

| # | Tarea | Por qué ahora | Bloquea |
|---|---|---|---|
| S0.1 | Apuntar el DNS de `miragesoftware.com.ar` y crear la cuenta de Resend | La verificación de dominio y la propagación tardan días, y la reputación de envío se construye con el tiempo | Fase 1, Fase 6 |
| S0.2 | Cargar SPF, DKIM y DMARC (los dicta Resend al verificar) | Sin esto los mails van a spam en silencio, y eso no se descubre: se sufre | Fase 6 |
| S0.3 | Configurar `miragesoftware.online` con `noindex` y `miragesoftware.store` con 301 | Que Google no indexe staging antes de que exista el canónico | Fase 1 |
| S0.4 | Recordatorio de renovación de los tres dominios | Perder el canónico tira abajo sitio y correo el mismo día | — |
| S0.5 | Crear el token fino de organización de GitHub, solo lectura | Es el permiso que hay que pedir y aprobar, no el código | Fase 5 |
| S0.6 | Crear la base de datos PostgreSQL en Render y guardar la `DATABASE_URL` | Sin base no hay deploy que probar | Fase 0 |

**Ninguna de estas tarda más de 30 minutos, y todas tardan días en surtir efecto.**
Hacerlas en una sola sesión al principio.

---

## 4. Fase 0 — Cimientos

**Objetivo:** que exista un repositorio donde escribir el dominio sea lo único que
falte. Al final de la fase hay una aplicación vacía corriendo en staging con base
de datos conectada y CI que rechaza los cruces de frontera.

**Duración:** 6-8 sesiones.

### PR 0.1 — Esqueleto de Next.js y estructura de carpetas
*1-2 sesiones*

Next.js (App Router) + TypeScript en modo estricto, pnpm, Prettier y ESLint base.
La estructura de carpetas queda definida acá y no se discute más:

```
src/
  app/
    (publico)/          → /
    (interno)/app/      → /app
    (portal)/portal/    → /portal
  kernel/
    identidad/ organigrama/ permisos/ auditoria/ eventos/
  modules/
    <nombre>/ module.ts schema.ts api.ts events.ts permissions.ts ui/ internal/
  db/
    schema.ts migrations/ client.ts
```

**Entregable:** `pnpm dev` levanta las tres rutas con un layout vacío cada una.

**Criterio de aceptación:** `pnpm build` y `pnpm lint` pasan. La carpeta `modules/`
tiene un `README.md` con el contrato de módulo copiado del diseño §5.

> **Nota de alcance.** "Nada en común con los proyectos anteriores" aplica a la
> estructura de carpetas, no a las tecnologías. Reutilizar TypeScript, Drizzle y
> PostgreSQL es correcto; copiar la organización de CAIF no.

### PR 0.2 — Frontera de módulos con ESLint, bloqueante en CI
*1 sesión*

`no-restricted-imports` con la regla: un archivo dentro de `src/modules/<A>/` no
puede importar de `src/modules/<B>/` salvo `src/modules/<B>/api`. Tampoco puede
importar de `src/kernel/<X>/internal/`.

GitHub Actions corriendo `lint`, `typecheck`, `test` y `build` en cada PR, con
merge bloqueado si falla.

**Criterio de aceptación:** el PR incluye **dos módulos de juguete** donde uno
importa lo prohibido del otro, y el commit muestra el CI en rojo. Después se
borran. Una regla que nunca se vio fallar no está probada.

> Este PR es el más importante de la fase. Sin bloqueo automático, en seis meses
> queda un monolito enredado con carpetas prolijas — el modo de fracaso
> característico de esta arquitectura, y la única defensa efectiva es mecánica.

### PR 0.3 — Drizzle, PostgreSQL y migraciones
*1-2 sesiones*

Cliente de Drizzle, `docker-compose.yml` con PostgreSQL para desarrollo local,
`drizzle-kit` configurado, y los scripts `db:generate`, `db:migrate`, `db:seed`.

La convención de nombres queda fijada acá: tablas en `snake_case` singular, las de
un módulo prefijadas con el nombre del módulo (`clientes_cliente`,
`proyectos_tarea`), las del kernel sin prefijo (`persona`, `nodo`).

**Criterio de aceptación:** una migración de prueba con una tabla `ping` corre en
local y en staging, y se revierte.

### PR 0.4 — Deploy a staging
*1 sesión*

Dockerfile, servicio web en Render apuntando a `miragesoftware.online`, variables
de entorno (`DATABASE_URL`, `TZ=America/Argentina/Buenos_Aires`), migraciones
corriendo en el arranque, y `noindex` en toda la superficie de staging.

**Criterio de aceptación:** un push a `main` deja el cambio en línea sin
intervención manual, y `robots.txt` de staging bloquea todo.

> **Desplegar en la semana 2, no en el mes 6.** Los problemas de despliegue no
> desaparecen por postergarlos: se acumulan y aparecen todos juntos el día que hay
> apuro. Además, CAIF está en producción en el mismo Render y es frágil: conviene
> descubrir los conflictos de configuración ahora. Recordatorio: **CAIF solo se
> toca entre 21:00 y 08:00.**

### PR 0.5 — Andamiaje de tests
*1 sesión*

Vitest para unitarias. Para integración, un PostgreSQL real en un contenedor
efímero con la base migrada y truncada entre tests — **no un doble**. Las
invariantes del organigrama viven en índices de la base; un mock no las prueba y
un test que no las prueba da falsa confianza.

**Criterio de aceptación:** `pnpm test` corre en local y en CI, con un test de
integración que verifica que un índice único rechaza el duplicado.

---

## 5. Fase 1 — Web pública

**Objetivo:** que exista un lugar al que dirigir a alguien que pregunta qué es
Mirage. Es el primer objetivo del diseño y el más barato de cumplir.

**Duración:** 6-8 sesiones. **Depende de:** fase 0, S0.1, S0.3.

> **Por qué acá y no al final.** No depende del kernel: el sitio se lee sin sesión.
> Lo único que necesita del módulo `contenido` es leer filas. El panel para editar
> esas filas llega en la fase 3, cuando `/app` exista; hasta entonces el contenido
> se carga por seed. Eso adelanta meses el sitio a cambio de escribir un seed —
> buen negocio.

### PR 1.1 — Módulo `contenido`: schema y api
*1 sesión*

Las tres tablas del diseño §6.1 (`pagina`, `servicio`, `caso`), su `api.ts` de solo
lectura, sus capacidades declaradas en `permissions.ts` (todavía sin nadie que las
tenga), y un seed con el contenido real de Mirage.

`caso.cliente_id` queda nullable y **por defecto el caso no nombra al cliente**.
Nombrarlo requiere autorización explícita del cliente, y esa autorización se pide
fuera del sistema.

**Criterio de aceptación:** tests de integración del `api.ts` contra PostgreSQL.

### PR 1.2 — Páginas públicas
*2 sesiones*

Home, servicios, casos y contacto, con renderizado estático y revalidación. El
cuerpo de `pagina` es markdown y se renderiza sanitizado.

**Criterio de aceptación:** las cuatro rutas se generan estáticamente y el HTML
sale del build, no del request.

### PR 1.3 — Sistema visual base
*2 sesiones*

Tailwind v4, los primitivos de shadcn/ui que use el sitio, tipografía, paleta y
tokens. Es el PR que fija el lenguaje visual que después heredan `/app` y
`/portal`.

**Criterio de aceptación:** la paleta pasa contraste AA, y hay una página interna
`/dev/ui` (bloqueada en producción) que muestra los primitivos.

### PR 1.4 — Producción, SEO y dominio canónico
*1-2 sesiones*

Promover el servicio al canónico `miragesoftware.com.ar`, 301 desde `.store`,
`sitemap.xml`, `robots.txt`, metadatos Open Graph, y datos estructurados de
organización.

**Criterio de aceptación:** el sitio responde en el canónico con TLS, `.store`
redirige con 301, `.online` sigue con `noindex`, y ninguna URL sirve el mismo
contenido en dos dominios.

> **Hito: objetivo 1 del diseño cumplido, mes 1.**

---

## 6. Fase 2 — Kernel, infraestructura

**Objetivo:** las piezas del kernel que no tienen UI y que todo lo demás asume.
Van antes que identidad porque identidad ya las usa: el login se audita.

**Duración:** 7-9 sesiones. **Depende de:** fase 0.

### PR 2.1 — Bus de eventos
*1-2 sesiones*

Bus en proceso, síncrono y tipado. Registro de tipos de evento, publicación,
suscripción por nombre. El publicador no conoce a los suscriptores.

Decisión de comportamiento que hay que tomar acá: **si un suscriptor falla, el
publicador no se entera**. El error se registra y se sigue. Si la falla del
suscriptor pudiera invalidar la operación del publicador, entonces no es un evento:
es una llamada a `api.ts`.

**Criterio de aceptación:** un test donde un suscriptor lanza una excepción y la
transacción del publicador igual confirma.

> Sin cola externa en v1: con este volumen sería infraestructura sin beneficio. El
> punto de extensión queda —si un día hace falta, se reemplaza la implementación
> del bus sin tocar a los módulos.

### PR 2.2 — Auditoría
*1-2 sesiones*

`evento_auditoria` append-only y el helper que los módulos usan para registrar.

La parte que importa: **el rol de aplicación de PostgreSQL no tiene `UPDATE` ni
`DELETE` sobre esa tabla**, otorgado por migración. Una auditoría editable no es
auditoría, y confiar en que el código de aplicación nunca la edite es confiar en
que nadie se equivoque nunca.

**Criterio de aceptación:** un test de integración que intenta un `UPDATE` con el
rol de aplicación y verifica que la base lo rechaza.

### PR 2.3 — Permisos
*2 sesiones*

`rol`, `capacidad`, `rol_capacidad`, `persona_rol`. Cada módulo declara sus
capacidades en `permissions.ts` y el kernel las registra al arrancar, sin
conocerlas de antemano. Función de evaluación y helper `requiere(capacidad)` para
usar en `api.ts`.

**Criterio de aceptación:** arrancar con un módulo nuevo registra sus capacidades
sin tocar el kernel. Una capacidad que un módulo dejó de declarar queda marcada
como huérfana, **no se borra sola** — borrarla borraría en cascada quién la tenía.

### PR 2.4 — Las tres superficies y sus reglas de acceso
*2-3 sesiones*

Layouts separados, navegación por superficie, y el middleware que aplica el
diseño §3:

| Superficie | Regla |
|---|---|
| `/` | Sin sesión |
| `/app` | Sesión + `persona.tipo = 'empleado'` |
| `/portal` | Sesión + `persona.tipo = 'contacto_cliente'`, restringida a su cliente |

**Criterio de aceptación:** tests de las tres reglas, incluida la que importa: un
`contacto_cliente` que pide una ruta de `/app` recibe 404, **no 403**. Un 403 le
confirma que la ruta existe.

---

## 7. Fase 3 — Kernel: identidad y organigrama

**Objetivo:** la fase central. Al terminar, el organigrama de Mirage existe, está
cargado con datos reales y es navegable. Es el momento en que la plataforma empieza
a crear la estructura de la empresa en vez de describirla.

**Duración:** 12-15 sesiones. **Depende de:** fase 2.

### PR 3.1 — better-auth y el modelo `persona`
*2-3 sesiones*

better-auth con adaptador de Drizzle, dueño de `usuario`, `sesion` y `cuenta`.
`persona` como modelo de dominio según §4.1, con `usuario_id` nullable —una persona
puede existir antes de tener acceso, por ejemplo un contacto de cliente al que
todavía no se invitó.

Teléfono en **E.164** (`+5491122334455`), validado al escribir. Normalizar después
variantes de escritura es trabajo sucio y evitable, y es requisito de cualquier
integración futura con WhatsApp.

Método de acceso de v1: email y contraseña, con recuperación. OAuth queda afuera.

**Criterio de aceptación:** alta, login, logout y recuperación funcionando; el login
queda registrado en auditoría.

### PR 3.2 — ABM de personas en `/app`
*1-2 sesiones*

Listado, alta, edición y baja lógica. Invitar a una persona a tener acceso es una
acción explícita y separada del alta.

**Criterio de aceptación:** se puede crear una persona sin usuario y darle acceso
después.

### PR 3.3 — Organigrama: schema e invariantes
*2-3 sesiones*

`nodo` y `asignacion` según §4.2, con las tres invariantes impuestas **en la base**:

| Invariante | Mecanismo |
|---|---|
| Exactamente dos raíces | Índice único parcial sobre `raiz` donde `padre_id IS NULL` |
| Un titular vigente por nodo | Índice único parcial sobre `nodo_id` donde `es_titular AND hasta IS NULL` |
| Sin ciclos | Validación en `api.moverNodo` |

**El anillo se calcula, no se guarda** — profundidad derivada con `WITH RECURSIVE`.
Guardarlo garantiza desincronización al mover un nodo, y con 30-100 nodos el costo
de la consulta es despreciable.

**Criterio de aceptación:** tests de integración que intentan violar cada
invariante y verifican el rechazo.

### PR 3.4 — API del árbol
*2 sesiones*

`crearNodo`, `moverNodo`, `archivarNodo`, `subarbol`, `ancestros`, `anillo`.

`moverNodo` rechaza con `Validacion` si el nuevo padre pertenece al subárbol del
nodo, **antes de tocar la base**. `archivarNodo` rechaza con `Conflicto` si hay
trabajo abierto colgando, y devuelve la lista de qué reasignar primero.

**Los nodos se archivan, no se borran** — hay trabajo histórico colgando de ellos.

**Criterio de aceptación:** tests unitarios de la lógica de árbol, incluido el caso
de mover un nodo a su propio descendiente.

### PR 3.5 — Visualización circular
*3-4 sesiones*

El dibujo por anillos concéntricos, en SVG. Dos jefaturas al centro, un anillo por
nivel de profundidad, `orden` define la posición angular. Click en un nodo abre su
detalle: descripción, titular, ocupantes, nodos hijos.

Es el PR más caro de la fase y el más visible. Presupuestar que el primer intento
de layout no va a quedar bien.

**Criterio de aceptación:** el árbol completo se lee de un vistazo en pantalla de
escritorio. En móvil hay una **vista de lista jerárquica** — un organigrama radial
en 390px de ancho no se lee, y forzarlo es peor que no tenerlo.

### PR 3.6 — Edición y asignaciones
*2-3 sesiones*

Crear, renombrar, mover (con arrastre o selector de padre) y archivar nodos.
Asignar personas a nodos con vigencia (`desde`/`hasta`) y marcar titular.

La pantalla de una persona muestra **cuántos nodos ocupa**: ver que alguien carga
cuatro es señal de sobrecarga, y ese es medio motivo de que el organigrama sea de
responsabilidades y no de personas.

**Criterio de aceptación:** se puede reorganizar el árbol completo desde la UI sin
tocar SQL, y el historial de asignaciones sobrevive a la reorganización.

### Tarea no-código: cargar el organigrama real
*1 sesión, con el equipo*

Sentarse a definir los nodos reales de Mirage y cargarlos.

> **Empezar con pocos nodos reales.** El riesgo acá no es quedarse corto: es
> diseñar veinte nodos anticipando una empresa de treinta personas y terminar con
> una estructura que nadie usa porque no describe el trabajo de nadie. Dejar que
> crezca por necesidad demostrada. Reorganizar es barato: los nodos se archivan y
> el historial de asignaciones queda.

> **Hito: objetivo 2 del diseño cumplido.** La estructura existe y es navegable.

---

## 8. Fase 4 — Clientes

**Duración:** 6-8 sesiones. **Depende de:** fase 3.

### PR 4.1 — Módulo `clientes`: schema y api
*2 sesiones*

`cliente`, `contacto` e `interaccion` según §6.2. Capacidades declaradas. Evento
`cliente.creado` publicado.

**La dualidad nodo/persona**, que se repite en todo el sistema: `nodo_responsable_id`
dice qué responsabilidad responde por la cuenta; `contacto_directo_id` es la cara
concreta que el cliente ve en su portal, con nombre, mail y teléfono.

**Criterio de aceptación:** no se puede crear un cliente sin nodo responsable ni sin
contacto directo. Ambos son obligatorios, y ese es el punto.

### PR 4.2 — Listado y ficha de cliente
*2 sesiones*

**Criterio de aceptación:** la ficha muestra nodo responsable, contacto directo,
contactos del cliente y últimas interacciones.

### PR 4.3 — Contactos e interacciones
*1-2 sesiones*

Alta de contactos (que crea la `persona` de tipo `contacto_cliente` si no existe) y
registro manual de interacciones.

**Criterio de aceptación:** un contacto se crea sin usuario y sin acceso al portal;
invitarlo es una acción aparte, de la fase 7.

### PR 4.4 — Cargar los clientes reales
*1 sesión*

Los 2 clientes activos, con sus contactos y el historial de interacciones que valga
la pena recuperar.

---

## 9. Fase 5 — Proyectos y tareas

**Duración:** 10-12 sesiones. **Depende de:** fase 4, S0.5.

### PR 5.1 — Módulo `proyectos`: schema y api
*2 sesiones*

`proyecto` y `tarea` según §6.3. Eventos `proyecto.creado`, `proyecto.estado_cambiado`,
`tarea.asignada`.

**La tarea lleva nodo obligatorio y persona opcional.** El nodo dice qué
responsabilidad es dueña del trabajo; la persona, quién lo hace hoy. Con solo
persona, cuando esa persona se va la tarea queda huérfana y nadie sabe a qué área
pertenecía. Con solo nodo, nadie sabe a quién preguntarle. Hacen falta ambos.

### PR 5.2 — Pantallas de proyectos
*2-3 sesiones*

Listado por estado, ficha con tareas, y el cálculo de progreso.

**Progreso = `tareas hechas / tareas totales`.** Alguien declaró que algo está
terminado; es la única definición que no se puede falsear sin querer.

### PR 5.3 — Tablero de tareas
*2-3 sesiones*

Vista por estado, filtros por nodo y por persona, y una vista "mis tareas".

**Criterio de aceptación:** un empleado ve en una pantalla todo lo pendiente de los
nodos que ocupa.

### PR 5.4 — Repositorios y snapshot
*2 sesiones*

`proyecto_repositorio` y `repositorio_snapshot`. Job que refresca **cada 30 minutos**
con el token fino de organización, corriendo en proceso con un scheduler.

**Nunca en el request.** Consultar la API de GitHub al cargar la página significa
comerse el rate limit, sumar latencia, y que el ERP deje de cargar el día que
GitHub tenga un incidente.

**Criterio de aceptación:** si la API de GitHub falla, el error queda en
`repositorio_snapshot.error` y la pantalla muestra los datos viejos con su fecha de
actualización. No una pantalla en blanco, no un error.

### PR 5.5 — Actividad, separada del progreso
*1-2 sesiones*

Commits, PRs y contribuyentes en la ficha del proyecto, **rotulados como actividad**
y visualmente separados de la barra de progreso.

> Un proyecto puede tener 200 commits y estar estancado, o resolverse en 3. Una
> barra de progreso alimentada por commits es un número que miente, y encima induce
> decisiones con él.

**Criterio de aceptación:** ningún dato de repositorio entra en el cálculo de
progreso. Esto se verifica leyendo el código, no la pantalla.

> **Hito: objetivo 3 del diseño cumplido.** El equipo ya puede trabajar adentro.
> A partir de acá conviene usarlo de verdad antes de seguir: los problemas que
> aparezcan en la fase 5 son más baratos de arreglar que los de la 7.

---

## 10. Fase 6 — Notificaciones

**Duración:** 5-6 sesiones. **Depende de:** fase 2, S0.1, S0.2.

> **Va antes que el portal, no después.** Si un cliente carga una solicitud y nadie
> se entera, en dos semanas están todos de vuelta en WhatsApp y la plataforma queda
> como un cementerio de datos. Las notificaciones no son mejora: son requisito.

### PR 6.1 — Módulo `notificaciones`: tabla y worker
*2 sesiones*

`notificacion` según §6.5. Integración con Resend. Worker que toma las pendientes,
con **hasta 5 intentos y backoff exponencial** (1, 2, 4, 8, 16 minutos); después
pasa a `fallida`.

**Los mails no se envían dentro del request.** Se escribe la fila y el worker la
toma. Si el proveedor falla, se ve y se reintenta, en vez de perder el aviso en
silencio.

**Criterio de aceptación:** con la API key inválida, la notificación queda
`pendiente` con `intentos` creciendo y termina en `fallida` — nunca se pierde.

### PR 6.2 — Plantillas y suscripciones
*2 sesiones*

Plantillas de mail y la suscripción a los eventos de v1. El módulo **no conoce a los
otros módulos**: solo nombres de eventos y sus payloads.

Eventos de v1: `cliente.creado` · `solicitud.creada` · `solicitud.aceptada` ·
`solicitud.rechazada` · `solicitud.mensaje_agregado` · `proyecto.creado` ·
`proyecto.estado_cambiado` · `tarea.asignada` · `tarea.vencida`

(`solicitud.*` quedan suscritas y sin disparar hasta la fase 7.)

**Criterio de aceptación:** `notificaciones` no importa nada de `modules/`, ni
siquiera un `api.ts`. Si necesita datos que el evento no trae, **el payload del
evento está mal diseñado**.

### PR 6.3 — Pantalla de administración
*1-2 sesiones*

Listado de notificaciones fallidas con su error y un botón de reintento manual.

**Criterio de aceptación:** una notificación fallida es visible sin abrir la base de
datos. Una falla que solo se ve en la base es una falla que nadie ve.

---

## 11. Fase 7 — Solicitudes y portal

**Objetivo:** cerrar el flujo principal del diseño §7 y meter a los clientes
adentro. Es la fase con más superficie de riesgo del proyecto.

**Duración:** 14-17 sesiones. **Depende de:** fases 5 y 6.

### PR 7.1 — Pruebas de aislamiento del portal
*2 sesiones*

**Este PR va primero y sus tests fallan al mergearse.** Es deliberado: definen el
contrato antes de que exista la funcionalidad que tienen que restringir.

Un contacto del cliente A no accede a ningún dato del cliente B, por ninguna ruta:
ni por parámetro de URL, ni por id en el cuerpo de una request, ni por un endpoint
de listado sin filtro.

**La regla que lo hace posible:** toda consulta del portal se filtra por el
`cliente_id` **derivado de la sesión**, nunca de un parámetro de la URL. Se
implementa como un helper obligatorio, no como una convención.

**Criterio de aceptación:** los tests existen, están marcados como pendientes de
implementación, y el PR 7.6 no puede mergearse hasta que estén todos en verde.

> Es la superficie de mayor riesgo del sistema. Un cliente que ve datos de otro
> cliente no es un bug: es el fin de la relación comercial con los dos.

### PR 7.2 — Acceso al portal
*2 sesiones*

Invitación por mail a un contacto de cliente, alta de contraseña, y el layout del
portal — amplio y explicativo, no una copia de `/app`.

**Criterio de aceptación:** el contacto invitado entra y ve solo su cliente.

### PR 7.3 — Módulo `solicitudes`: schema y api
*2 sesiones*

`solicitud` y `mensaje` según §6.4. Eventos `solicitud.creada`, `solicitud.aceptada`,
`solicitud.rechazada`, `solicitud.mensaje_agregado`.

`mensaje.visible_para_cliente` permite discutir internamente en el mismo hilo. Sin
eso, la conversación interna vuelve a WhatsApp y se pierde el contexto — que es
exactamente lo que se quiere evitar.

### PR 7.4 — Solicitudes en `/app`
*2-3 sesiones*

Bandeja por estado, ficha con el hilo de mensajes, y el interruptor de visibilidad
al escribir.

**Criterio de aceptación:** el interruptor de visibilidad es **imposible de
confundir**. Un mensaje interno que se filtra al cliente es el peor error de esta
fase, y es un error de interfaz, no de lógica. Los mensajes internos van con fondo
distinto y etiqueta explícita.

### PR 7.5 — Solicitudes en `/portal`
*2-3 sesiones*

Alta de solicitud, listado, y el hilo filtrado a `visible_para_cliente = true`.

**Criterio de aceptación:** el payload de la respuesta **no contiene** los mensajes
internos. Filtrarlos en el render es insuficiente: quedan en el HTML.

### PR 7.6 — El flujo de solicitud a proyecto
*2 sesiones*

Aceptar una solicitud publica `solicitud.aceptada`; **`proyectos` lo escucha y crea
el proyecto**, sin conocer al módulo `solicitudes` — solo el nombre del evento y su
payload. `solicitudes` guarda el `proyecto_id` devuelto.

**Criterio de aceptación:** un test extremo a extremo del flujo completo, y una
verificación de que `modules/proyectos/` no importa nada de `modules/solicitudes/`.

> Este es el desacople ganándose el lugar: agregar `facturacion` más adelante
> —escuchando `proyecto.terminado`— no toca nada de lo existente.

### PR 7.7 — Vista de proyectos en el portal
*2 sesiones*

El cliente ve sus proyectos con **solo el porcentaje de progreso**.

No ve: commits, PRs, contribuyentes, tareas individuales, el organigrama, nodos,
asignaciones, mensajes internos ni datos de otros clientes. Ve "Mirage" y su
contacto directo.

**Criterio de aceptación:** las pruebas del PR 7.1 pasan todas. Además, una revisión
manual de cada endpoint del portal verificando que la respuesta no trae campos de
más — el filtrado se hace en el `api.ts`, no en el componente.

> **La estructura interna es de Mirage.** Filtrarla al portal convierte una
> herramienta de gestión en material de negociación.

---

## 12. Puesta en marcha

No es una fase de código. Es lo que hay que hacer para que la plataforma se use.

| # | Tarea | Cuándo |
|---|---|---|
| M.1 | Cargar el organigrama real y las asignaciones | Fin de fase 3 |
| M.2 | Migrar los 2 clientes con sus contactos e historial | Fin de fase 4 |
| M.3 | Cargar los proyectos en curso con sus tareas | Fin de fase 5 |
| M.4 | Monitorear entregabilidad las primeras dos semanas de envío | Fin de fase 6 |
| M.5 | **Decisión explícita de la empresa: todo va por el portal** | Antes de invitar clientes |
| M.6 | Invitar a los contactos de los 2 clientes, de a uno | Fin de fase 7 |
| M.7 | Revisar a las 4 semanas: qué se usa, qué no, qué volvió a WhatsApp | Fase 7 + 1 mes |

> **M.5 no es una formalidad.** El riesgo más serio del proyecto no es técnico: es
> que el portal no se adopte y todos vuelvan a WhatsApp. Las notificaciones ayudan,
> pero **la herramienta sola no cambia el hábito.** Hace falta que Mirage decida
> —y le avise al cliente— que las solicitudes se reciben por el portal. Si esa
> decisión no se toma, las fases 6 y 7 fueron trabajo perdido.

---

## 13. Riesgos del plan

Distintos de los riesgos del diseño §12: estos son de la ejecución.

| Riesgo | Señal temprana | Mitigación |
|---|---|---|
| **El proyecto se apaga por falta de tiempo** | Dos semanas sin commits | Las fases 1 y 5 son cortes útiles: si el proyecto se detiene ahí, lo entregado igual sirve. Ningún PR deja el sistema a medias |
| **La visualización circular se come el presupuesto** | El PR 3.5 pasa de 5 sesiones | Es la parte más divertida y por eso la más peligrosa. Un árbol jerárquico feo pero funcional cumple el objetivo; el círculo puede mejorarse en la v1.1 |
| **Sobre-diseño del organigrama antes de usarlo** | Más de 15 nodos con 5 empleados | Cargar solo lo que describe trabajo que hoy hace alguien |
| **La frontera entre módulos se relaja** | Un `eslint-disable` en un import | El PR 0.2 lo bloquea. Si aparece un `disable`, es una señal de que dos módulos están mal separados — el arreglo es rediseñar el límite, no silenciar la regla |
| **Las estimaciones se corren 2x** | Fase 3 más allá del mes 5 | Es lo normal en trabajo part-time. El plan tiene el orden bien puesto: correrse significa que el portal llega más tarde, no que lo entregado sirva menos |
| **Se agregan funciones fuera de alcance** | Cualquier PR que mencione horas o facturación | §14 del diseño: presupuestos, facturación, registro de horas, multi-empresa, webhooks de GitHub, app móvil y portal de proveedores están afuera. Entran en v2, cuando el resto esté en uso real |

---

## 14. Para agregar al registro de decisiones

Las dos decisiones de la §1 de este plan, listas para copiar a
`mirage-empresa/03-decisiones/registro-de-decisiones.md`:

```markdown
## 2026-08-18 · Autenticación con better-auth

**Decisión:** better-auth como librería de autenticación, con adaptador de Drizzle.

**Por qué:** en septiembre de 2025 Auth.js pasó a modo mantenimiento bajo la
conducción de Better Auth —solo arreglos de seguridad y críticos— y su propio
equipo recomienda Better Auth para proyectos nuevos. Auth.js v5 lleva cerca de dos
años en beta sin fecha de estable.

**Se descartó:** Auth.js v5 (beta indefinida); Clerk y equivalentes (costo por
usuario, y la identidad viviendo afuera del sistema que más integrada la necesita).

---

## 2026-08-18 · UI con Tailwind CSS v4 y shadcn/ui

**Decisión:** Tailwind CSS v4 con shadcn/ui e iconos de Lucide.

**Por qué:** shadcn/ui copia el código del componente al repo en vez de instalarlo.
Para un proyecto que va a vivir años con mantenimiento part-time, eso elimina el
riesgo de quedar trabado en una librería abandonada o que rompió su API. El costo
—las mejoras no llegan solas— es barato a esta escala.

**Se descartó:** MUI y Mantine (el sistema visual es de ellos y salirse cuesta);
componentes propios (los accesibles son mucho más trabajo del que parecen).

**Alcance:** las tres superficies comparten primitivos, no layout ni densidad.
`/app` es denso; `/portal` es amplio y explicativo; `/` no comparte más que
tipografía y paleta.
```
