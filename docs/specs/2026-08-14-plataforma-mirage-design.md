# Plataforma Mirage — diseño

**Fecha:** 14 de agosto de 2026
**Estado:** aprobado para planificación

---

## 1. Contexto

Mirage desarrolla software a medida. En agosto de 2026 son 4-5 empleados con 2
clientes activos y buscan crecer.

El problema no es la falta de una herramienta: es la **falta de estructura
formal**. Se manifiesta en tres frentes:

1. **Hacia afuera** — no hay lugar al que dirigirse para conocer la empresa.
2. **Hacia adentro** — no hay flujos definidos ni control sobre la operación.
3. **Hacia el cliente** — la relación va por mail, llamada, WhatsApp o en
   persona, sin trazabilidad.

**La apuesta central:** la plataforma no modela la estructura existente, **la
crea**. Mirage va a adoptar después la estructura que el software define. Esto
invierte la relación habitual entre organización y sistema, y tiene una
consecuencia directa: las decisiones sobre el organigrama son decisiones de
negocio y no se cambian por conveniencia de implementación.

## 2. Objetivos

1. Dar a Mirage una cara pública creíble.
2. Imponer una estructura organizacional explícita y navegable.
3. Reemplazar el canal informal con clientes por uno formal y trazable.
4. Sostener crecimiento sin rediseño: agregar capacidades debe ser aditivo.

### No-objetivos

- No es un producto vendible a terceros. Es a medida para Mirage. **Sin
  multi-empresa**, ni ahora ni previsto.
- No reemplaza herramientas de desarrollo. GitHub sigue siendo GitHub.
- No busca completitud de ERP. Sólo lo que se va a usar.

## 3. Decisiones de arquitectura

| Decisión | Elección | Descartado |
|---|---|---|
| Estructura | Monolito modular | Monorepo multi-app; microservicios |
| Framework | Next.js (App Router) | TanStack Start; NestJS + React |
| Lenguaje | TypeScript | — |
| ORM / BD | Drizzle / PostgreSQL | — |
| Paquetes | npm o pnpm | **Bun** (excluido explícitamente) |
| Hosting | Render | — |
| Dominios | Uno solo, rutas separadas | Subdominios |
| Mail | Resend | Amazon SES; SMTP propio |

Justificaciones completas en
`../../../mirage-empresa/03-decisiones/registro-de-decisiones.md`.

### Las tres superficies

Route groups de Next, un solo deploy, misma base de datos y sesión:

Dominio canónico: **`miragesoftware.com.ar`**. `miragesoftware.online` queda como
staging (`noindex`, acceso restringido) y `miragesoftware.store` redirige con 301.
El correo saliente usa únicamente el canónico.

| Superficie | Ruta | Acceso |
|---|---|---|
| Web pública | `/` | Sin sesión |
| Sistema interno | `/app` | Sesión + `persona.tipo = 'empleado'` |
| Portal de clientes | `/portal` | Sesión + `tipo = 'contacto_cliente'`, restringido a su cliente |

## 4. El kernel

Chico, estable, escrito una vez. Cinco piezas.

### 4.1 Identidad

La librería de autenticación es dueña de sus tablas (`usuario`, `sesion`,
`cuenta`). `persona` es el modelo de dominio y referencia al usuario:

```
persona
  id, nombre, apellido
  email            unique
  telefono         formato E.164, nullable
  tipo             'empleado' | 'contacto_cliente'
  usuario_id       FK usuario, unique, nullable
  activo, creado_en
```

`usuario_id` es nullable a propósito: una persona puede existir en el sistema
antes de tener acceso — un contacto de cliente al que todavía no se invitó.

El teléfono se guarda en **E.164** (`+5491122334455`). Normalizar después
variantes de escritura es un trabajo sucio y evitable, y es requisito de
cualquier integración futura con WhatsApp.

### 4.2 Organigrama

```
nodo
  id, nombre, descripcion
  padre_id      FK nodo, null sólo en las dos raíces
  raiz          'interno' | 'externo'
  orden         entero, para el dibujo
  activo, creado_en, archivado_en

asignacion
  id, persona_id, nodo_id
  es_titular    boolean
  desde, hasta  hasta = null significa vigente
```

**Las cuatro reglas** (detalle y justificación en
`../../../mirage-empresa/02-estructura/organigrama.md`):

1. Los nodos son **responsabilidades**, no personas. Relación N:M con persona.
2. **Un padre por nodo.** Árbol, no red.
3. **El anillo no confiere derechos.** La rama da autoridad; el anillo indica
   granularidad.
