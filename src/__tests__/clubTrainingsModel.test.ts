import {
  buildClubTrainingCardModel,
  filterClubTrainingsByStatus,
  resolveClubTrainingHero,
  resolveTrainingActions,
  sortClubTrainings,
} from '../features/club/ui/clubTrainingsModel';
import type { TeamEvent } from '../models/TeamEvent';

function trainingEvent(
  partial: Partial<TeamEvent> & Pick<TeamEvent, 'id' | 'starts_at'>,
): TeamEvent {
  return {
    title: 'Séance technique',
    event_type: 'training',
    organizer_uid: 'org',
    organizer_name: 'Org',
    club_id: 'c1',
    club_name: 'FC ProDay',
    invitee_uids: [],
    rsvps: {},
    city: 'Paris',
    created_at: new Date(),
    updated_at: new Date(),
    ...partial,
  } as TeamEvent;
}

describe('clubTrainingsModel', () => {
  it('trie les séances par horaire', () => {
    const later = trainingEvent({
      id: 'b',
      starts_at: new Date('2030-06-02T18:00:00'),
    });
    const sooner = trainingEvent({
      id: 'a',
      starts_at: new Date('2030-06-01T15:00:00'),
    });
    expect(sortClubTrainings([later, sooner]).map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('priorise une séance en cours pour le hero', () => {
    const upcoming = trainingEvent({
      id: 'up',
      starts_at: new Date(Date.now() + 2 * 60 * 60 * 1000),
    });
    const live = trainingEvent({
      id: 'live',
      starts_at: new Date(Date.now() - 20 * 60 * 1000),
      ends_at: new Date(Date.now() + 40 * 60 * 1000),
    });
    expect(resolveClubTrainingHero([upcoming, live])?.id).toBe('live');
  });

  it('construit meta équipe / lieu / présence', () => {
    const model = buildClubTrainingCardModel(
      trainingEvent({
        id: 't1',
        starts_at: new Date(Date.now() + 86400000),
        title: 'U13 technique',
        team_id: 'team-1',
        location_label: 'Terrain 2',
        invitee_uids: ['a', 'b'],
        rsvps: { a: 'yes', b: 'pending' },
        session_plan: { focus: 'Conservation' },
      }),
      [
        {
          teamId: 'team-1',
          name: 'U13 Filles',
          category: 'U13',
          genderLabel: 'Filles',
          licensedCount: 14,
          coachNames: [],
          isDefault: false,
        },
      ],
    );
    expect(model.teamLabel).toBe('U13 Filles');
    expect(model.locationLabel).toBe('Terrain 2');
    expect(model.focusLabel).toBe('Conservation');
    expect(model.presence.pending).toBe(1);
    expect(model.status).toBe('scheduled');
  });

  it('expose CTAs Présences + Détail', () => {
    const model = buildClubTrainingCardModel(
      trainingEvent({ id: 'x', starts_at: new Date() }),
      [],
    );
    expect(resolveTrainingActions(model).map((a) => a.id)).toEqual(['presence', 'detail']);
  });

  it('distingue explicitement programmée / terminée / annulée', () => {
    const past = trainingEvent({ id: 'past', starts_at: new Date(Date.now() - 3 * 86400000) });
    const upcoming = trainingEvent({ id: 'next', starts_at: new Date(Date.now() + 86400000) });
    const cancelled = trainingEvent({
      id: 'cancelled',
      starts_at: new Date(Date.now() + 2 * 86400000),
      live_state: { status: 'cancelled', home_score: 0, away_score: 0 },
    });

    expect(buildClubTrainingCardModel(past, []).status).toBe('finished');
    expect(buildClubTrainingCardModel(upcoming, []).status).toBe('scheduled');
    const cancelledModel = buildClubTrainingCardModel(cancelled, []);
    expect(cancelledModel.status).toBe('cancelled');
    expect(cancelledModel.statusLabel).toBe('Annulée');
    expect(cancelledModel.isCancelled).toBe(true);
  });

  it('filtre par état sans mélanger les annulées avec le planning actif', () => {
    const past = trainingEvent({ id: 'past', starts_at: new Date(Date.now() - 3 * 86400000) });
    const upcoming = trainingEvent({ id: 'next', starts_at: new Date(Date.now() + 86400000) });
    const cancelled = trainingEvent({
      id: 'cancelled',
      starts_at: new Date(Date.now() + 2 * 86400000),
      live_state: { status: 'cancelled', home_score: 0, away_score: 0 },
    });
    const events = [past, upcoming, cancelled];

    expect(filterClubTrainingsByStatus(events, 'upcoming').map((e) => e.id)).toEqual(['next']);
    expect(filterClubTrainingsByStatus(events, 'completed').map((e) => e.id)).toEqual(['past']);
    expect(filterClubTrainingsByStatus(events, 'cancelled').map((e) => e.id)).toEqual([
      'cancelled',
    ]);
    // « Toutes » reste exhaustif : aucune séance n'est masquée silencieusement.
    expect(filterClubTrainingsByStatus(events, 'all')).toHaveLength(3);
  });

  it('ne met jamais une séance annulée en avant tant qu’une séance active existe', () => {
    const cancelledToday = trainingEvent({
      id: 'cancelled-today',
      starts_at: new Date(Date.now() - 10 * 60 * 1000),
      live_state: { status: 'cancelled', home_score: 0, away_score: 0 },
    });
    const nextWeek = trainingEvent({ id: 'next-week', starts_at: new Date(Date.now() + 7 * 86400000) });

    expect(resolveClubTrainingHero([cancelledToday, nextWeek])?.id).toBe('next-week');
    // Si tout est annulé, on l'affiche honnêtement plutôt que de masquer le planning.
    expect(resolveClubTrainingHero([cancelledToday])?.id).toBe('cancelled-today');
  });

  it('expose la durée planifiée (même séance que côté coach)', () => {
    const model = buildClubTrainingCardModel(
      trainingEvent({
        id: 'coach-session-1',
        starts_at: new Date(Date.now() + 3600000),
        session_plan: { focus: 'Pressing', notes: 'Groupe A', duration_min: 75 },
      }),
      [],
    );
    expect(model.id).toBe('coach-session-1');
    expect(model.durationMin).toBe(75);
  });
});
