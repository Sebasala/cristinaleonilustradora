const calendarContent = {
  metadata: {
    title:
      "Calendario 2027 de Cristina León — Venta Directa & Edición Limitada",
    description:
      "Adquiere directamente el Calendario 2027 ilustrado por Cristina León en versiones de Escritorio y Pared. Arte botánico, fauna poética y papel de bellas artes. Envíos a toda Colombia.",
    path: "/calendario",
    ogImageAlt: "Calendario 2027 - Cristina León Ilustradora"
  },
  product: {
    name: "Calendario 2027 — Cristina León",
    brand: "Cristina León"
  },
  hero: {
    ariaLabels: {
      trust: "Garantías de compra"
    },
    badges: ["Edición Limitada", "Ilustraciones Originales"],
    eyebrow: "Ilustraciones de Cristina León",
    title: "Calendario 2027",
    subtitle: "Ilustración Poética & Fauna Ilustrada",
    intro:
      "Doce meses ilustrados que celebran la biodiversidad y la calma visual. Impreso sobre papel ecológico de alto gramaje para acompañar y vestir tus espacios día a día.",
    selectorLabel: "Formato:",
    specs: {
      dimensions: "Dimensiones",
      base: "Soporte",
      paper: { label: "Papel", value: "Ecológico de alto gramaje" }
    },
    price: {
      label: "Inversión",
      unit: "COP / unidad"
    },
    cta: {
      label: "Quiero mi Calendario",
      href: "#checkout"
    },
    trust: [
      { icon: "shield", text: "Envíos asegurados a toda Colombia" },
      { icon: "truck", text: "Despacho inmediato a partir de noviembre" }
    ]
  },
  checkout: {
    title: "Reserva y Compra Segura",
    subtitle:
      "Completa tus datos para confirmar tu pedido. Te contactaremos vía WhatsApp para coordinar el despacho seguro a tu dirección.",
    noticeLead: "Despacho garantizado:",
    notice:
      "A partir de noviembre 2026. Recibirás tu número de guía de mensajería asegurada.",
    help: "¿Tienes dudas sobre los formatos o compras corporativas? Escríbenos directamente o haz clic en el botón de WhatsApp flotante."
  }
} as const;

export default calendarContent;
