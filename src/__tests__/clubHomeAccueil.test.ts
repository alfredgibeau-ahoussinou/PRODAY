import {
  buildClubHomeTeamCards,
  formatClubHomeMetaLine,
  greetingForHour,
  resolveClubHomePriority,
  resolvePriorityLocationLabel,
  resolvePriorityTeamLabel,
} from '../features/club/ui/clubHomeAccueilModel';
import type { ClubTeamRow } from '../utils/clubStructureView';
import type { TeamEvent } from '../models/TeamEvent';

describe('clubHomeAccueilModel', () => {
  it('salue selon l’heure', () => {
    expect(greetingForHour(8)).toBe('Bonjour');
    expect(greetingForHour(14)).toBe('Bon après-midi');
    expect(greetingForHour(20)).toBe('Bonsoir');
  });

  it('formate la méta crest sans jargon', () => {
    expect(formatClubHomeMetaLine(12, 2, 3)).toBe('12 joueurs · 2 coachs · 3 équipes');
    expect(formatClubHomeMetaLine(1, 1, 1)).toBe('1 joueur · 1 coach · 1 équipe');
  });

  it('priorise le match le plus proche vs séance', () => {
    const soon = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const later = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
    const match = {
      id: 'm1',
      event_type: 'competition',
      title: 'U15 vs Rival',
      starts_at: soon,
      team_id: 't1',
    } as TeamEvent;
    const training = {
      id: 'tr1',
      event_type: 'training',
      title: 'Séance technique',
      starts_at: later,
      team_id: 't2',
    } as TeamEvent;

    const priority = resolveClubHomePriority({
      todayMatches: [match],
      todayTrainings: [training],
      events: [match, training],
    });
    expect(priority.kind).toBe('match');
    if (priority.kind === 'match') {
      expect(priority.event.id).toBe('m1');
    }
  });

  it('résout équipe + lieu / adversaire pour la carte priorité', () => {
    const rows: ClubTeamRow[] = [
      {
        teamId: 't1',
        name: 'U15 Garçons',
        category: 'U15',
        genderLabel: 'Garçons',
        licensedCount: 18,
        coachNames: ['Alex'],
        isDefault: false,
      },
    ];
    const priority = {
      kind: 'match' as const,
      event: {
        id: 'm1',
        event_type: 'competition',
        title: 'Championnat',
        team_id: 't1',
        opponent_name: 'AS Rivale',
        location_label: 'Stade municipal',
      } as TeamEvent,
    };
    expect(resolvePriorityTeamLabel(priority, rows)).toBe('U15 Garçons');
    expect(resolvePriorityLocationLabel(priority)).toBe('Stade municipal');
  });

  it('construit des cartes équipes avec pill Sans coach et meta lisible', () => {
    const opened: string[] = [];
    const cards = buildClubHomeTeamCards(
      [
        {
          teamId: 't-a',
          name: 'U13 Filles',
          category: 'U13',
          genderLabel: 'Filles',
          licensedCount: 14,
          coachNames: [],
          isDefault: false,
        },
        {
          teamId: 't-b',
          name: 'Seniors',
          category: 'Seniors',
          genderLabel: 'Mixte',
          licensedCount: 22,
          coachNames: ['Samira', 'Paul'],
          isDefault: false,
        },
      ],
      4,
      (id) => opened.push(id),
    );

    expect(cards[0].metaPrimary).toBe('U13 · Filles');
    expect(cards[0].metaSecondary).toBe('14 licenciés');
    expect(cards[0].hasCoach).toBe(false);
    expect(cards[0].coachesLabel).toBe('Sans coach');

    expect(cards[1].hasCoach).toBe(true);
    expect(cards[1].coachesLabel).toBe('Samira, Paul');

    cards[0].onPress();
    expect(opened).toEqual(['t-a']);
  });
});
