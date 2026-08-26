// El árbol del recomendador de servicios (§8.3 del sistema visual): un
// archivo tipado en el repo, sin base de datos, sin backend, editable en
// cinco minutos. Es un cuestionario de puntaje, no un árbol de
// decisión ramificado: las cinco preguntas son siempre las mismas y en
// el mismo orden (así la barra de progreso puede mostrar "3 de 5" sin
// tener que simular el resto del recorrido), y cada opción suma puntos
// a una o más categorías; el resultado es la categoría con más puntos
// al final.

export type CategoriaResultado =
  | "sistema_nuevo"
  | "relevamiento"
  | "integracion"
  | "modernizacion"
  | "operacion";

export interface OpcionPregunta {
  valor: string;
  etiqueta: string;
  categorias: CategoriaResultado[];
}

export interface Pregunta {
  id: string;
  texto: string;
  opciones: OpcionPregunta[];
}

export const PREGUNTAS: Pregunta[] = [
  {
    id: "situacion",
    texto: "¿Cómo está tu sistema hoy?",
    opciones: [
      {
        valor: "nada",
        etiqueta: "No tengo nada, arranco de cero",
        categorias: ["sistema_nuevo"],
      },
      {
        valor: "insuficiente",
        etiqueta: "Tengo algo armado, pero no me alcanza",
        categorias: ["modernizacion", "integracion"],
      },
      {
        valor: "funciona",
        etiqueta: "Tengo un sistema que funciona bien",
        categorias: ["operacion"],
      },
    ],
  },
  {
    id: "claridad",
    texto: "¿Qué tan definido tenés lo que necesitás?",
    opciones: [
      {
        valor: "claro",
        etiqueta: "Lo tengo claro: sé qué pantallas y flujos necesito",
        categorias: ["sistema_nuevo", "integracion"],
      },
      {
        valor: "general",
        etiqueta: "Una idea general, necesito ayuda para definirlo",
        categorias: ["relevamiento"],
      },
      {
        valor: "no_se",
        etiqueta: "La verdad no sé por dónde arrancar",
        categorias: ["relevamiento"],
      },
    ],
  },
  {
    id: "problema",
    texto: "¿Cuál es el problema que más te frena hoy?",
    opciones: [
      {
        valor: "no_conecta",
        etiqueta: "Las herramientas que uso no se hablan entre sí",
        categorias: ["integracion"],
      },
      {
        valor: "viejo",
        etiqueta: "El sistema actual es viejo y cuesta mantenerlo",
        categorias: ["modernizacion"],
      },
      {
        valor: "no_existe",
        etiqueta: "Todavía no existe, lo estoy pensando",
        categorias: ["relevamiento", "sistema_nuevo"],
      },
    ],
  },
  {
    id: "uso",
    texto: "¿Quién va a usar el sistema día a día?",
    opciones: [
      {
        valor: "interno",
        etiqueta: "Mi equipo, puertas para adentro",
        categorias: ["sistema_nuevo", "modernizacion"],
      },
      {
        valor: "clientes",
        etiqueta: "Mis clientes o el público",
        categorias: ["sistema_nuevo", "integracion"],
      },
      {
        valor: "los_dos",
        etiqueta: "Los dos: equipo interno y clientes",
        categorias: ["integracion", "operacion"],
      },
    ],
  },
  {
    id: "urgencia",
    texto: "¿Qué tan urgente es esto para vos?",
    opciones: [
      {
        valor: "ya",
        etiqueta: "Necesito arrancar ya",
        categorias: ["sistema_nuevo"],
      },
      {
        valor: "meses",
        etiqueta: "Tengo margen de un par de meses",
        categorias: ["relevamiento", "modernizacion"],
      },
      {
        valor: "mantenimiento",
        etiqueta: "No es un arranque, es sostener lo que ya anda",
        categorias: ["operacion"],
      },
    ],
  },
];

export interface Resultado {
  categoria: CategoriaResultado;
  titulo: string;
  descripcion: string;
  asuntoContacto: string;
}

// El orden acá es el desempate cuando dos categorías quedan con el
// mismo puntaje: gana la que aparece primero.
export const RESULTADOS: Record<CategoriaResultado, Resultado> = {
  relevamiento: {
    categoria: "relevamiento",
    titulo: "Empezar por el relevamiento",
    descripcion:
      "Antes de escribir una línea de código conviene entender el proceso real de tu equipo. Arrancamos ahí: qué pantallas, qué flujos, qué datos.",
    asuntoContacto: "Relevamiento para un sistema nuevo",
  },
  sistema_nuevo: {
    categoria: "sistema_nuevo",
    titulo: "Un sistema nuevo, de punta a punta",
    descripcion:
      "Construimos y operamos el sistema completo: desde la base de datos hasta la interfaz que tu equipo usa todos los días.",
    asuntoContacto: "Sistema nuevo de punta a punta",
  },
  integracion: {
    categoria: "integracion",
    titulo: "Integrar lo que ya tenés",
    descripcion:
      "No hace falta tirar nada: conectamos las herramientas que ya usás para que dejen de vivir separadas.",
    asuntoContacto: "Integración de sistemas existentes",
  },
  modernizacion: {
    categoria: "modernizacion",
    titulo: "Modernizar un sistema existente",
    descripcion:
      "Un sistema viejo no siempre hay que reemplazarlo entero. Lo llevamos a algo que se pueda mantener y hacer crecer.",
    asuntoContacto: "Modernización de un sistema existente",
  },
  operacion: {
    categoria: "operacion",
    titulo: "Seguir operando lo que ya funciona",
    descripcion:
      "Un sistema que funciona igual necesita a alguien del otro lado. Nos hacemos cargo de la operación y las mejoras.",
    asuntoContacto: "Operación continua de un sistema existente",
  },
};

const ORDEN_DESEMPATE: CategoriaResultado[] = [
  "relevamiento",
  "sistema_nuevo",
  "integracion",
  "modernizacion",
  "operacion",
];

export function calcularResultado(respuestas: string[]): Resultado {
  const puntos: Record<CategoriaResultado, number> = {
    sistema_nuevo: 0,
    relevamiento: 0,
    integracion: 0,
    modernizacion: 0,
    operacion: 0,
  };

  respuestas.forEach((valor, indice) => {
    const pregunta = PREGUNTAS[indice];
    const opcion = pregunta?.opciones.find((o) => o.valor === valor);
    opcion?.categorias.forEach((categoria) => {
      puntos[categoria] += 1;
    });
  });

  const ganadora = ORDEN_DESEMPATE.reduce((mejor, categoria) =>
    puntos[categoria] > puntos[mejor] ? categoria : mejor,
  );

  return RESULTADOS[ganadora];
}
