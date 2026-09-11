/**
 * utilitaire de formatage standardisé des séances d'entraînement et événements d'équipe.
 * Formate strictement les titres et horaires selon la règle :
 * "Entraînement - [Date] à [Heure]" (ex. Entraînement - Mercredi 16 Septembre à 19:00).
 */

import type { TeamEvent } from '../models/TeamEvent';

const DAY_NAMES: Record<number, string> = {
  0: 'Dimanche',
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
};

const MONTH_NAMES: Record<number, string> = {
  0: 'Janvier',
  1: 'Février',
  2: 'Mars',
  3: 'Avril',
  4: 'Mai',
  5: 'Juin',
  6: 'Juillet',
  7: 'Août',
  8: 'Septembre',
  9: 'Octobre',
  10: 'Novembre',
  11: 'Décembre',
};

function parseDateInput(raw?: Date | string | number | null): Date | null {
  if (!raw) return null;
  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? null : raw;
  }
  if (typeof raw === 'object' && 'toDate' in raw && typeof (raw as { toDate: () => Date }).toDate === 'function') {
    try {
      const d = (raw as { toDate: () => Date }).toDate();
      return Number.isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function padTwo(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function formatEventScheduleDate(dateInput?: Date | string | number | null): string {
  const date = parseDateInput(dateInput);
  if (!date) return 'Prochainement';

  const dayName = DAY_NAMES[date.getDay()] || '';
  const dayNum = date.getDate();
  const monthName = MONTH_NAMES[date.getMonth()] || '';

  return `${dayName} ${dayNum} ${monthName}`.trim();
}

export function formatEventScheduleTime(dateInput?: Date | string | number | null): string {
  const date = parseDateInput(dateInput);
  if (!date) return '18:30';

  const hours = padTwo(date.getHours());
  const minutes = padTwo(date.getMinutes());
  return `${hours}:${minutes}`;
}

/**
 * Formate un titre de séance d'entraînement de façon strictement harmonisée :
 * "Entraînement - Mercredi 16 Septembre à 19:00"
 */
export function formatTrainingSessionTitle(
  event?: Partial<TeamEvent> | { starts_at?: Date | string | null; date?: string; title?: string } | null
): string {
  if (!event) return 'Entraînement - Prochainement';

  const rawDate = event.starts_at || event.date;
  const date = parseDateInput(rawDate);
  if (!date) return 'Entraînement - Prochainement';

  const dateStr = formatEventScheduleDate(date);
  const timeStr = formatEventScheduleTime(date);

  const customTitle = event.title?.trim();
  const lower = customTitle?.toLowerCase() || '';
  const isGeneric = !customTitle || lower === 'entraînement' || lower === 'séance' || lower === 'séance d\'entraînement' || lower === 'entraînement d\'équipe';

  if (!isGeneric) {
    return `Entraînement - ${dateStr} à ${timeStr} · ${customTitle}`;
  }

  return `Entraînement - ${dateStr} à ${timeStr}`;
}

/**
 * Formate un libellé d'horaire d'événement (match ou entraînement).
 */
export function formatEventScheduleLabel(
  event?: Partial<TeamEvent> | { starts_at?: Date | string | null; date?: string; event_type?: string; title?: string } | null
): string {
  if (!event) return 'Prochainement';

  const isTraining = event.event_type === 'training' || (event.title && event.title.toLowerCase().includes('entraînement'));
  if (isTraining) {
    return formatTrainingSessionTitle(event);
  }

  const rawDate = event.starts_at || event.date;
  const date = parseDateInput(rawDate);
  if (!date) return event.title?.trim() || 'Événement';

  const dateStr = formatEventScheduleDate(date);
  const timeStr = formatEventScheduleTime(date);
  const titleStr = event.title?.trim() || 'Match';

  return `${titleStr} - ${dateStr} à ${timeStr}`;
}
