// Nombres de campo únicos: deben coincidir con las columnas del Google Sheet destino.
// TODO: Unificar idioma de los campos.
const FIELD_NAMES = {
  nombre: "nombre",
  whatsapp: "whatsapp",
  location: "location",
  motivacion: "motivacion",
  disponibilidad: "disponibilidad",
  esquemaPago: "esquema_pago",
  autorizacionDatos: "autorizacion_datos"
} as const;

const contenido = {
  metadata: {
    title: "Taller de Ilustración Poética | Narrativa Visual y Lenguaje Propio",
    description:
      "Ciclo presencial de 8 encuentros en Cajicá guiado por Cristina León. Diseña tu propio proyecto de ilustración y encuentra tu voz visual.",
    ogImage: "/images/og-narrativa-visual.jpg"
  },
  hero: {
    title: "Taller de Ilustración Poética",
    subtitle: "Narrativa Visual y Lenguaje Propio",
    hook: "¿Cuándo fue la última vez que te permitiste habitar tu imaginación?",
    intro:
      "Te invito a un ciclo de ocho sesiones donde transformaremos emociones, recuerdos y vivencias en imágenes con alma, respetando tu ritmo y tus necesidades."
  },
  filosofia: {
    title: "Tu voz, tu mirada, tu historia",
    text: "A través de la contemplación, la observación y la exploración de distintos materiales, descubriremos cómo una ilustración puede convertirse en un lenguaje capaz de decir aquello que las palabras no alcanzan a expresar. La técnica no será un fin en sí mismo, sino el camino para encontrar una voz propia que narre desde la sensibilidad, el juego y la intuición."
  },
  espacio: {
    title: "El Refugio en Cajicá",
    description:
      "Nos reuniremos en mi taller rodeado de naturaleza en Cajicá, pensado como un lugar para detener el ritmo cotidiano y disfrutar. Un espacio de creación, conversación y café/té compartido, donde el arte se convierte en una forma de escuchar, imaginar y construir en comunidad.",
    quote:
      '"Nunca miramos sólo una cosa; siempre miramos la relación entre las cosas y nosotros mismos."',
    quoteAuthor: "John Berger"
  },
  proyecto: {
    subtitle: "El Proyecto",
    title: "Tu Hilo Conductor",
    description:
      "Durante las 24 horas del ciclo, desarrollarás un Proyecto de Narrativa Visual único. Aprenderás a estructurar una idea y a darle continuidad gráfica a través de una de estas dos rutas sugeridas:",
    rutas: [
      {
        id: "editorial",
        title: "Ruta Editorial (Libro Ilustrado)",
        description:
          "Ideal si buscas contar una historia secuencial. Saldrás con el storyboard estructurado, el diseño de tus personajes, la identidad visual y una ruta clara para continuar su desarrollo."
      },
      {
        id: "expositiva",
        title: "Ruta de Proyecto Libre (Serie Ilustrada)",
        description:
          "Pensada para quienes desean explorar técnicas análogas y plasmar sus ideas en una serie coherente de 2 o 3 ilustraciones narrativas listas para enmarcar, imprimir o digitalizar."
      }
    ]
  },
  mentora: {
    eyebrow: "Tu guía en el viaje creativo",
    name: "Cristina León",
    role: "Ilustradora y Maestra en Artes Plásticas",
    bio: "Maestra en Artes Plásticas de la Universidad de Los Andes con especialización en Ilustración para publicaciones infantiles y juveniles en EINA (Barcelona). Cuenta con experiencia en docencia universitaria y escolar, acompañando procesos creativos desde la sensibilidad y el hacer.",
    quote:
      "Mi propósito no es enseñar a dibujar 'correctamente', sino ofrecer herramientas para que cada persona encuentre su propia manera de narrar visualmente."
  },
  cta: {
    text: "Reserva tu cupo para proponer tu horario.",
    label: "Reservar mi cupo",
    link: "#form"
  },
  recorrido: {
    title: "El Recorrido Metodológico",
    description:
      "Un proceso estructurado en 4 etapas lógicas (2 encuentros por etapa) para guiar tu proceso creativo sin presiones:",
    etapas: [
      {
        fase: "Etapa 1",
        title: "Contemplación y Metáfora",
        details:
          "Ejercicios de observación del entorno y traducción de vivencias personales a conceptos y metáforas visuales potentes."
      },
      {
        fase: "Etapa 2",
        title: "Identidad Visual y Atmósfera",
        details:
          "Búsqueda del lenguaje gráfico propio mediante la experimentación con grafito, acuarela, lápices de color, acrílico y técnicas mixtas."
      },
      {
        fase: "Etapa 3",
        title: "El Ritmo Narrativo",
        details:
          "Aprender a conectar las imágenes entre sí. Construcción de secuencias, transiciones y coherencia visual en el proyecto."
      },
      {
        fase: "Etapa 4",
        title: "Materialización del Proyecto",
        details:
          "Acompañamiento y asesoría personalizada en el acabado final, detalles y preparación de tus piezas para su destino elegido."
      }
    ]
  },
  logistica: {
    title: "Logística del Taller",
    detalles: [
      {
        label: "Intensidad",
        value: "8 encuentros de 3 horas (24 horas presenciales en total)."
      },
      {
        label: "Ubicación",
        value:
          "Taller privado rodeado de naturaleza en Cajicá, Sabana de Bogotá."
      },
      {
        label: "Horarios",
        value:
          "Flexibles y a convenir según la disponibilidad del grupo en formación."
      },
      {
        label: "Materiales",
        value:
          "No incluidos (se compartirá una lista sugerida al reservar el cupo)."
      }
    ]
  },
  faqs: {
    title: "Preguntas Frecuentes",
    items: [
      {
        question: "¿Necesito tener experiencia previa en dibujo?",
        answer:
          "No. Este taller está diseñado para encontrar tu propia voz visual. La técnica es un medio, no el fin. Te daremos las herramientas necesarias sin importar tu nivel de partida."
      },
      {
        question: "¿Debo tener una historia escrita antes de empezar?",
        answer:
          "No es necesario. En las primeras sesiones haremos ejercicios de contemplación y observación que te ayudarán a decantar las ideas y construir las bases de tu historia desde cero."
      },
      {
        question: "¿Cómo se definen finalmente las fechas y horarios?",
        answer:
          "Una vez recibamos los pre-registros, agruparemos a las personas con intereses de horarios similares (por ejemplo, sábados en la mañana o miércoles en la tarde) y coordinaremos de mutuo acuerdo el inicio del ciclo."
      },
      {
        question: "¿Qué materiales necesito para el taller?",
        answer:
          "Utilizaremos técnicas mixtas como grafito, acuarelas, lápices de colores y acrílicos. Una vez confirmemos tu cupo, te enviaremos una guía sugerida con marcas y soportes recomendados según el proyecto que decidas realizar."
      }
    ]
  },
  form: {
    eyebrow: "Cupos Limitados (5 a 8 personas)",
    title: "Conversemos sobre tu proceso creativo",
    description:
      "Dado que trabajamos con un grupo muy íntimo, este formulario me ayuda a conocer tu búsqueda visual y confirmar si este espacio es el ideal para ti.",
    steps: [
      {
        stepNumber: 1,
        stepTitle: "Sobre ti",
        fields: {
          name: {
            label: "Tu nombre completo",
            name: FIELD_NAMES.nombre,
            placeholder: "¿Cómo te gusta que te llamen?",
            minLength: 3,
            error:
              "Por favor compártenos tu nombre para saber con quién conversamos."
          },
          whatsapp: {
            label: "Número de WhatsApp",
            name: FIELD_NAMES.whatsapp,
            type: "tel",
            placeholder: "Ej: 300 123 4567",
            error:
              "Ingresa un número de WhatsApp válido de 10 dígitos para escribirte."
          },
          location: {
            label: "¿Desde qué zona nos acompañarías?",
            name: FIELD_NAMES.location,
            type: "select",
            error: "Selecciona tu lugar de residencia.",
            opciones: [
              "Sabana (Cajicá, Chía, Cota, Zipaquirá, Sopó, Tabio)",
              "Bogotá Norte (Usaquén, Suba, Rosales, Chicó, Cedritos)",
              "Otras zonas de Bogotá"
            ]
          }
        }
      },
      {
        stepNumber: 2,
        stepTitle: "Proyecto",
        fields: {
          motivation: {
            label:
              "¿Qué imagen, historia o proyecto personal te gustaría explorar?",
            name: FIELD_NAMES.motivacion,
            rows: 4,
            minLength: 10,
            placeholder:
              "Cuéntame brevemente: ¿vienes con una idea de libro álbum, una serie visual o simplemente con el deseo de reencontrarte con el papel?",
            error:
              "Cuéntanos unas pocas palabras sobre tu interés para entender tu búsqueda."
          },
          disponibilidad: {
            label: "¿Qué franja horaria se adapta mejor a tu rutina?",
            name: FIELD_NAMES.disponibilidad,
            type: "radio",
            error: "Por favor selecciona tu disponibilidad de tiempo.",
            opciones: [
              "Sábados en la mañana",
              "Entre semana en la mañana",
              "Entre semana en la tarde"
            ]
          }
        }
      },
      {
        stepNumber: 3,
        stepTitle: "Reserva",
        eyebrow: "Ciclo de 8 sesiones presenciales (24 horas)",
        valorTotal: "$1.440.000 COP",
        description:
          "No requieres hacer ningún pago en este momento. Coordinaremos tu reserva una vez validemos la afinidad de tu proyecto y los horarios del grupo.",
        fields: {
          paymentOptionsField: {
            label: "¿Qué modalidad de pago se adapta mejor a tu flujo?",
            name: FIELD_NAMES.esquemaPago,
            error: "Por favor selecciona una alternativa de inversión.",
            options: [
              "Pago único de contado / Tarifa preferencial: $1.296.000 COP",
              "2 cuotas de $720.000 COP (50% al reservar cupo, 50% en la sesión 4)",
              "3 cuotas de $480.000 COP (mensuales)",
              "Por el momento excede mi presupuesto (deseo recibir invitaciones a talleres cortos futuros)"
            ]
          },
          dataConsent: {
            label:
              "He leído y acepto la [Política de Tratamiento de Datos Personales](/politica-de-privacidad). Autorizo a Cristina León a tratar mis datos para contactarme, gestionar mi inscripción en el taller y enviarme información sobre futuras convocatorias y proyectos artísticos.",
            name: FIELD_NAMES.autorizacionDatos,
            error:
              "Debes autorizar el tratamiento de tus datos personales para continuar."
          }
        }
      }
    ],
    success: {
      title: "¡Listo! Ya guardé tus datos",
      message:
        "En breve te escribo por WhatsApp para confirmar los detalles de tu cupo. También puedes escribirme para notificarme que ya te registraste.",
      whatsappLabel: "Escríbeme por WhatsApp",
      whatsappMessage:
        "Hola Cristina, soy {nombre}. Acabo de completar el formulario del Taller de Ilustración Poética."
    }
  }
};

export default contenido;
