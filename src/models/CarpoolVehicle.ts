/** Type de véhicule proposé en covoiturage. */
export type CarpoolVehicleType =
  | 'citadine'
  | 'berline'
  | 'break'
  | 'suv'
  | 'monospace'
  | 'utilitaire'
  | 'pickup'
  | 'minibus'
  | 'car';

export const CARPOOL_VEHICLE_TYPES: readonly CarpoolVehicleType[] = [
  'citadine',
  'berline',
  'break',
  'suv',
  'monospace',
  'utilitaire',
  'pickup',
  'minibus',
  'car',
] as const;

/** Places passagers proposées par défaut (hors conducteur). */
export const CARPOOL_VEHICLE_DEFAULT_SEATS: Record<CarpoolVehicleType, number> = {
  citadine: 3,
  berline: 4,
  break: 4,
  suv: 4,
  monospace: 6,
  utilitaire: 2,
  pickup: 3,
  minibus: 8,
  car: 16,
};

/** Plafond de places passagers selon le type. */
export const CARPOOL_VEHICLE_MAX_SEATS: Record<CarpoolVehicleType, number> = {
  citadine: 3,
  berline: 4,
  break: 4,
  suv: 5,
  monospace: 6,
  utilitaire: 3,
  pickup: 4,
  minibus: 9,
  car: 20,
};

export function isCarpoolVehicleType(value: unknown): value is CarpoolVehicleType {
  return (
    typeof value === 'string' &&
    (CARPOOL_VEHICLE_TYPES as readonly string[]).includes(value)
  );
}

export function maxSeatsForVehicleType(type: CarpoolVehicleType): number {
  return CARPOOL_VEHICLE_MAX_SEATS[type];
}

/** Places par défaut pour un type, jamais sous le nombre déjà réservé. */
export function defaultSeatsForVehicleType(
  type: CarpoolVehicleType,
  taken = 0,
): number {
  const max = maxSeatsForVehicleType(type);
  const preferred = CARPOOL_VEHICLE_DEFAULT_SEATS[type];
  return Math.max(taken, Math.min(max, preferred));
}

/** Plafond UI : type véhicule, mais au moins les places déjà prises. */
export function seatPickerMaxForVehicleType(
  type: CarpoolVehicleType | undefined,
  taken = 0,
): number {
  const max = type ? maxSeatsForVehicleType(type) : 6;
  return Math.max(max, taken);
}
