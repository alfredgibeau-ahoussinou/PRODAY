import {
  advanceJoueurWeekBeat,
  awardJoueurXp,
  claimJoueurDailyQuest,
  completeJoueurChallenge,
  joueurLevelFromXp,
  joueurOvrFromProgress,
  readJoueurUniverseProgress,
  writeJoueurUniverseProgress,
} from '../utils/joueurUniverseProgress';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('joueurUniverseProgress', () => {
  const uid = 'test-player-1';

  beforeEach(async () => {
    await writeJoueurUniverseProgress(uid, {
      stars: 0,
      xp: 0,
      completedChallengeIds: [],
      weekBeatIndex: 0,
      streakDays: 0,
      lastPlayDate: null,
      dailyCompletedIds: [],
      dailyDate: null,
      updatedAt: new Date().toISOString(),
    });
  });

  it('awards stars once per challenge and XP', async () => {
    const a = await completeJoueurChallenge(uid, '1', 1);
    expect(a.progress.stars).toBe(1);
    expect(a.progress.xp).toBe(10);
    const b = await completeJoueurChallenge(uid, '1', 1);
    expect(b.progress.stars).toBe(1);
    const c = await completeJoueurChallenge(uid, '2', 1);
    expect(c.progress.stars).toBe(2);
  });

  it('advances week beat with XP', async () => {
    const next = await advanceJoueurWeekBeat(uid, 7, 25);
    expect(next.xp).toBe(25);
    expect(next.weekBeatIndex).toBe(1);
    const cur = await readJoueurUniverseProgress(uid);
    expect(cur.xp).toBe(25);
  });

  it('cycles week beat index', async () => {
    await writeJoueurUniverseProgress(uid, {
      stars: 0,
      xp: 0,
      completedChallengeIds: [],
      weekBeatIndex: 6,
      streakDays: 0,
      lastPlayDate: null,
      dailyCompletedIds: [],
      dailyDate: null,
      updatedAt: new Date().toISOString(),
    });
    const next = await advanceJoueurWeekBeat(uid, 7, 25);
    expect(next.weekBeatIndex).toBe(0);
    expect(next.xp).toBe(25);
  });

  it('computes level from XP', () => {
    expect(joueurLevelFromXp(0).level).toBe(1);
    expect(joueurLevelFromXp(99).level).toBe(1);
    expect(joueurLevelFromXp(100).level).toBe(2);
    expect(joueurLevelFromXp(250).xpIntoLevel).toBe(50);
  });

  it('awards XP and detects level-up', async () => {
    const result = await awardJoueurXp(uid, 120);
    expect(result.progress.xp).toBe(120);
    expect(result.leveledUp).toBe(true);
    expect(result.nextLevel).toBe(2);
  });

  it('claims daily quests once per day', async () => {
    const a = await claimJoueurDailyQuest(uid, 'daily-login', 15, 1);
    expect(a.alreadyDone).toBe(false);
    expect(a.progress.xp).toBe(15);
    expect(a.progress.stars).toBe(1);
    const b = await claimJoueurDailyQuest(uid, 'daily-login', 15, 1);
    expect(b.alreadyDone).toBe(true);
    expect(b.progress.xp).toBe(15);
  });

  it('derives OVR from progress', () => {
    expect(joueurOvrFromProgress({ xp: 0, stars: 0 })).toBe(60);
    expect(joueurOvrFromProgress({ xp: 400, stars: 5 })).toBeGreaterThan(60);
  });
});
