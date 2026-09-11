import {
  isCoachMatchEvent,
  isCoachTrainingEvent,
  type TeamEvent,
} from '../models/TeamEvent';
import { sortClubMatches } from '../features/club/ui/clubMatchesModel';
import { sortClubTrainings } from '../features/club/ui/clubTrainingsModel';

describe('matchVsTrainingSeparation', () => {
  it('garantit l’exclusivité mutuelle absolue entre isCoachMatchEvent et isCoachTrainingEvent', () => {
    const trainingEvent: Partial<TeamEvent> = {
      id: 'e1',
      title: 'Séance finition et combinaisons',
      event_type: 'training',
      starts_at: new Date(),
    };

    const matchEvent: Partial<TeamEvent> = {
      id: 'e2',
      title: 'FC ProDay vs Chamois Niortais',
      event_type: 'friendly',
      starts_at: new Date(),
    };

    expect(isCoachMatchEvent(trainingEvent as TeamEvent)).toBe(false);
    expect(isCoachTrainingEvent(trainingEvent as TeamEvent)).toBe(true);

    expect(isCoachMatchEvent(matchEvent as TeamEvent)).toBe(true);
    expect(isCoachTrainingEvent(matchEvent as TeamEvent)).toBe(false);
  });

  it('exclut strictement les entraînements du tri de matchs du club', () => {
    const events: Partial<TeamEvent>[] = [
      {
        id: 'e1',
        title: 'Entraînement U17',
        event_type: 'training',
        starts_at: new Date(2026, 8, 16, 18, 0),
      },
      {
        id: 'e2',
        title: 'Match vs FC Nantes',
        event_type: 'competition',
        starts_at: new Date(2026, 8, 19, 15, 0),
      },
    ];

    const sortedMatches = sortClubMatches(events as TeamEvent[]);
    expect(sortedMatches).toHaveLength(1);
    expect(sortedMatches[0].id).toBe('e2');
  });

  it('exclut strictement les matchs du tri d’entraînements du club', () => {
    const events: Partial<TeamEvent>[] = [
      {
        id: 'e1',
        title: 'Entraînement U17',
        event_type: 'training',
        starts_at: new Date(2026, 8, 16, 18, 0),
      },
      {
        id: 'e2',
        title: 'Match vs FC Nantes',
        event_type: 'competition',
        starts_at: new Date(2026, 8, 19, 15, 0),
      },
    ];

    const sortedTrainings = sortClubTrainings(events as TeamEvent[]);
    expect(sortedTrainings).toHaveLength(1);
    expect(sortedTrainings[0].id).toBe('e1');
  });
});
