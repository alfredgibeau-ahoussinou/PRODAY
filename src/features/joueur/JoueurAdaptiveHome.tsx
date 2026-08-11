import React, { useCallback, useMemo } from 'react';
import type { User } from '../../models/User';
import { useJoueurSession } from '../../context/JoueurSessionContext';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import {
  resolveJoueurExperienceTheme,
  resolveJoueurAgeGroup,
  resolveJoueurGenderVisual,
} from '../../utils/joueurExperienceTheme';
import { resolveJoueurPageIdentity } from '../../content/joueurPageIdentity';
import { computeHealthSnapshot } from '../../core/health/healthState.engine';
import { getProfileCompletion } from '../../utils/profileCompletion';
import { YouthUniverseScreen } from './YouthUniverseScreen';
import { TeenUniverseScreen } from './TeenUniverseScreen';
import { AdultUniverseScreen } from './AdultUniverseScreen';

type Props = {
  profile: User;
  onRefresh?: () => void;
  refreshing?: boolean;
};

/**
 * Routeur âge — miroir JoueurAdaptiveExperience (site).
 * Amateur + pro_player partagent la même home univers.
 */
export function JoueurAdaptiveHome({ profile, onRefresh, refreshing }: Props) {
  const session = useJoueurSession();
  const nav = useTabNavigationActions();

  const ageGroup =
    session?.ageGroup ??
    resolveJoueurAgeGroup({
      age: profile.profile.age,
      birthDate: profile.profile.birth_date,
      gender: profile.profile.gender,
    });

  const gender =
    session?.gender ?? resolveJoueurGenderVisual(profile.profile.gender);

  const identity = useMemo(
    () =>
      session?.identity ??
      resolveJoueurPageIdentity({
        ageGroup,
        gender,
        displayName: profile.display_name,
      }),
    [session?.identity, ageGroup, gender, profile.display_name],
  );

  const theme = useMemo(
    () =>
      resolveJoueurExperienceTheme({
        age: session?.ageYears ?? profile.profile.age,
        birthDate: session?.birthDate ?? profile.profile.birth_date,
        gender: session?.gate?.gender ?? profile.profile.gender,
        position: profile.profile.position,
      }),
    [
      session?.ageYears,
      session?.birthDate,
      session?.gate?.gender,
      profile.profile.age,
      profile.profile.birth_date,
      profile.profile.gender,
      profile.profile.position,
    ],
  );

  const health = useMemo(
    () =>
      computeHealthSnapshot({
        globalScore: 70,
        upcomingEventsCount: 0,
        pendingConvocations: 0,
        recentMatchCount: 0,
        streakDays: 0,
        profileCompletion: getProfileCompletion(profile).percent,
      }),
    [profile],
  );

  const onOpenTrain = useCallback(() => nav.openDashboard('train'), [nav]);
  const onOpenPass = useCallback(() => {
    nav.openDashboard('tactics_coach');
  }, [nav]);
  const onOpenCoach = useCallback(() => nav.openDashboard('tactics_coach'), [nav]);
  const onOpenMatchs = useCallback(() => nav.openMatchs(), [nav]);
  const onOpenClub = useCallback(() => nav.setActiveTab('recrutement'), [nav]);
  const onOpenProfile = useCallback(() => nav.setActiveTab('profil'), [nav]);

  const shared = {
    profile,
    theme,
    identity,
    onOpenTrain,
    onOpenPass,
    onOpenCoach,
    onOpenMatchs,
    onOpenClub,
    onRefresh,
    refreshing,
  };

  if (theme.ageGroup === 'youth') {
    return <YouthUniverseScreen {...shared} />;
  }
  if (theme.ageGroup === 'teen') {
    return <TeenUniverseScreen {...shared} />;
  }
  return (
    <AdultUniverseScreen
      {...shared}
      health={health}
      onOpenProfile={onOpenProfile}
    />
  );
}
