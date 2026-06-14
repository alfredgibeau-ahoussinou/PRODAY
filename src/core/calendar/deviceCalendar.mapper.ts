import type { CalendarEntity } from './calendarSync.engine';

export interface DeviceCalendarEventDraft {
  entityId: string;
  title: string;
  notes: string;
  location: string;
  startDate: Date;
  endDate: Date;
}

const MATCH_DURATION_MS = 90 * 60_000;
const DEFAULT_DURATION_MS = 60 * 60_000;

/** Prépare les événements ProDay à exporter vers le calendrier natif. */
export function buildDeviceCalendarDrafts(
  entities: CalendarEntity[],
  now = new Date()
): DeviceCalendarEventDraft[] {
  return entities
    .filter((entity) => entity.startsAt.getTime() >= now.getTime() - 3_600_000)
    .slice(0, 12)
    .map((entity) => {
      const duration = entity.kind === 'match' ? MATCH_DURATION_MS : DEFAULT_DURATION_MS;
      return {
        entityId: entity.id,
        title: `ProDay · ${entity.title}`,
        notes: entity.subtitle,
        location: entity.city,
        startDate: entity.startsAt,
        endDate: new Date(entity.startsAt.getTime() + duration),
      };
    });
}
