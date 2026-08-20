import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { User } from '../models/User';
import { isJoueurPolePlayer } from '../utils/joueurPoleAccess';
import {
  awardJoueurXp,
  claimJoueurDailyQuest,
  completeJoueurChallenge,
  joueurLevelFromXp,
  joueurOvrFromProgress,
  touchJoueurPlayDay,
  type JoueurLevelSnapshot,
  type JoueurUniverseProgress,
} from '../utils/joueurUniverseProgress';
import { hydrateJoueurSfxMute } from '../utils/joueurSfxPrefs';
import { joueurGameReward } from '../features/joueur/joueurSfx';

/** Conservé pour réactivation future du modal NIVEAU SUP (non monté en beta). */
export type JoueurLevelUpEvent = {
  from: number;
  to: number;
  at: number;
};

type JoueurProgressValue = {
  ready: boolean;
  progress: JoueurUniverseProgress;
  level: JoueurLevelSnapshot;
  ovr: number;
  /** Toujours null en beta — modal désactivé. */
  levelUp: JoueurLevelUpEvent | null;
  clearLevelUp: () => void;
  refresh: () => Promise<void>;
  claimDaily: (questId: string, xp: number, stars?: number) => Promise<boolean>;
  claimChallenge: (challengeId: string, starsGain: number) => Promise<boolean>;
  grantXp: (xp: number, stars?: number) => Promise<void>;
};

const Ctx = createContext<JoueurProgressValue | null>(null);

const EMPTY: JoueurUniverseProgress = {
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

export function JoueurProgressProvider({
  profile,
  children,
}: {
  profile: User | null | undefined;
  children: React.ReactNode;
}) {
  const enabled = isJoueurPolePlayer(profile);
  const uid = profile?.uid;
  const [ready, setReady] = useState(!enabled);
  const [progress, setProgress] = useState<JoueurUniverseProgress>(EMPTY);

  const refresh = useCallback(async () => {
    if (!enabled || !uid) {
      setProgress(EMPTY);
      setReady(true);
      return;
    }
    const p = await touchJoueurPlayDay(uid);
    setProgress(p);
    setReady(true);
  }, [enabled, uid]);

  useEffect(() => {
    void hydrateJoueurSfxMute();
    void refresh();
  }, [refresh]);

  const claimDaily = useCallback(
    async (questId: string, xp: number, stars = 0) => {
      if (!uid) return false;
      const result = await claimJoueurDailyQuest(uid, questId, xp, stars);
      setProgress(result.progress);
      if (result.alreadyDone) return false;
      joueurGameReward(result.leveledUp ? 'levelup' : stars > 0 ? 'star' : 'xp');
      return true;
    },
    [uid],
  );

  const claimChallenge = useCallback(
    async (challengeId: string, starsGain: number) => {
      if (!uid) return false;
      if (progress.completedChallengeIds.includes(challengeId)) return false;
      const result = await completeJoueurChallenge(uid, challengeId, starsGain);
      setProgress(result.progress);
      if (result.alreadyDone) return false;
      joueurGameReward(result.leveledUp ? 'levelup' : 'star');
      return true;
    },
    [uid, progress.completedChallengeIds],
  );

  const grantXp = useCallback(
    async (xp: number, stars = 0) => {
      if (!uid) return;
      const result = await awardJoueurXp(uid, xp, { starsGain: stars });
      setProgress(result.progress);
      joueurGameReward(result.leveledUp ? 'levelup' : 'xp');
    },
    [uid],
  );

  const value = useMemo<JoueurProgressValue>(() => {
    const level = joueurLevelFromXp(progress.xp);
    return {
      ready,
      progress,
      level,
      ovr: joueurOvrFromProgress(progress),
      levelUp: null,
      clearLevelUp: () => {},
      refresh,
      claimDaily,
      claimChallenge,
      grantXp,
    };
  }, [ready, progress, refresh, claimDaily, claimChallenge, grantXp]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useJoueurProgress(): JoueurProgressValue | null {
  return useContext(Ctx);
}

export function useJoueurProgressRequired(): JoueurProgressValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useJoueurProgressRequired outside JoueurProgressProvider');
  return v;
}
