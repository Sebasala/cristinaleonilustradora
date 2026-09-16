export const contactEmail = "leon.cristina@gmail.com";
export const artistName = "Cristina León";
export const siteUrl = "https://cristinaleon.art/";
export const siteLanguage = "es-CO";
export const logo = "/img/logos/cl.svg";
export const logoAlt = "Cristina León — Ilustradora y Artista Visual";

export const websiteSchema = {
  "@type": "WebSite",
  "@id": `${siteUrl}#website`,
  url: siteUrl,
  name: "Cristina León | Arte y Narrativa Visual",
  inLanguage: siteLanguage,
  publisher: {
    "@id": `${siteUrl}#artist`
  }
};

export const artistProfile = {
  "@type": "Person",
  "@id": `${siteUrl}#artist`,
  name: artistName,
  description:
    "Artista plástica e ilustradora infantil especializada en dibujo, ilustración y enseñanza artística.",
  url: siteUrl,
  jobTitle: ["Artista Plástica", "Pintora", "Ilustradora", "Docente"],
  address: {
    "@type": "PostalAddress",
    addressLocality: "Cajicá",
    addressRegion: "Cundinamarca",
    addressCountry: "CO"
  },
  sameAs: [
    "https://www.instagram.com/crisleonilustracion/",
    "https://www.linkedin.com/in/cristina-le%C3%B3n-713340193/"
  ]
};
