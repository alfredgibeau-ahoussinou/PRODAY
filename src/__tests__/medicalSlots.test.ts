import type { MedicalAppointment } from '../models/MedicalAppointment';
import {
  blocksFromDaySchedule,
  dayScheduleFromBlocks,
  DEFAULT_DAY_SCHEDULE,
  DEFAULT_PHYSIO_WEEKLY_AVAILABILITY,
  generateDaySlots,
  startOfDay,
} from '../utils/medicalSlots';

describe('medicalSlots', () => {
  it('convertit le planning jour ↔ blocs horaires', () => {
    const blocks = blocksFromDaySchedule(DEFAULT_DAY_SCHEDULE);
    expect(blocks).toEqual(DEFAULT_PHYSIO_WEEKLY_AVAILABILITY);
    const roundTrip = dayScheduleFromBlocks(blocks);
    expect(roundTrip).toEqual(DEFAULT_DAY_SCHEDULE);
  });

  it('génère des créneaux sur un jour ouvré', () => {
    const monday = new Date(2026, 5, 1);
    while (monday.getDay() !== 1) {
      monday.setDate(monday.getDate() + 1);
    }
    const slots = generateDaySlots(
      monday,
      DEFAULT_PHYSIO_WEEKLY_AVAILABILITY,
      [],
      30,
      new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 0, 0)
    );
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].getHours()).toBeGreaterThanOrEqual(9);
  });

  it('exclut les créneaux déjà réservés', () => {
    const monday = startOfDay(new Date(2026, 5, 1));
    while (monday.getDay() !== 1) monday.setDate(monday.getDate() + 1);
    const booked: MedicalAppointment[] = [
      {
        id: 'a1',
        physio_uid: 'p1',
        physio_name: 'Kiné',
        patient_uid: 'u1',
        patient_name: 'Joueur',
        start_at: new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 9, 0),
        end_at: new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 9, 30),
        duration_min: 30,
        status: 'confirmed',
        created_at: new Date(),
      },
    ];
    const slots = generateDaySlots(
      monday,
      DEFAULT_PHYSIO_WEEKLY_AVAILABILITY,
      booked,
      30,
      new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 0, 0)
    );
    expect(slots.some((s) => s.getHours() === 9 && s.getMinutes() === 0)).toBe(false);
  });
});
