import type { GeoPoint } from '../models/User';

/** Coordonnées approximatives pour villes ProDay (France). Fallback hash pour autres villes. */
const CITY_COORDS: Record<string, GeoPoint> = {
  paris: { latitude: 48.8566, longitude: 2.3522 },
  lyon: { latitude: 45.764, longitude: 4.8357 },
  marseille: { latitude: 43.2965, longitude: 5.3698 },
  lille: { latitude: 50.6292, longitude: 3.0573 },
  bordeaux: { latitude: 44.8378, longitude: -0.5792 },
  toulouse: { latitude: 43.6047, longitude: 1.4442 },
  nantes: { latitude: 47.2184, longitude: -1.5536 },
  nice: { latitude: 43.7102, longitude: 7.262 },
  strasbourg: { latitude: 48.5734, longitude: 7.7521 },
  rennes: { latitude: 48.1173, longitude: -1.6778 },
  montpellier: { latitude: 43.6108, longitude: 3.8767 },
};

function normalizeCity(city: string): string {
  return city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .split(/[,(\-]/)[0]
    .trim();
}

/** Dérive des coords stables depuis le nom de ville si absent du catalogue. */
function hashCityCoords(city: string): GeoPoint {
  let h = 0;
  for (let i = 0; i < city.length; i += 1) h = (h * 31 + city.charCodeAt(i)) | 0;
  const lat = 46.5 + ((h & 0xffff) / 0xffff - 0.5) * 8;
  const lng = 2.5 + (((h >> 16) & 0xffff) / 0xffff - 0.5) * 10;
  return { latitude: lat, longitude: lng };
}

export function resolveCityCoords(city?: string | null): GeoPoint {
  if (!city || typeof city !== 'string') return CITY_COORDS.paris;
  const key = normalizeCity(city);
  if (!key) return CITY_COORDS.paris;
  if (CITY_COORDS[key]) return CITY_COORDS[key];
  const partial = Object.entries(CITY_COORDS).find(([k]) => key.includes(k) || k.includes(key));
  if (partial) return partial[1];
  return hashCityCoords(key || 'france');
}

export function isWithinWeek(date: Date, now = new Date()): boolean {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return false;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return date >= start && date < end;
}
