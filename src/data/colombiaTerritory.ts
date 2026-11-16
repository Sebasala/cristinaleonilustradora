export const COLOMBIA_DEPARTMENTS = [
	'Amazonas',
	'Antioquia',
	'Arauca',
	'Atlántico',
	'Bogotá D.C.',
	'Bolívar',
	'Boyacá',
	'Caldas',
	'Caquetá',
	'Casanare',
	'Cauca',
	'Cesar',
	'Chocó',
	'Córdoba',
	'Cundinamarca',
	'Guainía',
	'Guaviare',
	'Huila',
	'La Guajira',
	'Magdalena',
	'Meta',
	'Nariño',
	'Norte de Santander',
	'Putumayo',
	'Quindío',
	'Risaralda',
	'San Andrés y Providencia',
	'Santander',
	'Sucre',
	'Tolima',
	'Valle del Cauca',
	'Vaupés',
	'Vichada',
] as const;

export const SUGGESTED_CITIES = [
	'Arauca',
	'Armenia',
	'Barranquilla',
	'Bogotá',
	'Bucaramanga',
	'Buenaventura',
	'Cajicá',
	'Cali',
	'Cartagena',
	'Chía',
	'Cota',
	'Cúcuta',
	'Florencia',
	'Funza',
	'Inírida',
	'Ibagué',
	'La Calera',
	'Leticia',
	'Manizales',
	'Medellín',
	'Madrid',
	'Mitú',
	'Mocoa',
	'Montería',
	'Mosquera',
	'Neiva',
	'Pasto',
	'Pereira',
	'Popayán',
	'Puerto Carreño',
	'Puerto Asís',
	'Quibdó',
	'Riohacha',
	'San Andrés',
	'San José del Guaviare',
	'Santa Marta',
	'Sincelejo',
	'Soacha',
	'Sopó',
	'Tabio',
	'Tenjo',
	'Tunja',
	'Valledupar',
	'Villavicencio',
	'Yopal',
	'Zipaquirá',
] as const;

const LOCAL_CUNDINAMARCA_CITIES = new Set([
	'chia',
	'cajica',
	'cota',
	'soacha',
	'zipaquira',
	'funza',
	'mosquera',
	'madrid',
	'la calera',
	'sopo',
	'tabio',
	'tenjo',
]);

export const normalizeTerritoryName = (value: string): string =>
	value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim()
		.toLocaleLowerCase('es-CO');

export const calculateShippingRate = (
	department: string,
	city: string,
	quantity: number,
): number => {
	if (quantity >= 3) return 0;
	if (!department.trim() || !city.trim()) return 16_000;

	const normalizedDepartment = normalizeTerritoryName(department);
	const normalizedCity = normalizeTerritoryName(city);

	if (normalizedDepartment === 'bogota d.c.') return 10_000;
	if (
		normalizedDepartment === 'cundinamarca' &&
		LOCAL_CUNDINAMARCA_CITIES.has(normalizedCity)
	) {
		return 10_000;
	}

	return 16_000;
};
