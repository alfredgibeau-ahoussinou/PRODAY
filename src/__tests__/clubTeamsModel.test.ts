import {
  buildClubTeamCardMeta,
  summarizeClubTeamsStructure,
} from '../features/club/ui/clubTeamsModel';
import type { ClubTeamRow } from '../utils/clubStructureView';

const rows: ClubTeamRow[] = [
  {
    teamId: 'a',
    name: 'U13 Filles',
    category: 'U13',
    genderLabel: 'Filles',
    licensedCount: 14,
    coachNames: [],
    isDefault: false,
  },
  {
    teamId: 'b',
    name: 'Seniors',
    category: 'Seniors',
    genderLabel: 'Mixte',
    licensedCount: 22,
    coachNames: ['Samira', 'Paul'],
    isDefault: false,
  },
];

describe('clubTeamsModel', () => {
  it('construit meta lisible + pill Sans coach', () => {
    const a = buildClubTeamCardMeta(rows[0]);
    expect(a.title).toBe('U13 Filles');
    expect(a.metaPrimary).toBe('U13 · Filles');
    expect(a.metaSecondary).toBe('14 licenciés');
    expect(a.hasCoach).toBe(false);
    expect(a.coachesLabel).toBe('Sans coach');

    const b = buildClubTeamCardMeta(rows[1]);
    expect(b.hasCoach).toBe(true);
    expect(b.coachesLabel).toBe('Samira, Paul');
  });

  it('résume la structure club pour le header', () => {
    const summary = summarizeClubTeamsStructure(rows);
    expect(summary.teamCount).toBe(2);
    expect(summary.licensedTotal).toBe(36);
    expect(summary.withoutCoach).toBe(1);
    expect(summary.subtitle).toContain('2 équipes');
    expect(summary.subtitle).toContain('1 sans coach');
  });
});