4. **Los permisos van aparte.**

**El anillo se calcula, no se guarda.** Es la profundidad en el árbol, derivada
con `WITH RECURSIVE`. Almacenarlo garantiza desincronización al mover un nodo.
Con 30-100 nodos el costo de la consulta es despreciable.

**Los nodos se archivan, no se borran.** Hay trabajo histórico colgando de ellos.

Invariantes, con su forma de garantizarlas:

| Invariante | Mecanismo |
|---|---|
| Exactamente dos raíces | Índice único parcial sobre `raiz` donde `padre_id IS NULL` |
| Un titular vigente por nodo | Índice único parcial sobre `nodo_id` donde `es_titular AND hasta IS NULL` |
| Sin ciclos | Validación en `api.moverNodo`: el nuevo padre no puede pertenecer al subárbol del nodo |

### 4.3 Permisos

```
rol             id, nombre, descripcion
capacidad       clave PK ('clientes.ver'), modulo, descripcion
rol_capacidad   rol_id, capacidad_clave
persona_rol     persona_id, rol_id
```

Cada módulo **declara** sus capacidades en `permissions.ts`. El kernel no las
conoce de antemano; las registra al arrancar.

### 4.4 Auditoría

```
evento_auditoria
  id, persona_id, accion, entidad, entidad_id
  datos      jsonb
  creado_en
```

Append-only. Sin update ni delete, y el rol de aplicación no tiene esos permisos
sobre la tabla. Una auditoría editable no es auditoría.

### 4.5 Eventos

Bus en proceso, síncrono y tipado. Los módulos publican y se suscriben por nombre
de evento, sin conocerse entre sí.

Sin cola externa en v1: con este volumen sería infraestructura sin beneficio. El
punto de extensión queda: si un día hace falta, se reemplaza la implementación
del bus sin tocar a los módulos.

## 5. Contrato de módulo

Todo módulo es una carpeta con forma fija:

```
modules/<nombre>/
  module.ts        manifiesto y registro
  schema.ts        sus tablas (prefijadas con el nombre del módulo)
  api.ts           ÚNICA superficie pública
  events.ts        qué publica y a qué se suscribe
  permissions.ts   capacidades que declara
  ui/              pantallas y entradas de navegación
  internal/        todo lo demás — privado
```

**La regla que sostiene la arquitectura:**

> Un módulo nunca importa de `modules/<otro>/` salvo `modules/<otro>/api`.

Se impone con la regla `no-restricted-imports` de ESLint y **falla el build en
CI**. No es una convención de buena voluntad: sin bloqueo automático, en seis
meses queda un monolito enredado con carpetas prolijas. Ese es el modo de fracaso
característico de esta arquitectura y la única defensa efectiva es mecánica.

Los módulos se comunican de dos formas y ninguna otra: llamando al `api.ts` del
otro, o publicando y escuchando eventos.

## 6. Módulos de v1

### 6.1 `contenido` — web pública

```
pagina     slug unique, titulo, cuerpo (markdown), publicada, actualizado_en
servicio   nombre, descripcion, orden, activo
caso       titulo, cliente_id nullable, resumen, publicado
```

Renderizado estático con revalidación. `caso` referencia `cliente` sólo si el
cliente autorizó aparecer; por defecto no.

### 6.2 `clientes`

```
cliente
  id, nombre, cuit, estado
  nodo_responsable_id    FK nodo
  contacto_directo_id    FK persona (empleado)
  creado_en

contacto
  id, cliente_id, persona_id, cargo, es_principal

interaccion
  id, cliente_id, persona_id
  tipo       'llamada' | 'mail' | 'reunion' | 'otro'
  fecha, resumen
```

**La dualidad nodo/persona**, que se repite en todo el sistema: el **nodo** dice
qué responsabilidad responde por la cuenta; el **contacto directo** es la cara
concreta que el cliente ve en su portal, con nombre, mail y teléfono.

### 6.3 `proyectos`

