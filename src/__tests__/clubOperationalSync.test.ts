import {
  DEFAULT_STADIUM_INFO,
  DEFAULT_CLUB_PITCHES,
  resolvePitchOccupancies,
  buildRecentCoachActivities,
  calculatePlayerEngagementMetrics,
} from '../features/club/ui/clubFacilitiesModel';
import type { TeamEvent } from '../models/TeamEvent';
import type { User } from '../models/User';

describe('clubOperationalSync', () => {
  it('contient les informations du stade par défaut', () => {
    expect(DEFAULT_STADIUM_INFO.name).toBe('Complexe Sportif René Gaillard');
    expect(DEFAULT_STADIUM_INFO.turfLabel).toContain('Gazon');
  });

  it('résout l’occupation des terrains avec statut disponible ou à venir', () => {
    const events: Partial<TeamEvent>[] = [
      {
        id: 'ev-1',
        title: 'Entraînement U17',
        starts_at: new Date(Date.now() + 3600_000), // Dans 1h
        duration_minutes: 90,
        location: 'Terrain Synthétique A',
      },
    ];

    const occupancies = resolvePitchOccupancies(events as TeamEvent[], DEFAULT_CLUB_PITCHES);
    expect(occupancies).toHaveLength(3);

    const synthA = occupancies.find((o) => o.pitchId === 'pitch_annexe_synth');
    expect(synthA).toBeDefined();
    expect(synthA?.status).toBe('upcoming');
    expect(synthA?.currentEventTitle).toBe('Entraînement U17');
  });

  it('construit un fil d’activité des coachs pertinent', () => {
    const events: Partial<TeamEvent>[] = [
      {
        id: 'ev-train',
        title: 'Entraînement Tactique Seniors',
        event_type: 'training',
        organizer_name: 'Coach Thomas A.',
        starts_at: new Date(),
      },
    ];

    const activities = buildRecentCoachActivities(events as TeamEvent[]);
    expect(activities.length).toBeGreaterThan(0);
    expect(activities[0].coachName).toBe('Coach Thomas A.');
    expect(activities[0].actionTitle).toContain('Séance planifiée');
  });

  it('calcule des métriques d’assiduité cohérentes', () => {
    const events: Partial<TeamEvent>[] = [
      {
        id: 'ev-1',
        rsvps: {
          u1: 'yes',
          u2: 'yes',
          u3: 'no',
        },
      },
    ];
    const players: Partial<User>[] = [{ uid: 'u1' }, { uid: 'u2' }, { uid: 'u3' }];

    const metrics = calculatePlayerEngagementMetrics(events as TeamEvent[], players as User[]);
    expect(metrics.weeklyAttendancePct).toBe(67);
    expect(metrics.confirmedRsvpsCount).toBe(2);
    expect(metrics.totalConvocationsCount).toBe(3);
  });
});
