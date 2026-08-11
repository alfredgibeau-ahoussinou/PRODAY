import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { User } from '../models/User';
import {
  resolveJoueurPageIdentity,
  type JoueurPageIdentity,
} from '../content/joueurPageIdentity';
import {
  resolveJoueurGenderVisual,
  type JoueurAgeGroup,
  type JoueurGenderVisual,
} from '../utils/joueurExperienceTheme';
import {
  ageYearsAsOf,
  isValidPlayerBirthDate,
  JOUEUR_UNIVERSE_LABELS,
  nextAgeGroupTransitionDate,
  resolveJoueurAgeGroupFromBirth,
} from '../utils/joueurBirthAge';
import {
  hasJoueurGateComplete,
  hydrateJoueurGate,
  readJoueurGate,
  writeJoueurGate,
  type JoueurGateProfile,
} from '../utils/joueurGateStorage';
import { profileService } from '../services/profile.service';
import { isJoueurPolePlayer } from '../utils/joueurPoleAccess';

type JoueurSessionValue = {
  ready: boolean;
  /** @deprecated alias — préférer isJoueurPlayer */
  isAmateurPlayer: boolean;
  isJoueurPlayer: boolean;
  needsGate: boolean;
  gate: JoueurGateProfile | null;
  birthDate: string | null;
  ageYears: number | null;
  ageGroup: JoueurAgeGroup;
  gender: JoueurGenderVisual;
  identity: JoueurPageIdentity;
  universeLabel: (typeof JOUEUR_UNIVERSE_LABELS)[JoueurAgeGroup];
  nextTransitionAt: Date | null;
  refreshGate: () => Promise<void>;
  completeGate: (gate: JoueurGateProfile) => void;
};

const Ctx = createContext<JoueurSessionValue | null>(null);

function profileGenderMenWomen(
  gender: string | null | undefined,
  fallback?: 'men' | 'women',
): 'men' | 'women' {
  if (gender === 'women' || gender === 'female') return 'women';
  if (gender === 'men' || gender === 'male') return 'men';
  return fallback ?? 'men';
}

export function JoueurSessionProvider({
  profile,
  children,
}: {
  profile: User | null | undefined;
  children: React.ReactNode;
}) {
  const joueurPlayer = isJoueurPolePlayer(profile);
  const [gate, setGate] = useState<JoueurGateProfile | null>(null);
  const [ready, setReady] = useState(!joueurPlayer);

  const refreshGate = useCallback(async () => {
    if (!profile || !joueurPlayer) {
      setGate(null);
      setReady(true);
      return;
    }
    const g = await readJoueurGate(profile.uid);
    setGate(g);
    setReady(true);
  }, [profile, joueurPlayer]);

  useEffect(() => {
    void refreshGate();
  }, [refreshGate]);

  /**
   * Source de vérité : profil Firebase (admin peut changer birth_date / gender).
   * Le gate local est resynchronisé depuis le profil — plus l’inverse.
   */
  useEffect(() => {
    if (!joueurPlayer || !profile) return;

    const sync = async () => {
      const profileBirth = profile.profile.birth_date ?? null;
      const profileHasBirth =
        Boolean(profileBirth) && isValidPlayerBirthDate(profileBirth).ok;

      if (profileHasBirth && profileBirth) {
        const gender = profileGenderMenWomen(
          profile.profile.gender,
          gate?.gender,
        );
        const live = hydrateJoueurGate({
          gender,
          ageGroup: 'adult',
          age: 0,
          birthDate: profileBirth,
          completedAt: gate?.completedAt ?? new Date().toISOString(),
        });

        if (
          !gate ||
          gate.birthDate !== profileBirth ||
          gate.gender !== gender ||
          gate.ageGroup !== live.ageGroup ||
          gate.age !== live.age
        ) {
          const next = await writeJoueurGate(profile.uid, {
            gender: live.gender,
            ageGroup: live.ageGroup,
            age: live.age,
            birthDate: profileBirth,
          });
          setGate(next);
        }

        if (profile.profile.age !== live.age) {
          try {
            await profileService.updateProfile(profile.uid, {
              profile: { age: live.age },
            });
          } catch {
            // offline ok
          }
        }
        return;
      }

      // Pas de birth_date profil : conserver le gate local (onboarding).
      const birth = gate?.birthDate ?? null;
      if (!birth) return;

      const live = hydrateJoueurGate({
        gender: profileGenderMenWomen(profile.profile.gender, gate?.gender),
        ageGroup: 'adult',
        age: 0,
        birthDate: birth,
        completedAt: gate?.completedAt ?? new Date().toISOString(),
      });

      if (
        gate &&
        (gate.ageGroup !== live.ageGroup || gate.age !== live.age)
      ) {
        const next = await writeJoueurGate(profile.uid, {
          gender: live.gender,
          ageGroup: live.ageGroup,
          age: live.age,
          birthDate: birth,
        });
        setGate(next);
      }

      if (
        profile.profile.age !== live.age ||
        profile.profile.birth_date !== birth
      ) {
        try {
          await profileService.updateProfile(profile.uid, {
            profile: {
              birth_date: birth,
              age: live.age,
              gender: live.gender,
            },
          });
        } catch {
          // offline ok
        }
      }
    };

    void sync();

    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      1,
      0,
    );
    const ms = nextMidnight.getTime() - now.getTime();
    const timer = setTimeout(() => {
      void refreshGate().then(() => void sync());
    }, Math.min(ms, 6 * 60 * 60 * 1000));
    return () => clearTimeout(timer);
  }, [joueurPlayer, profile, gate, refreshGate]);

  // Profil Firebase prioritaire (admin) sur le cache gate local.
  const birthDate =
    profile?.profile.birth_date ?? gate?.birthDate ?? null;
  const ageYears = birthDate
    ? ageYearsAsOf(birthDate)
    : gate?.age ?? profile?.profile.age ?? null;
  const ageGroup: JoueurAgeGroup = birthDate
    ? resolveJoueurAgeGroupFromBirth(birthDate)
    : gate
      ? hydrateJoueurGate(gate).ageGroup
      : 'adult';

  const gender = resolveJoueurGenderVisual(
    profile?.profile.gender ?? gate?.gender,
  );

  const identity = useMemo(
    () =>
      resolveJoueurPageIdentity({
        ageGroup,
        gender,
        displayName: profile?.display_name,
      }),
    [ageGroup, gender, profile?.display_name],
  );

  const needsGate =
    joueurPlayer &&
    ready &&
    !hasJoueurGateComplete({
      gender: profile?.profile.gender,
      age: profile?.profile.age,
      birthDate: profile?.profile.birth_date,
      gate,
    });

  const value = useMemo<JoueurSessionValue>(
    () => ({
      ready,
      isAmateurPlayer: joueurPlayer,
      isJoueurPlayer: joueurPlayer,
      needsGate,
      gate,
      birthDate,
      ageYears,
      ageGroup,
      gender,
      identity,
      universeLabel: JOUEUR_UNIVERSE_LABELS[ageGroup],
      nextTransitionAt: nextAgeGroupTransitionDate(birthDate),
      refreshGate,
      completeGate: (g) => setGate(hydrateJoueurGate(g)),
    }),
    [
      ready,
      joueurPlayer,
      needsGate,
      gate,
      birthDate,
      ageYears,
      ageGroup,
      gender,
      identity,
      refreshGate,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useJoueurSession(): JoueurSessionValue | null {
  return useContext(Ctx);
}

export function useJoueurSessionRequired(): JoueurSessionValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error('useJoueurSessionRequired outside JoueurSessionProvider');
  }
  return ctx;
}