```
proyecto
  id, cliente_id, nombre, descripcion
  estado                 'propuesto' | 'activo' | 'pausado' | 'terminado' | 'cancelado'
  nodo_responsable_id    FK nodo
  fecha_inicio, fecha_fin_estimada, creado_en

tarea
  id, proyecto_id, titulo, descripcion
  estado                 'pendiente' | 'en_curso' | 'bloqueada' | 'hecha'
  nodo_responsable_id    FK nodo, OBLIGATORIO
  persona_asignada_id    FK persona, nullable
  vence_en, creado_en, completada_en

proyecto_repositorio
  id, proyecto_id, owner, repo, agregado_en

repositorio_snapshot
  repositorio_id PK
  commits_total, prs_abiertas, prs_cerradas, contribuyentes
  ultimo_commit_en, actualizado_en, error
```

**Por qué la tarea lleva nodo obligatorio y persona opcional:** el nodo dice qué
responsabilidad es dueña del trabajo; la persona, quién lo hace hoy. Con sólo
persona, cuando esa persona se va la tarea queda huérfana y nadie sabe a qué área
pertenecía. Con sólo nodo, nadie sabe a quién preguntarle. Hacen falta ambos.

**Progreso y actividad son cosas distintas y se muestran separadas.**

- **Progreso** = `tareas hechas / tareas totales`. Alguien declaró que algo está
  terminado. Es la única definición que no se puede falsear sin querer.
- **Actividad** = commits, PRs, contribuyentes. Se rotula como actividad.

Un proyecto puede tener 200 commits y estar estancado, o resolverse en 3. Una
barra de progreso alimentada por commits es un número que miente, y encima
induce decisiones con él.

**Integración con GitHub — nunca en el request.** Un job refresca
`repositorio_snapshot` **cada 30 minutos**; las pantallas leen sólo la tabla. Consultar la API de
GitHub al cargar la página significa comerse el rate limit, sumar latencia, y que
el ERP deje de cargar el día que GitHub tenga un incidente. Si el snapshot está
viejo o con error, se muestra igual con su fecha de actualización.

Autenticación contra GitHub: token fino de la organización en variable de
entorno. GitHub App y webhooks quedan fuera de v1.

**Qué ve el cliente:** sólo el porcentaje de progreso. Ni commits, ni PRs, ni
contribuyentes.

### 6.4 `solicitudes`

El módulo que reemplaza el WhatsApp.

```
solicitud
  id, cliente_id, creada_por_persona_id
  titulo, descripcion, tipo
  estado                 'recibida' | 'en_evaluacion' | 'aceptada' | 'rechazada'
  nodo_responsable_id    FK nodo
  proyecto_id            FK proyecto, null hasta que se acepta
  creado_en, resuelto_en

mensaje
  id, solicitud_id, persona_id, cuerpo
  visible_para_cliente   boolean
  creado_en
```

`visible_para_cliente` permite discutir internamente en el mismo hilo. Sin eso,
la conversación interna vuelve a WhatsApp y se pierde el contexto — que es
exactamente lo que se quiere evitar.

### 6.5 `notificaciones`

```
notificacion
  id, destinatario_persona_id
  plantilla, datos jsonb
  estado       'pendiente' | 'enviada' | 'fallida'
  intentos, error
  creado_en, enviado_en
```

Se suscribe a eventos de otros módulos sin conocerlos: sólo nombres de eventos.

**Los mails no se envían dentro del request.** Se escribe la fila y un worker la
toma. Si el proveedor falla, se ve y se reintenta, en vez de perder el aviso en
silencio. **Hasta 5 intentos con backoff exponencial** (1, 2, 4, 8, 16 minutos);
después la notificación pasa a `fallida` y queda visible para un administrador.

Envío vía Resend. La parte difícil no es el código —son unas pocas líneas— sino
la **entregabilidad**: sin SPF, DKIM y DMARC en el DNS del dominio propio, los
mails van a spam silenciosamente. Hay que comprar el dominio temprano: la
propagación y la reputación de envío tardan días en asentarse.

**Las notificaciones no son opcional en v1.** Si un cliente carga una solicitud y
nadie se entera, en dos semanas están todos de vuelta en WhatsApp y la
plataforma queda como un cementerio de datos.

## 7. Flujo principal: de solicitud a proyecto

1. El contacto del cliente crea una solicitud en `/portal`.
2. `solicitudes` publica `solicitud.creada`.
3. `notificaciones` lo escucha y encola un mail al titular del nodo responsable.
4. Un empleado la evalúa en `/app`, conversa por el hilo de mensajes, y la acepta.
5. `solicitudes` publica `solicitud.aceptada`.
6. **`proyectos` lo escucha y crea el proyecto.** No conoce al módulo
   `solicitudes`; sólo el nombre del evento y su payload.
