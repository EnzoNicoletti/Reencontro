import { geohashForLocation, distanceBetween } from 'geofire-common';

// Approximate neighborhood coordinates across major Brazilian cities
// Used when user chooses not to share browser GPS coordinates
export const NEIGHBORHOOD_PRESETS = [
  { id: 'vila-madalena-sp', neighborhood: 'Vila Madalena', city: 'São Paulo - SP', lat: -23.5464, lng: -46.6908 },
  { id: 'pinheiros-sp', neighborhood: 'Pinheiros', city: 'São Paulo - SP', lat: -23.5673, lng: -46.6939 },
  { id: 'perdizes-sp', neighborhood: 'Perdizes', city: 'São Paulo - SP', lat: -23.5367, lng: -46.6789 },
  { id: 'jardins-sp', neighborhood: 'Jardins', city: 'São Paulo - SP', lat: -23.5646, lng: -46.6661 },
  { id: 'moema-sp', neighborhood: 'Moema', city: 'São Paulo - SP', lat: -23.6003, lng: -46.6648 },
  { id: 'vila-mariana-sp', neighborhood: 'Vila Mariana', city: 'São Paulo - SP', lat: -23.5895, lng: -46.6347 },
  { id: 'santana-sp', neighborhood: 'Santana', city: 'São Paulo - SP', lat: -23.5015, lng: -46.6289 },
  { id: 'tatuape-sp', neighborhood: 'Tatuapé', city: 'São Paulo - SP', lat: -23.5403, lng: -46.5767 },
  { id: 'botafogo-rj', neighborhood: 'Botafogo', city: 'Rio de Janeiro - RJ', lat: -22.9519, lng: -43.1857 },
  { id: 'copacabana-rj', neighborhood: 'Copacabana', city: 'Rio de Janeiro - RJ', lat: -22.9711, lng: -43.1825 },
  { id: 'tijuca-rj', neighborhood: 'Tijuca', city: 'Rio de Janeiro - RJ', lat: -22.9324, lng: -43.2371 },
  { id: 'savassi-mg', neighborhood: 'Savassi', city: 'Belo Horizonte - MG', lat: -19.9367, lng: -43.9344 },
  { id: 'batel-pr', neighborhood: 'Batel', city: 'Curitiba - PR', lat: -25.4426, lng: -49.2869 },
  { id: 'moinhos-rs', neighborhood: 'Moinhos de Vento', city: 'Porto Alegre - RS', lat: -30.0258, lng: -51.2028 },
];

// Round coordinates to ~300m neighborhood precision to protect residential privacy
export function roundApproximateCoord(value) {
  return Math.round(Number(value) * 350) / 350;
}

export function buildGeoFields(lat, lng) {
  const safeLat = roundApproximateCoord(lat);
  const safeLng = roundApproximateCoord(lng);
  const geohash = geohashForLocation([safeLat, safeLng]);
  return { lat: safeLat, lng: safeLng, geohash };
}

export function calculateDistanceKm(lat1, lng1, lat2, lng2) {
  if (
    typeof lat1 !== 'number' ||
    typeof lng1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lng2 !== 'number'
  ) {
    return null;
  }
  return distanceBetween([lat1, lng1], [lat2, lng2]);
}

export function formatDistancePtBr(distanceKm) {
  if (distanceKm === null || distanceKm === undefined || Number.isNaN(distanceKm)) {
    return 'Distância não informada';
  }
  if (distanceKm < 1) {
    const meters = Math.max(50, Math.round((distanceKm * 1000) / 50) * 50);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1).replace('.', ',')} km`;
}

export function formatDatePtBr(dateInput) {
  if (!dateInput) return 'Data não informada';
  let date;
  if (typeof dateInput === 'object' && typeof dateInput.toDate === 'function') {
    date = dateInput.toDate();
  } else if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [y, m, d] = dateInput.split('-').map(Number);
    date = new Date(y, m - 1, d);
  } else {
    date = new Date(dateInput);
  }
  if (Number.isNaN(date.getTime())) return String(dateInput);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTimePtBr(dateInput) {
  if (!dateInput) return '';
  const date = typeof dateInput?.toDate === 'function' ? dateInput.toDate() : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}h${minutes}`;
}

export function formatMessageTimestampPtBr(dateInput) {
  if (!dateInput) return '';
  const date = typeof dateInput?.toDate === 'function' ? dateInput.toDate() : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const time = formatTimePtBr(date);
  if (isToday) return time;
  const dayMonth = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${dayMonth}, ${time}`;
}

export function requestBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Seu navegador não suporta geolocalização.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: roundApproximateCoord(position.coords.latitude),
          lng: roundApproximateCoord(position.coords.longitude),
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error('Permissão de localização negada. Você pode escolher um bairro manualmente.'));
        } else {
          reject(new Error('Não foi possível obter sua localização atual. Escolha o bairro manualmente.'));
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}

export function findClosestNeighborhoodPreset(lat, lng) {
  let closest = NEIGHBORHOOD_PRESETS[0];
  let bestDist = Infinity;
  for (const preset of NEIGHBORHOOD_PRESETS) {
    const dist = distanceBetween([lat, lng], [preset.lat, preset.lng]);
    if (dist < bestDist) {
      bestDist = dist;
      closest = preset;
    }
  }
  return { preset: closest, distanceKm: bestDist };
}

export function createFirestoreSafeId(prefix = 'id') {
  const randomPart =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${randomPart}`.replace(/[^a-zA-Z0-9_\-]/g, '');
}
