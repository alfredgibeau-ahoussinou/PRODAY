/**
 * Logique pure du calendrier mensuel interactif ProDay.
 * Utilisable et testable indépendamment pour Coach, Club et Joueur.
 */

export type CalendarEventType = 'match' | 'training' | 'tournament' | 'meeting' | 'other';
export type CalendarEventStatus = 'scheduled' | 'live' | 'finished' | 'cancelled' | 'postponed';

export interface CalendarGridEvent {
  id: string;
  title: string;
  startsAt: Date;
  endsAt?: Date;
  type: CalendarEventType;
  status: CalendarEventStatus;
  isCancelled: boolean;
  isPostponed: boolean;
  isMultiDay: boolean;
  location?: string;
  city?: string;
  timeLabel: string;
  raw: any;
}

export interface CalendarDayCell {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarGridEvent[];
  eventCount: number;
  hasMatch: boolean;
  hasTraining: boolean;
  hasOther: boolean;
  hasMultiDay: boolean;
  hasCancelled: boolean;
  hasPostponed: boolean;
}

export interface CalendarWeek {
  weekIndex: number;
  days: CalendarDayCell[];
}

export const CALENDAR_WEEK_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const;

export const EVENT_TYPE_COLORS = {
  match: '#F59E0B',      // Or / Trophée
  tournament: '#F59E0B', // Or / Tournoi
  training: '#10B981',   // Vert / Ballon
  meeting: '#8B5CF6',    // Violet / Réunion
  other: '#3B82F6',      // Bleu / Autre
  cancelled: '#EF4444',  // Rouge / Annulé
  postponed: '#F97316',  // Orange / Reporté
} as const;

/**
 * Normalise n'importe quel objet événement (TeamEvent, SeasonCalendarItem, FriendlyMatch...)
 * vers l'interface unifiée `CalendarGridEvent`.
 */
export function normalizeCalendarEvent(event: any): CalendarGridEvent {
  const raw = event;
  const id = String(event.id || event._id || Math.random().toString(36).slice(2));
  const title = String(event.title || event.name || 'Événement').trim();

  // Résolution date de début
  const startsRaw = event.starts_at || event.startsAt || event.date || event.kickoff_at;
  const startsAt = startsRaw instanceof Date ? startsRaw : new Date(startsRaw || Date.now());

  // Résolution date de fin
  const endsRaw = event.ends_at || event.endsAt;
  const endsAt = endsRaw ? (endsRaw instanceof Date ? endsRaw : new Date(endsRaw)) : undefined;

  // Détection multi-jours (s'étend sur au moins 2 dates calendaires distinctes)
  const isMultiDay = Boolean(
    endsAt &&
      new Date(endsAt.getFullYear(), endsAt.getMonth(), endsAt.getDate()).getTime() >
        new Date(startsAt.getFullYear(), startsAt.getMonth(), startsAt.getDate()).getTime(),
  );

  // Résolution du statut (Annulé, Reporté, Live, Terminé, Planifié)
  const statusStr = String(
    event.status || event.live_state?.status || event.session_status || '',
  ).toLowerCase();
  const cancelReason = String(event.cancel_reason || event.live_state?.cancel_reason || '').toLowerCase();

  const isCancelled =
    statusStr === 'cancelled' ||
    event.isCancelled === true ||
    cancelReason.includes('annul') ||
    statusStr.includes('annul');

  const isPostponed =
    statusStr === 'postponed' ||
    event.isPostponed === true ||
    cancelReason.includes('report') ||
    statusStr.includes('report');

  let status: CalendarEventStatus = 'scheduled';
  if (isCancelled) status = 'cancelled';
  else if (isPostponed) status = 'postponed';
  else if (statusStr === 'live' || statusStr === 'in_progress') status = 'live';
  else if (statusStr === 'finished' || statusStr === 'completed') status = 'finished';

  // Résolution du type d'événement
  const eventTypeStr = String(event.event_type || event.kind || '').toLowerCase();
  const titleLower = title.toLowerCase();

  let type: CalendarEventType = 'other';
  if (
    eventTypeStr === 'tournament' ||
    Boolean(event.tournament_id) ||
    titleLower.includes('tournoi') ||
    titleLower.includes('tournament')
  ) {
    type = 'tournament';
  } else if (
    eventTypeStr === 'friendly' ||
    eventTypeStr === 'competition' ||
    eventTypeStr === 'friendly_match' ||
    eventTypeStr === 'competition_fixture' ||
    Boolean(event.friendly_match_id) ||
    Boolean(event.competition_fixture_id) ||
    titleLower.includes('match') ||
    titleLower.includes(' vs ')
  ) {
    type = 'match';
  } else if (
    eventTypeStr === 'training' ||
    eventTypeStr === 'team_event' ||
    titleLower.includes('entraînement') ||
    titleLower.includes('entrainement') ||
    titleLower.includes('séance') ||
    titleLower.includes('seance')
  ) {
    type = 'training';
  } else if (
    eventTypeStr === 'meeting' ||
    titleLower.includes('réunion') ||
    titleLower.includes('reunion') ||
    titleLower.includes('meeting')
  ) {
    type = 'meeting';
  }

  // Localisation
  const city = event.city || event.location_city || undefined;
  const location =
    event.location_label || event.location || event.pitch_name || event.stadium || undefined;

  // Libellé horaire
  let timeLabel = '';
  if (!Number.isNaN(startsAt.getTime())) {
    const hours = String(startsAt.getHours()).padStart(2, '0');
    const minutes = String(startsAt.getMinutes()).padStart(2, '0');
    timeLabel = `${hours}h${minutes !== '00' ? minutes : ''}`;
    if (endsAt && !Number.isNaN(endsAt.getTime())) {
      const endHours = String(endsAt.getHours()).padStart(2, '0');
      const endMinutes = String(endsAt.getMinutes()).padStart(2, '0');
      timeLabel += ` - ${endHours}h${endMinutes !== '00' ? endMinutes : ''}`;
    }
  }

  return {
    id,
    title,
    startsAt,
    endsAt,
    type,
    status,
    isCancelled,
    isPostponed,
    isMultiDay,
    location,
    city,
    timeLabel,
    raw,
  };
}

