export const COLOMBIA_DEPARTMENTS = [
  "Amazonas",
  "Antioquia",
  "Arauca",
  "Atlántico",
  "Bogotá D.C.",
  "Bolívar",
  "Boyacá",
  "Caldas",
  "Caquetá",
  "Casanare",
  "Cauca",
  "Cesar",
  "Chocó",
  "Córdoba",
  "Cundinamarca",
  "Guainía",
  "Guaviare",
  "Huila",
  "La Guajira",
  "Magdalena",
  "Meta",
  "Nariño",
  "Norte de Santander",
  "Putumayo",
  "Quindío",
  "Risaralda",
  "San Andrés y Providencia",
  "Santander",
  "Sucre",
  "Tolima",
  "Valle del Cauca",
  "Vaupés",
  "Vichada"
] as const;

export const CITY_DEPARTMENTS = {
  Arauca: "Arauca",
  Armenia: "Quindío",
  Barranquilla: "Atlántico",
  Bogotá: "Bogotá D.C.",
  Bucaramanga: "Santander",
  Buenaventura: "Valle del Cauca",
  Cajicá: "Cundinamarca",
  Cali: "Valle del Cauca",
  Cartagena: "Bolívar",
  Chía: "Cundinamarca",
  Cota: "Cundinamarca",
  Cúcuta: "Norte de Santander",
  Florencia: "Caquetá",
  Funza: "Cundinamarca",
  Inírida: "Guainía",
  Ibagué: "Tolima",
  "La Calera": "Cundinamarca",
  Leticia: "Amazonas",
  Manizales: "Caldas",
  Medellín: "Antioquia",
  Madrid: "Cundinamarca",
  Mitú: "Vaupés",
  Mocoa: "Putumayo",
  Montería: "Córdoba",
  Mosquera: "Cundinamarca",
  Neiva: "Huila",
  Pasto: "Nariño",
  Pereira: "Risaralda",
  Popayán: "Cauca",
  "Puerto Carreño": "Vichada",
  "Puerto Asís": "Putumayo",
  Quibdó: "Chocó",
  Riohacha: "La Guajira",
  "San Andrés": "San Andrés y Providencia",
  "San José del Guaviare": "Guaviare",
  "Santa Marta": "Magdalena",
  Sincelejo: "Sucre",
  Soacha: "Cundinamarca",
  Sopó: "Cundinamarca",
  Tabio: "Cundinamarca",
  Tenjo: "Cundinamarca",
  Tunja: "Boyacá",
  Valledupar: "Cesar",
  Villavicencio: "Meta",
  Yopal: "Casanare",
  Zipaquirá: "Cundinamarca"
};

export const getSuggestedCitiesForDepartment = (department: string) => {
  const SUGGESTED_CITIES = Object.keys(
    CITY_DEPARTMENTS
  ) as (keyof typeof CITY_DEPARTMENTS)[];
  if (!department.trim()) return SUGGESTED_CITIES;

  const normalizedDepartment = normalizeTerritoryName(department);
  return SUGGESTED_CITIES.filter(
    (city) =>
      normalizeTerritoryName(CITY_DEPARTMENTS[city]) === normalizedDepartment
  );
};

const LOCAL_CUNDINAMARCA_CITIES = new Set([
  "chia",
  "cajica",
  "cota",
  "soacha",
  "zipaquira",
  "funza",
  "mosquera",
  "madrid",
  "la calera",
  "sopo",
  "tabio",
  "tenjo"
]);

export const normalizeTerritoryName = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("es-CO");

export const calculateShippingRate = (
  department: string,
  city: string,
  quantity: number
): number => {
  if (quantity >= 3) return 0;
  if (!department.trim() || !city.trim()) return 16_000;

  const normalizedDepartment = normalizeTerritoryName(department);
  const normalizedCity = normalizeTerritoryName(city);

  if (normalizedDepartment === "bogota d.c.") return 10_000;
  if (
    normalizedDepartment === "cundinamarca" &&
    LOCAL_CUNDINAMARCA_CITIES.has(normalizedCity)
  ) {
    return 10_000;
  }

  return 16_000;
};
