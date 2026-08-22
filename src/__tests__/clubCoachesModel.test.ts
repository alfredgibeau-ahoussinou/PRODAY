import {
  buildClubCoachListItems,
  listTeamsWithoutCoach,
  preferCoachForAssignment,
  resolveClubCoachesSubtitle,
} from '../features/club/ui/clubCoachesModel';
import type { Team } from '../models/Team';
import type { User } from '../models/User';

function coach(partial: Partial<User> & Pick<User, 'uid' | 'display_name'>): User {
  return {
    email: `${partial.uid}@test.fr`,
    role: 'coach',
    created_at: new Date(),
    updated_at: new Date(),
    profile: {},
    ...partial,
  } as User;
}

function team(
  partial: Partial<Team> & Pick<Team, 'id' | 'name' | 'coach_uids'>,
): Team {
  return {
    club_id: 'c1',
    is_default: false,
    ...partial,
  } as Team;
}

describe('clubCoachesModel', () => {
  const coaches = [
    coach({ uid: 'c1', display_name: 'Samira' }),
    coach({ uid: 'c2', display_name: 'Paul' }),
  ];
  const teams = [
    team({ id: 't1', name: 'U15', coach_uids: ['c1'] }),
    team({ id: 't2', name: 'U13', coach_uids: [] }),
  ];

  it('construit l’annuaire avec équipes / libre', () => {
    const items = buildClubCoachListItems(coaches, teams);
    expect(items[0].teamsLabel).toContain('U15');
    expect(items[0].isUnassigned).toBe(false);
    expect(items[1].isUnassigned).toBe(true);
    expect(items[1].teamsLabel).toBe('Non affecté');
  });

  it('liste les équipes sans coach et préfère un coach libre', () => {
    expect(listTeamsWithoutCoach(teams).map((t) => t.id)).toEqual(['t2']);
    expect(preferCoachForAssignment(coaches, teams)?.uid).toBe('c2');
  });

  it('résume le sous-titre', () => {
    expect(resolveClubCoachesSubtitle({ coachCount: 2, withoutCoach: 1 })).toContain(
      'sans coach',
    );
    expect(resolveClubCoachesSubtitle({ coachCount: 2, withoutCoach: 0 })).toContain(
      'toutes les équipes couvertes',
    );
  });
});
