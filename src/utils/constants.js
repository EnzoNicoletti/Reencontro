export const SPECIES_OPTIONS = [
  { value: 'dog', label: 'Cachorro' },
  { value: 'cat', label: 'Gato' },
  { value: 'other', label: 'Outro animal' },
];

export const SIZE_OPTIONS = [
  { value: 'small', label: 'Pequeno' },
  { value: 'medium', label: 'Médio' },
  { value: 'large', label: 'Grande' },
];

export const COLOR_OPTIONS = [
  'Caramelo',
  'Preto',
  'Branco',
  'Marrom',
  'Cinza',
  'Laranja',
  'Creme',
  'Rajado',
  'Manchado',
];

export const RADIUS_OPTIONS = [
  { value: 2, label: 'Até 2 km' },
  { value: 5, label: 'Até 5 km' },
  { value: 10, label: 'Até 10 km' },
  { value: 25, label: 'Até 25 km' },
  { value: 50, label: 'Até 50 km' },
];

// Volumetric limits synchronized verbatim with firebase-blueprint.json
export const VALIDATION_LIMITS = {
  DISPLAY_NAME_MAX: 80,
  CITY_MAX: 100,
  NEIGHBORHOOD_MAX: 120,
  ANIMAL_NAME_MAX: 80,
  BREED_MAX: 80,
  CHARACTERISTICS_MAX: 800,
  OBSERVATIONS_MAX: 1000,
  COLORS_MAX: 5,
  PHOTOS_MAX: 5,
  MESSAGE_MAX: 1000,
};

export function getSpeciesLabel(species) {
  return SPECIES_OPTIONS.find((item) => item.value === species)?.label || 'Animal';
}

export function getSizeLabel(size) {
  return SIZE_OPTIONS.find((item) => item.value === size)?.label || 'Porte não informado';
}

export function getReportTypeLabel(type) {
  return type === 'lost' ? 'Desaparecido' : 'Encontrado';
}

export function getReportDisplayTitle(report) {
  if (report?.animalName && report.animalName.trim()) {
    return report.animalName.trim();
  }
  const speciesLabel = getSpeciesLabel(report?.species);
  return report?.type === 'found' ? `${speciesLabel} encontrado` : `${speciesLabel} desaparecido`;
}
