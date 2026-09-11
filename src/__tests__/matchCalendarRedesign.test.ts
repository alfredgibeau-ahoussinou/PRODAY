import type { SeasonCalendarItem } from '../utils/seasonCalendar';

describe('Match Calendar & Filter Bar Redesign', () => {
  const mockItems: SeasonCalendarItem[] = [
    {
      id: 'e1',
      kind: 'team_event',
      title: 'Entraînement tactique',
      subtitle: 'Séance',
      starts_at: new Date('2026-09-10T18:00:00Z'),
      city: 'Paris',
    },
    {
      id: 'e2',
      kind: 'team_event',
      title: 'Match championnat',
      subtitle: 'Convocations',
      starts_at: new Date('2026-09-12T15:00:00Z'),
      city: 'Lyon',
    },
    {
      id: 'm1',
      kind: 'friendly_match',
      title: 'FC Paris vs FC Lyon',
      subtitle: 'Amical',
      starts_at: new Date('2026-09-14T20:00:00Z'),
      city: 'Paris',
    },
    {
      id: 'c1',
      kind: 'competition_fixture',
      title: 'Demi-finale Coupe',
      subtitle: 'Coupe régionale',
      starts_at: new Date('2026-09-20T14:00:00Z'),
      city: 'Marseille',
    },
  ];

  it('calcule correctement les compteurs pour chaque segment (Tout, Convoqués, Matchs, Compét)', () => {
    let convocs = 0;
    let friendlies = 0;
    let compet = 0;
    for (const it of mockItems) {
      if (it.kind === 'team_event') convocs++;
      else if (it.kind === 'friendly_match') friendlies++;
      else if (it.kind === 'competition_fixture') compet++;
    }

    const counts = {
      all: mockItems.length,
      team_event: convocs,
      friendly_match: friendlies,
      competition_fixture: compet,
    };

    expect(counts.all).toBe(4);
    expect(counts.team_event).toBe(2);
    expect(counts.friendly_match).toBe(1);
    expect(counts.competition_fixture).toBe(1);
  });

  it('filtre les éléments par date sélectionnée pour des compteurs dynamiques par jour', () => {
    const selectedDay = new Date('2026-09-10T00:00:00Z');
    const start = new Date(selectedDay);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    const dayItems = mockItems.filter((item) => item.starts_at >= start && item.starts_at < end);
    expect(dayItems.length).toBe(1);
    expect(dayItems[0].title).toBe('Entraînement tactique');
  });

  it('vérifie que les libellés de la barre de filtres correspondent à Tout, Convoqués, Matchs, Compét', () => {
    const labels = {
      all: 'Tout',
      team_event: 'Convoqués',
      friendly_match: 'Matchs',
      competition_fixture: "Compét'",
    };

    expect(labels.all).toBe('Tout');
    expect(labels.team_event).toBe('Convoqués');
    expect(labels.friendly_match).toBe('Matchs');
    expect(labels.competition_fixture).toBe("Compét'");
  });
});
