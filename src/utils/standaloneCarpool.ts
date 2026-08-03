import type { CarpoolPassenger } from '../models/TeamEvent';
import type { StandaloneCarpoolOffer } from '../models/StandaloneCarpoolOffer';

export function isPassengerConfirmed(passenger: CarpoolPassenger): boolean {
  return !passenger.status || passenger.status === 'confirmed';
}

export function isPassengerPending(passenger: CarpoolPassenger): boolean {
  return passenger.status === 'pending';
}

export function standalonePassengerCount(offer: StandaloneCarpoolOffer): number {
  return (offer.passengers ?? []).filter(isPassengerConfirmed).length;
}

export function standalonePendingCount(offer: StandaloneCarpoolOffer): number {
  return (offer.passengers ?? []).filter(isPassengerPending).length;
}

export function standaloneAvailableSeats(offer: StandaloneCarpoolOffer): number {
  return Math.max(0, offer.seats - standalonePassengerCount(offer));
}

export function isStandalonePassenger(offer: StandaloneCarpoolOffer, uid: string): boolean {
  return (offer.passengers ?? []).some(
    (p) => p.uid === uid && (p.status === 'pending' || isPassengerConfirmed(p)),
  );
}

export function isStandaloneConfirmedPassenger(offer: StandaloneCarpoolOffer, uid: string): boolean {
  return (offer.passengers ?? []).some((p) => p.uid === uid && isPassengerConfirmed(p));
}

export function findStandaloneBooking(
  offers: StandaloneCarpoolOffer[],
  passengerUid: string,
): StandaloneCarpoolOffer | undefined {
  return offers.find((o) => o.status === 'open' && isStandalonePassenger(o, passengerUid));
}

export function isUpcomingStandaloneOffer(
  offer: StandaloneCarpoolOffer,
  graceMs = 6 * 60 * 60 * 1000,
): boolean {
  return (
    (offer.status === 'open' ||
      offer.status === 'closed' ||
      offer.status === 'in_progress' ||
      offer.trip_status === 'in_progress') &&
    offer.departs_at.getTime() >= Date.now() - graceMs
  );
}

export function isPastStandaloneOffer(offer: StandaloneCarpoolOffer): boolean {
  return offer.departs_at.getTime() < Date.now() - 6 * 60 * 60 * 1000
    || offer.status === 'completed'
    || offer.status === 'cancelled';
}

/** Parse JJ/MM/AAAA + HH:MM (optionnel). */
export function parseFrenchDeparture(dateStr: string, timeStr: string): Date | null {
  const m = dateStr.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const parts = timeStr.trim().split(':');
  const hours = parts[0] ? Number(parts[0]) : 12;
  const minutes = parts[1] ? Number(parts[1]) : 0;
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null;
  const dt = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return Number.isFinite(dt.getTime()) ? dt : null;
}

export function formatFrenchDepartureDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatFrenchDepartureTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function appendPassenger(
  passengers: CarpoolPassenger[] | undefined,
  passenger: CarpoolPassenger,
): CarpoolPassenger[] {
  const list = [...(passengers ?? [])];
  const idx = list.findIndex((p) => p.uid === passenger.uid);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...passenger };
    return list;
  }
  return [...list, passenger];
}

export interface StandaloneCarpoolFilters {
  city?: string;
  clubId?: string;
  clubOnly?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  viewerClubId?: string;
}

export function filterStandaloneOffers(
  offers: StandaloneCarpoolOffer[],
  filters: StandaloneCarpoolFilters,
): StandaloneCarpoolOffer[] {
  const cityQ = filters.city?.trim().toLowerCase();
  return offers.filter((offer) => {
    if (offer.club_only && filters.viewerClubId && offer.club_id !== filters.viewerClubId) {
      return false;
    }
    if (filters.clubOnly && !offer.club_only) return false;
    if (filters.clubId && offer.club_id !== filters.clubId) return false;
    if (cityQ && !(offer.city ?? '').toLowerCase().includes(cityQ)) return false;
    if (filters.dateFrom && offer.departs_at < filters.dateFrom) return false;
    if (filters.dateTo && offer.departs_at > filters.dateTo) return false;
    return true;
  });
}

export function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function sortStandaloneByProximity(
  offers: StandaloneCarpoolOffer[],
  origin?: { latitude: number; longitude: number } | null,
): StandaloneCarpoolOffer[] {
  if (!origin) {
    return offers.slice().sort((a, b) => a.departs_at.getTime() - b.departs_at.getTime());
  }
  return offers.slice().sort((a, b) => {
    const distA = a.meeting_location ? haversineKm(origin, a.meeting_location) : 9999;
    const distB = b.meeting_location ? haversineKm(origin, b.meeting_location) : 9999;
    if (distA !== distB) return distA - distB;
    return a.departs_at.getTime() - b.departs_at.getTime();
  });
}

export function driverCompletedTripsCount(
  offers: StandaloneCarpoolOffer[],
  driverUid: string,
): number {
  return offers.filter(
    (o) =>
      o.driver_uid === driverUid &&
      (o.status === 'completed' || o.departs_at.getTime() < Date.now() - 6 * 60 * 60 * 1000),
  ).length;
}
