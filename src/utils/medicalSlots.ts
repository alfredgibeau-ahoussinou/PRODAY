import type { MedicalAppointment } from '../models/MedicalAppointment';
import type { WeeklyAvailabilityBlock } from '../models/MedicalAppointment';

export const DEFAULT_CONSULTATION_DURATION_MIN = 30;

export const WEEKDAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'] as const;

export const CONSULTATION_DURATION_OPTIONS = [20, 30, 45, 60] as const;

export interface DayScheduleConfig {
  weekday: number;
  morning: boolean;
  afternoon: boolean;
}

export const DEFAULT_DAY_SCHEDULE: DayScheduleConfig[] = [
  { weekday: 1, morning: true, afternoon: true },
  { weekday: 2, morning: true, afternoon: true },
  { weekday: 3, morning: true, afternoon: true },
  { weekday: 4, morning: true, afternoon: true },
  { weekday: 5, morning: true, afternoon: true },
];

export function blocksFromDaySchedule(days: DayScheduleConfig[]): WeeklyAvailabilityBlock[] {
  const blocks: WeeklyAvailabilityBlock[] = [];
  for (const day of days) {
    if (day.morning) blocks.push({ weekday: day.weekday, start: '09:00', end: '12:00' });
    if (day.afternoon) {
      blocks.push({
        weekday: day.weekday,
        start: '14:00',
        end: day.weekday === 5 ? '17:00' : '18:00',
      });
    }
  }
  return blocks;
}

export function dayScheduleFromBlocks(
  blocks: WeeklyAvailabilityBlock[]
): DayScheduleConfig[] {
  const byDay = new Map<number, DayScheduleConfig>();
  for (const day of DEFAULT_DAY_SCHEDULE) {
    byDay.set(day.weekday, { ...day, morning: false, afternoon: false });
  }
  for (const block of blocks) {
    const entry = byDay.get(block.weekday) ?? {
      weekday: block.weekday,
      morning: false,
      afternoon: false,
    };
    if (block.start === '09:00' && block.end === '12:00') entry.morning = true;
    if (block.start === '14:00') entry.afternoon = true;
    byDay.set(block.weekday, entry);
  }
  return [...byDay.values()].sort((a, b) => a.weekday - b.weekday);
}

export const DEFAULT_PHYSIO_WEEKLY_AVAILABILITY: WeeklyAvailabilityBlock[] =
  blocksFromDaySchedule(DEFAULT_DAY_SCHEDULE);

function parseTimeOnDate(date: Date, time: string): Date {
  const [h, m] = time.split(':').map((v) => parseInt(v, 10));
  const slot = new Date(date);
  slot.setHours(h, m ?? 0, 0, 0);
  return slot;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function getWeekday(date: Date): number {
  return date.getDay();
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function formatSlotLabel(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function formatAppointmentDay(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function generateDaySlots(
  day: Date,
  weeklyAvailability: WeeklyAvailabilityBlock[],
  booked: MedicalAppointment[],
  durationMin = DEFAULT_CONSULTATION_DURATION_MIN,
  now = new Date()
): Date[] {
  const weekday = getWeekday(day);
  const blocks = weeklyAvailability.filter((b) => b.weekday === weekday);
  const slots: Date[] = [];
  const dayStart = startOfDay(day);

  for (const block of blocks) {
    let cursor = parseTimeOnDate(dayStart, block.start);
    const blockEnd = parseTimeOnDate(dayStart, block.end);

    while (cursor.getTime() + durationMin * 60_000 <= blockEnd.getTime()) {
      const slotEnd = new Date(cursor.getTime() + durationMin * 60_000);
      const isPast = cursor <= now;
      const isBooked = booked.some(
        (appt) =>
          appt.status !== 'cancelled' &&
          overlaps(cursor, slotEnd, appt.start_at, appt.end_at)
      );
      if (!isPast && !isBooked) slots.push(new Date(cursor));
      cursor = slotEnd;
    }
  }

  return slots;
}

export function nextBookingDays(count = 14, from = new Date()): Date[] {
  const days: Date[] = [];
  const base = startOfDay(from);
  for (let i = 0; i < count; i += 1) {
    days.push(addDays(base, i));
  }
  return days;
}