/**
 * Vérifie si deux dates correspondent au même jour calendaire (sans tenir compte de l'heure).
 */
export function isSameCalendarDay(
  d1: Date | string | null | undefined,
  d2: Date | string | null | undefined,
): boolean {
  if (!d1 || !d2) return false;
  const a = d1 instanceof Date ? d1 : new Date(d1);
  const b = d2 instanceof Date ? d2 : new Date(d2);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Vérifie si un événement a lieu sur une date calendaire donnée
 * (prend en compte les événements multi-jours).
 */
export function isEventOnCalendarDate(event: CalendarGridEvent, targetDate: Date): boolean {
  const startDay = new Date(
    event.startsAt.getFullYear(),
    event.startsAt.getMonth(),
    event.startsAt.getDate(),
  ).getTime();

  const endDay = event.endsAt
    ? new Date(
        event.endsAt.getFullYear(),
        event.endsAt.getMonth(),
        event.endsAt.getDate(),
      ).getTime()
    : startDay;

  const targetDay = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate(),
  ).getTime();

  return targetDay >= startDay && targetDay <= endDay;
}

/**
 * Construit la grille mensuelle découpée en semaines de 7 jours, débutant strictement un Lundi.
 * Positionne le 1er du mois avec les jours du mois précédent si nécessaire.
 */
