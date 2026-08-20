import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'proday_joueur_universe_progress_v1';

/** XP requis pour passer du niveau L au niveau L+1. */
export const JOUEUR_XP_PER_LEVEL = 100;

export type JoueurUniverseProgress = {
  stars: number;
  xp: number;
  completedChallengeIds: string[];
  weekBeatIndex: number;
  /** Jours consécutifs de jeu (UTC date). */
  streakDays: number;
  /** Dernière date de jeu `YYYY-MM-DD` (UTC). */
  lastPlayDate: string | null;
  /** Quêtes daily complétées pour `dailyDate`. */
  dailyCompletedIds: string[];
  /** Jour UTC des quêtes daily. */
  dailyDate: string | null;
  updatedAt: string;
};

export type JoueurLevelSnapshot = {
  level: number;
  xpIntoLevel: number;
  xpForNext: number;
  progress01: number;
};

const DEFAULT: JoueurUniverseProgress = {
  stars: 0,
  xp: 0,
  completedChallengeIds: [],
  weekBeatIndex: 0,
  streakDays: 0,
  lastPlayDate: null,
  dailyCompletedIds: [],
  dailyDate: null,
  updatedAt: new Date().toISOString(),
};

export function utcDateKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function joueurLevelFromXp(xp: number): JoueurLevelSnapshot {
  const safe = Math.max(0, Math.floor(xp));
  const level = Math.floor(safe / JOUEUR_XP_PER_LEVEL) + 1;
  const xpIntoLevel = safe % JOUEUR_XP_PER_LEVEL;
  return {
    level,
    xpIntoLevel,
    xpForNext: JOUEUR_XP_PER_LEVEL,
    progress01: xpIntoLevel / JOUEUR_XP_PER_LEVEL,
  };
}

/** OVR cosmétique dérivé du niveau + étoiles (style FUT). */
export function joueurOvrFromProgress(progress: Pick<JoueurUniverseProgress, 'xp' | 'stars'>): number {
  const { level } = joueurLevelFromXp(progress.xp);
  return Math.min(99, 58 + level * 2 + Math.min(12, progress.stars));
}

