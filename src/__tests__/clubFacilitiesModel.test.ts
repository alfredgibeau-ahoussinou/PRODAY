import {
  detectPitchConflicts,
  DEFAULT_CLUB_PITCHES,
} from '../features/club/ui/clubFacilitiesModel';
import type { TeamEvent } from '../models/TeamEvent';

describe('clubFacilitiesModel', () => {
  it('détecte un conflit horaire sur le même terrain', () => {
    const events: Partial<TeamEvent>[] = [
      {
        id: 'event-1',
        title: 'Entraînement U17',
        date: '2026-09-12T14:00:00.000Z',
        duration_minutes: 90,
        location: "Terrain d'Honneur (Herbe)",
      },
      {
        id: 'event-2',
        title: 'Match Amical Seniors',
        date: '2026-09-12T14:30:00.000Z',
        duration_minutes: 105,
        location: "Honneur",
      },
    ];

    const conflicts = detectPitchConflicts(events as TeamEvent[], DEFAULT_CLUB_PITCHES);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].pitchId).toBe('pitch_honneur');
    expect(conflicts[0].eventATitle).toBe('Entraînement U17');
    expect(conflicts[0].eventBTitle).toBe('Match Amical Seniors');
  });

  it('ne signale aucun conflit si les terrains sont distincts', () => {
    const events: Partial<TeamEvent>[] = [
      {
        id: 'event-1',
        title: 'Entraînement U17',
        date: '2026-09-12T14:00:00.000Z',
        duration_minutes: 90,
        location: "Terrain d'Honneur (Herbe)",
      },
      {
        id: 'event-2',
        title: 'Entraînement U15',
        date: '2026-09-12T14:00:00.000Z',
        duration_minutes: 90,
        location: "Terrain Synthétique Annexe",
      },
    ];

    const conflicts = detectPitchConflicts(events as TeamEvent[], DEFAULT_CLUB_PITCHES);
    expect(conflicts).toHaveLength(0);
  });

  it('ne signale aucun conflit si les horaires ne se chevauchent pas', () => {
    const events: Partial<TeamEvent>[] = [
      {
        id: 'event-1',
        title: 'Séance Matin',
        date: '2026-09-12T10:00:00.000Z',
        duration_minutes: 90,
        location: "Honneur",
      },
      {
        id: 'event-2',
        title: 'Séance Après-Midi',
        date: '2026-09-12T15:00:00.000Z',
        duration_minutes: 90,
        location: "Honneur",
      },
    ];

    const conflicts = detectPitchConflicts(events as TeamEvent[], DEFAULT_CLUB_PITCHES);
    expect(conflicts).toHaveLength(0);
  });
});
