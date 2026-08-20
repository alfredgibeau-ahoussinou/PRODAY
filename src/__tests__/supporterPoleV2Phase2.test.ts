import { buildReplayChaptersFromEvents, minuteToOffsetMs } from '../utils/supporterReplayChapters';

function parsePredictionLabel(label: string): { home: number; away: number } | null {
  const m = label.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (!m) return null;
  return { home: Number(m[1]), away: Number(m[2]) };
}

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}));

import {
  buildKickoffReminders,
  detectGoalNotification,
  filterPlannableNotifications,
} from '../services/supporterNotificationPlanner';
import type { SupporterMatchViewItem } from '../utils/supporterMatchFilters';

const TEST_NOTIF_PREFS = {
  goalAlerts: true,
  kickoffAlerts: true,
  matchReminders: true,
  communityDigest: false,
  summaryAlerts: true,
};

describe('supporterReplayChapters', () => {
  it('convertit minute en offset ms avec pause mi-temps', () => {
    expect(minuteToOffsetMs(10)).toBe(10 * 60_000);
    expect(minuteToOffsetMs(50)).toBe(50 * 60_000 + 15 * 60_000);
  });

  it('construit chapitres depuis événements match', () => {
    const chapters = buildReplayChaptersFromEvents([
      {
        id: 'g1',
        type: 'goal',
        minute: 23,
        player_name: 'Dupont',
        player_uid: 'u1',
        created_at: new Date(),
      },
      {
        id: 'y1',
        type: 'yellow_card',
        minute: 55,
        player_name: 'Martin',
        player_uid: 'u2',
        created_at: new Date(),
      },
    ]);
    expect(chapters).toHaveLength(2);
    expect(chapters[0].minute).toBe(23);
    expect(chapters[1].offsetMs).toBe(minuteToOffsetMs(55));
  });
});

describe('supporter community parse', () => {
  it('parse prédiction score', () => {
    expect(parsePredictionLabel('2-1')).toEqual({ home: 2, away: 1 });
    expect(parsePredictionLabel('n/a')).toBeNull();
  });
});

describe('supporterNotificationPlanner', () => {
  const baseFixture: SupporterMatchViewItem = {
    id: 'fx1',
    source: 'world',
    status: 'upcoming',
    genderScope: 'unspecified',
    homeLabel: 'PSG',
    awayLabel: 'OM',
    startsAt: new Date(Date.now() + 60 * 60_000),
    homeFollowTarget: { type: 'club' as const, id: 'psg', label: 'PSG' },
  };

  it('planifie rappel 1h avant match suivi', () => {
    const reminders = buildKickoffReminders([baseFixture], new Set(['psg']));
    expect(reminders).toHaveLength(1);
    expect(reminders[0].kind).toBe('kickoff_favorite');
  });

  it('détecte but sur changement de score', () => {
    const notif = detectGoalNotification(
      { home: 0, away: 0 },
      { home: 1, away: 0 },
      'PSG vs OM',
      'fx1',
      'psg',
    );
    expect(notif?.title).toBe('BUT !');
  });

  it('respecte prefs supporter', () => {
    const prefs = { ...TEST_NOTIF_PREFS, goalAlerts: false };
    const filtered = filterPlannableNotifications(prefs, [
      {
        id: 'g',
        kind: 'goal_live',
        teamKey: 'a',
        fireAt: new Date(),
        title: 'BUT',
        body: 'test',
      },
      {
        id: 'k',
        kind: 'kickoff_favorite',
        teamKey: 'a',
        fireAt: new Date(),
        title: 'Kick',
        body: 'test',
      },
    ]);
    expect(filtered.map((f) => f.id)).toEqual(['k']);
  });
});
