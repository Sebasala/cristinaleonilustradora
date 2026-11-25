const calendarContent = {
  metadata: {
    title:
      "Calendario 2027 de Cristina León — Venta Directa & Edición Limitada",
    description:
      "Adquiere directamente el Calendario 2027 ilustrado por Cristina León en versiones de Escritorio y Pared. Arte botánico, fauna poética y papel de bellas artes. Envíos a toda Colombia.",
    path: "/calendario",
    ogImageAlt: "Calendario 2027 - Cristina León Ilustradora",
  },
  product: {
    name: "Calendario 2027 — Cristina León",
    brand: "Cristina León",
  },
  hero: {
    ariaLabels: {
      trust: "Garantías de compra",
    },
    badges: ["Edición Limitada", "Ilustraciones Originales"],
    eyebrow: "Ilustraciones de Cristina León",
    title: "Calendario 2027",
    subtitle: "Ilustración Poética & Fauna Ilustrada",
    intro:
      "Doce meses ilustrados que celebran la biodiversidad y la calma visual. Impreso sobre papel ecológico de alto gramaje para acompañar y vestir tus espacios día a día.",
    selectorLabel: "Formato:",
    quantityLabel: "Cantidad:",
    specs: {
      dimensions: "Dimensiones",
      base: "Soporte",
      paper: { label: "Papel", value: "Ecológico de alto gramaje" },
    },
    price: {
      label: "Unidad",
      unit: "COP / unidad",
    },
    subtotalLabel: "Subtotal",
    cta: {
      label: "Quiero mi Calendario",
      href: "#checkout",
    },
    trust: [
      { icon: "shield", text: "Envíos asegurados a toda Colombia" },
      { icon: "truck", text: "Despacho inmediato a partir de noviembre" },
    ],
  },
  productSpecs: {
    eyebrow: "Materialidad y formatos",
    title: "Una ficha clara para elegir tu formato",
    introduction:
      "Compara las medidas, el soporte y el uso recomendado para encontrar el calendario que mejor se adapta a tu espacio.",
    comparison: {
      title: "Comparativa de formatos",
      formatLabel: "Formato",
      dimensionsLabel: "Medidas",
      supportLabel: "Soporte y encuadernación",
      useLabel: "Uso ideal",
    },
    paper: {
      title: "Papel para tus ilustraciones",
      description:
        "Papel ecológico de alto gramaje, descrito para acompañar las ilustraciones del calendario.",
      note: "La composición exacta y el comportamiento con cada instrumento de escritura pueden confirmarse antes de la compra.",
    },
  },
  checkout: {
    title: "Reserva y Compra Segura",
    subtitle:
      "Completa tus datos para confirmar tu pedido. Te contactaremos vía WhatsApp para coordinar el despacho seguro a tu dirección.",
    destinationTitle: "Datos de envío",
    shippingCosts:
      "Envíos gratis a partir de 3 unidades. Para 2 unidades o menos, aplica costo de envío según la ubicación.",
    shippingDestination: {
      departmentLabel: "Departamento",
      departmentPlaceholder: "Selecciona un departamento",
      departmentError: "Selecciona un departamento.",
      cityLabel: "Ciudad o municipio",
      cityPlaceholder: "Escribe tu ciudad o municipio",
      cityError: "Escribe una ciudad o municipio de al menos 3 caracteres.",
      subtotalLabel: "Subtotal",
      shippingCostLabel: "Costo de envío",
      grandTotalLabel: "Total definitivo",
      freeShippingLabel: "¡Envío Gratis!",
    },
    shippingAddress: {
      addressLabel: "Dirección",
      addressPlaceholder: "Ej. Cra 15 # 85-20 o Vereda La Balsa",
      addressError: "Escribe una dirección de al menos 5 caracteres.",
      neighborhoodLabel: "Barrio / Vereda",
      neighborhoodPlaceholder: "Escribe tu barrio o vereda",
      neighborhoodError: "Escribe un barrio o vereda de al menos 2 caracteres.",
      complementLabel: "Complemento (opcional)",
      complementPlaceholder: "Apartamento, torre, casa u otra referencia",
      complementHelp:
        "Incluye detalles adicionales de la dirección, si los necesitas.",
      deliveryNotesLabel: "Notas de entrega (opcional)",
      deliveryNotesPlaceholder: "Indicaciones para la persona que entrega",
    },
    customerContact: {
      title: "Datos de contacto",
      fullNameLabel: "Nombre completo",
      fullNameError:
        "Escribe tu nombre completo con al menos dos palabras válidas.",
      phoneLabel: "Celular",
      phoneError:
        "Escribe un celular colombiano de 10 dígitos que comience por 3.",
      emailLabel: "Correo electrónico",
      emailError: "Escribe un correo electrónico válido.",
      documentIdLabel: "Cédula",
      documentIdError: "Escribe una cédula de 6 a 10 dígitos.",
      privacyLabel:
        "Autorizo el tratamiento de mis datos personales para gestionar y entregar mi pedido, de acuerdo con la",
      privacyLink: "Política de tratamiento de datos personales",
      privacyError:
        "Debes autorizar el tratamiento de tus datos personales para continuar.",
    },
    continueLabel: "Continuar al pago",
    creatingOrderLabel: "Generando tu pedido...",
    retryOrderLabel: "Reintentar",
    orderFallbackMessage:
      "No pudimos confirmar el registro. Guarda este código: {orderId}. Puedes reintentar.",
    orderSyncedMessage: "Pedido {orderId} registrado.",
    orderChangedFallbackMessage:
      "No pudimos confirmar el pedido {orderId}. Los datos del formulario cambiaron; guarda ese código.",
    orderChangedSyncedMessage:
      "Pedido {orderId} registrado. Los datos del formulario cambiaron después de enviarlo.",
    orderErrorMessage: "No pudimos generar tu pedido. Inténtalo nuevamente.",
  },
} as const;

export default calendarContent;
