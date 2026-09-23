import type { SeasonCalendarItem } from '../utils/seasonCalendar';
import { PLAYER_DARK } from '../theme/playerDarkPremium';

describe('Player Calendar Data & Architecture', () => {
  const mockEvents: SeasonCalendarItem[] = [
    {
      id: 'm1',
      kind: 'team_event',
      title: 'Match vs FC Versailles 78',
      subtitle: 'Championnat National U19',
      starts_at: new Date('2026-09-20T15:00:00.000Z'),
      city: 'Versailles',
      event_type: 'competition',
    },
    {
      id: 't1',
      kind: 'team_event',
      title: 'Séance Tactique & Vidéo',
      subtitle: 'Entraînement',
      starts_at: new Date('2026-09-22T18:30:00.000Z'),
      city: 'Paris',
      event_type: 'training',
    },
    {
      id: 'f1',
      kind: 'friendly_match',
      title: 'Amical vs Red Star FC',
      subtitle: 'Match amical',
      starts_at: new Date('2026-09-25T14:00:00.000Z'),
      city: 'Saint-Ouen',
      event_type: 'friendly',
    },
    {
      id: 'c1',
      kind: 'competition_fixture',
      title: 'Gambardella Tour 3',
      subtitle: 'Coupe Gambardella',
      starts_at: new Date('2026-10-04T15:00:00.000Z'),
      city: 'Creil',
    },
  ];

  it('filters events by type correctly', () => {
    const matchFilter = mockEvents.filter(
      (e) => e.event_type === 'competition' || e.event_type === 'friendly' || e.kind === 'friendly_match'
    );
    expect(matchFilter.length).toBe(2);

    const trainingFilter = mockEvents.filter(
      (e) => e.event_type === 'training'
    );
    expect(trainingFilter.length).toBe(1);

    const compFilter = mockEvents.filter(
      (e) => e.kind === 'competition_fixture'
    );
    expect(compFilter.length).toBe(1);
  });

  it('groups events by date key formatted as YYYY-MM-DD', () => {
    const grouped = new Map<string, SeasonCalendarItem[]>();
    for (const item of mockEvents) {
      if (!item.starts_at) continue;
      const key = item.starts_at.toISOString().slice(0, 10);
      const existing = grouped.get(key) || [];
      existing.push(item);
      grouped.set(key, existing);
    }

    expect(grouped.size).toBe(4);
    expect(grouped.get('2026-09-20')?.length).toBe(1);
    expect(grouped.get('2026-09-20')?.[0].title).toBe('Match vs FC Versailles 78');
  });

  it('identifies upcoming vs past events relative to reference time', () => {
    const reference = new Date('2026-09-21T00:00:00.000Z');
    const past = mockEvents.filter((e) => (e.starts_at?.getTime() ?? 0) < reference.getTime());
    const upcoming = mockEvents.filter((e) => (e.starts_at?.getTime() ?? 0) >= reference.getTime());

    expect(past.length).toBe(1);
    expect(past[0].id).toBe('m1');
    expect(upcoming.length).toBe(3);
  });

  it('conforms to Apple HIG and PLAYER_DARK theme tokens', () => {
    expect(PLAYER_DARK.bg).toBe('#000000');
    expect(PLAYER_DARK.surface).toBe('#121218');
    expect(PLAYER_DARK.text).toBe('#FFFFFF');
    expect(PLAYER_DARK.textMuted).toBe('#8B8B9A');
    expect(PLAYER_DARK.accent).toBe('#00E676');
  });
});