export function buildCalendarMonthWeeks(
  anchorDate: Date,
  events: CalendarGridEvent[],
  selectedDate?: Date | null,
  now: Date = new Date(),
): CalendarWeek[] {
  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Décalage du 1er du mois : Lundi = 0, Mardi = 1, ..., Dimanche = 6
  let startOffset = firstDayOfMonth.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const totalSlots = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const weeksCount = totalSlots / 7;

  const weeks: CalendarWeek[] = [];

  for (let w = 0; w < weeksCount; w++) {
    const days: CalendarDayCell[] = [];

    for (let d = 0; d < 7; d++) {
      const slotIndex = w * 7 + d;
      const dayNum = slotIndex - startOffset + 1;
      const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;

      // Calcul date réelle du slot (peut appartenir au mois précédent ou suivant)
      const slotDate = new Date(year, month, dayNum);

      const isToday = isSameCalendarDay(slotDate, now);
      const isSelected = selectedDate ? isSameCalendarDay(slotDate, selectedDate) : false;

      // Filtrage des événements de ce jour
      const dayEvents = events.filter((e) => isEventOnCalendarDate(e, slotDate));

      const hasMatch = dayEvents.some((e) => e.type === 'match' || e.type === 'tournament');
      const hasTraining = dayEvents.some((e) => e.type === 'training');
      const hasOther = dayEvents.some((e) => e.type === 'meeting' || e.type === 'other');
      const hasMultiDay = dayEvents.some((e) => e.isMultiDay);
      const hasCancelled = dayEvents.some((e) => e.isCancelled);
      const hasPostponed = dayEvents.some((e) => e.isPostponed);

      days.push({
        date: slotDate,
        dayNumber: slotDate.getDate(),
        isCurrentMonth,
        isToday,
        isSelected,
        events: dayEvents,
        eventCount: dayEvents.length,
        hasMatch,
        hasTraining,
        hasOther,
        hasMultiDay,
        hasCancelled,
        hasPostponed,
      });
    }

    weeks.push({
      weekIndex: w,
      days,
    });
  }

  return weeks;
}

/**
 * Navigation mois précédent / suivant.
 */
export function navigateCalendarMonth(currentDate: Date, direction: 'prev' | 'next'): Date {
  const next = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  next.setMonth(next.getMonth() + (direction === 'next' ? 1 : -1));
  return next;
}

/**
 * Repositionne sur le mois actuel et sélectionne le jour d'aujourd'hui.
 */
export function resetToToday(referenceDate: Date = new Date()): {
  monthCursor: Date;
  selectedDate: Date;
} {
  const today = new Date(referenceDate);
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const monthCursor = new Date(today.getFullYear(), today.getMonth(), 1);
  return { monthCursor, selectedDate: startOfDay };
}

/**
 * Sélection / désélection d'une date (toggle).
 */
export function toggleDateSelection(currentSelected: Date | null, clickedDate: Date): Date | null {
  if (currentSelected && isSameCalendarDay(currentSelected, clickedDate)) {
    return null;
  }
  return new Date(clickedDate.getFullYear(), clickedDate.getMonth(), clickedDate.getDate());
}

/**
 * Titre clair Mois + Année (ex. « Octobre 2026 »).
 */
export function formatCalendarMonthYear(date: Date): string {
  const str = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * En-tête de date sélectionnée (Aujourd'hui, Demain, ou "Lundi 21 Septembre").
 */
export function formatSelectedDateHeader(
  date: Date,
  now: Date = new Date(),
): { label: string; isToday: boolean; isTomorrow: boolean } {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const isToday = target.getTime() === today.getTime();
  const isTomorrow = target.getTime() === tomorrow.getTime();

  if (isToday) return { label: "Aujourd'hui", isToday: true, isTomorrow: false };
  if (isTomorrow) return { label: 'Demain', isToday: false, isTomorrow: true };

  const str = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return {
    label: str.charAt(0).toUpperCase() + str.slice(1),
    isToday: false,
    isTomorrow: false,
  };
}

/**
 * Groupe les événements chronologiquement par jour pour la vue Liste.
 */
export function groupCalendarEventsByDate(
  events: CalendarGridEvent[],
): { dateKey: string; date: Date; events: CalendarGridEvent[] }[] {
  const map = new Map<string, { date: Date; events: CalendarGridEvent[] }>();

  // Tri chronologique
  const sorted = [...events].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  for (const event of sorted) {
    const d = event.startsAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!map.has(key)) {
      map.set(key, {
        date: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
        events: [],
      });
    }
    map.get(key)!.events.push(event);
  }

  return [...map.entries()].map(([dateKey, val]) => ({
    dateKey,
    date: val.date,
    events: val.events,
  }));
}

/**
 * Filtre les événements du mois actif.
 */
export function filterEventsByMonth(
  events: CalendarGridEvent[],
  monthCursor: Date,
): CalendarGridEvent[] {
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0).getTime();
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();

  return events.filter((e) => {
    const start = e.startsAt.getTime();
    const end = e.endsAt ? e.endsAt.getTime() : start;
    return end >= startOfMonth && start <= endOfMonth;
  });
}