function yesterdayKey(from = utcDateKey()): string {
  const d = new Date(`${from}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return utcDateKey(d);
}

export async function readJoueurUniverseProgress(
  uid: string,
): Promise<JoueurUniverseProgress> {
  try {
    const raw = await AsyncStorage.getItem(`${KEY}:${uid}`);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...(JSON.parse(raw) as Partial<JoueurUniverseProgress>) };
  } catch {
    return { ...DEFAULT };
  }
}

export async function writeJoueurUniverseProgress(
  uid: string,
  next: JoueurUniverseProgress,
): Promise<JoueurUniverseProgress> {
  const full = { ...next, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(`${KEY}:${uid}`, JSON.stringify(full));
  return full;
}

function withFreshDaily(cur: JoueurUniverseProgress, today = utcDateKey()): JoueurUniverseProgress {
  if (cur.dailyDate === today) return cur;
  return {
    ...cur,
    dailyDate: today,
    dailyCompletedIds: [],
  };
}

function withStreak(cur: JoueurUniverseProgress, today = utcDateKey()): JoueurUniverseProgress {
  if (cur.lastPlayDate === today) return cur;
  const nextStreak =
    cur.lastPlayDate === yesterdayKey(today) ? Math.max(1, cur.streakDays) + 1 : 1;
  return {
    ...cur,
    lastPlayDate: today,
    streakDays: nextStreak,
  };
}

export type JoueurAwardResult = {
  progress: JoueurUniverseProgress;
  leveledUp: boolean;
  previousLevel: number;
  nextLevel: number;
  xpGained: number;
};

export async function awardJoueurXp(
  uid: string,
  xpGain: number,
  opts?: { starsGain?: number },
): Promise<JoueurAwardResult> {
  const gain = Math.max(0, Math.floor(xpGain));
  const starsGain = Math.max(0, Math.floor(opts?.starsGain ?? 0));
  let cur = await readJoueurUniverseProgress(uid);
  const prevLevel = joueurLevelFromXp(cur.xp).level;
  cur = withStreak(withFreshDaily(cur));
  const progress = await writeJoueurUniverseProgress(uid, {
    ...cur,
    xp: cur.xp + gain,
    stars: cur.stars + starsGain,
  });
  const nextLevel = joueurLevelFromXp(progress.xp).level;
  return {
    progress,
    leveledUp: nextLevel > prevLevel,
    previousLevel: prevLevel,
    nextLevel,
    xpGained: gain,
  };
}

export async function completeJoueurChallenge(
  uid: string,
  challengeId: string,
  starsGain = 1,
): Promise<JoueurAwardResult & { alreadyDone: boolean }> {
  let cur = await readJoueurUniverseProgress(uid);
  cur = withStreak(withFreshDaily(cur));
  const prevLevel = joueurLevelFromXp(cur.xp).level;
  if (cur.completedChallengeIds.includes(challengeId)) {
    return {
      progress: cur,
      leveledUp: false,
      previousLevel: prevLevel,
      nextLevel: prevLevel,
      xpGained: 0,
      alreadyDone: true,
    };
  }
  const xpGain = Math.max(0, starsGain) * 10;
  const progress = await writeJoueurUniverseProgress(uid, {
    ...cur,
    stars: cur.stars + Math.max(0, starsGain),
    xp: cur.xp + xpGain,
    completedChallengeIds: [...cur.completedChallengeIds, challengeId],
  });
  const nextLevel = joueurLevelFromXp(progress.xp).level;
  return {
    progress,
    leveledUp: nextLevel > prevLevel,
    previousLevel: prevLevel,
    nextLevel,
    xpGained: xpGain,
    alreadyDone: false,
  };
}

export async function claimJoueurDailyQuest(
  uid: string,
  questId: string,
  xpGain: number,
  starsGain = 0,
): Promise<JoueurAwardResult & { alreadyDone: boolean }> {
  let cur = await readJoueurUniverseProgress(uid);
  cur = withStreak(withFreshDaily(cur));
  if (cur.dailyCompletedIds.includes(questId)) {
    return {
      progress: cur,
      leveledUp: false,
      previousLevel: joueurLevelFromXp(cur.xp).level,
      nextLevel: joueurLevelFromXp(cur.xp).level,
      xpGained: 0,
      alreadyDone: true,
    };
  }
  const prevLevel = joueurLevelFromXp(cur.xp).level;
  const progress = await writeJoueurUniverseProgress(uid, {
    ...cur,
    xp: cur.xp + Math.max(0, xpGain),
    stars: cur.stars + Math.max(0, starsGain),
    dailyCompletedIds: [...cur.dailyCompletedIds, questId],
  });
  const nextLevel = joueurLevelFromXp(progress.xp).level;
  return {
    progress,
    leveledUp: nextLevel > prevLevel,
    previousLevel: prevLevel,
    nextLevel,
    xpGained: Math.max(0, xpGain),
    alreadyDone: false,
  };
}

export async function advanceJoueurWeekBeat(
  uid: string,
  maxBeats: number,
  xpGain = 25,
): Promise<JoueurUniverseProgress> {
  let cur = await readJoueurUniverseProgress(uid);
  cur = withStreak(withFreshDaily(cur));
  const nextIndex =
    maxBeats <= 0 ? 0 : (cur.weekBeatIndex + 1) % Math.max(1, maxBeats);
  return writeJoueurUniverseProgress(uid, {
    ...cur,
    xp: cur.xp + xpGain,
    weekBeatIndex: nextIndex,
  });
}

export async function touchJoueurPlayDay(uid: string): Promise<JoueurUniverseProgress> {
  let cur = await readJoueurUniverseProgress(uid);
  cur = withStreak(withFreshDaily(cur));
  return writeJoueurUniverseProgress(uid, cur);
}
