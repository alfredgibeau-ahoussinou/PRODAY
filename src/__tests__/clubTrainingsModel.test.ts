import {
  buildClubTrainingCardModel,
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
});