7. `solicitudes` guarda el `proyecto_id` devuelto y el cliente ve el proyecto en
   su portal.

El paso 6 es el desacople ganándose el lugar: agregar `facturacion` más adelante
—escuchando `proyecto.terminado`— no toca nada de lo existente.

### Eventos de v1

`cliente.creado` · `solicitud.creada` · `solicitud.aceptada` ·
`solicitud.rechazada` · `solicitud.mensaje_agregado` · `proyecto.creado` ·
`proyecto.estado_cambiado` · `tarea.asignada` · `tarea.vencida`

## 8. Fronteras del portal

**El cliente nunca ve el organigrama, ni nodos, ni asignaciones internas.** Ve
"Mirage" y su contacto directo. La estructura interna es de Mirage; filtrarla al
portal convierte una herramienta de gestión en material de negociación.

Tampoco ve: mensajes con `visible_para_cliente = false`, datos de otros clientes,
métricas de repositorio, ni tareas individuales.

**Aislamiento entre clientes.** Toda consulta del portal se filtra por el
`cliente_id` derivado de la sesión, nunca de un parámetro de la URL. Es la
superficie de mayor riesgo del sistema y tiene pruebas dedicadas (sección 10).

## 9. Manejo de errores

Cada `api.ts` lanza errores tipados: `NoAutorizado`, `NoEncontrado`,
`Validacion`, `Conflicto`. La capa de UI los traduce a mensajes; nunca se filtra
detalle interno al portal.

| Falla | Comportamiento |
|---|---|
| Sync de GitHub falla | Se registra en `repositorio_snapshot.error`; la UI muestra los datos viejos con su fecha |
| Resend falla | La notificación queda `pendiente`, se reintenta con backoff; tras el tope pasa a `fallida` y es visible |
| Mover un nodo crearía un ciclo | `Validacion`, rechazado antes de tocar la base |
| Archivar un nodo con trabajo abierto | `Conflicto`, con la lista de qué hay que reasignar primero |

## 10. Testing

- **Unitarias** — lógica del árbol (subárbol, mover nodo, detección de ciclos),
  evaluación de permisos, cálculo de progreso.
- **Integración** — el `api.ts` de cada módulo contra un PostgreSQL real, no un
  doble. Las invariantes viven en índices de la base; un mock no las prueba.
- **Frontera de módulos** — la regla de ESLint es parte de CI y bloquea el merge.
- **Aislamiento del portal (obligatorio)** — un contacto del cliente A no accede
  a ningún dato del cliente B, por ninguna ruta. Es la prueba de seguridad
  central y se escribe antes que la funcionalidad del portal.
- **Extremo a extremo** — el flujo completo de solicitud a proyecto.

## 11. Despliegue

Render: un web service más PostgreSQL, con Dockerfile. Migraciones con Drizzle,
**aditivas por defecto** — el antecedente de CAIF (plan chico, sin recuperación a
un punto en el tiempo) justifica la cautela.

El sync de GitHub y el worker de mail corren en proceso, con un scheduler. Se
separan en cron jobs de Render si el consumo de memoria lo pide.

Variables de entorno: `DATABASE_URL`, secreto de sesión, `GITHUB_TOKEN`,
`RESEND_API_KEY`, `TZ=America/Argentina/Buenos_Aires`.

## 12. Riesgos

| Riesgo | Mitigación |
|---|---|
| El organigrama inicial queda mal y hay que rehacerlo | Nodos archivables e historial de asignaciones: reorganizar no destruye historia |
| El portal no se adopta y vuelven a WhatsApp | Notificaciones desde v1 **y** una decisión explícita de la empresa de derivar todo al portal. La herramienta sola no cambia el hábito |
| Los mails van a spam | DNS del canónico configurado temprano (SPF/DKIM/DMARC); monitorear entregabilidad las primeras semanas |
| La frontera entre módulos se relaja | ESLint bloqueante en CI, no revisión manual |
| Sobre-diseño del organigrama antes de usarlo | Empezar con pocos nodos reales y dejar que crezca con necesidad demostrada |

## 13. Decisiones abiertas

- Librería de autenticación: better-auth o Auth.js
- Sistema de componentes de UI

## 14. Fuera de alcance de v1

Presupuestos y facturación · registro de horas · multi-empresa · webhooks de
GitHub · aplicación móvil · portal de proveedores.

Facturación y horas son las primeras candidatas para v2, y su exclusión es
deliberada: entran cuando el resto esté en uso real, no antes.
