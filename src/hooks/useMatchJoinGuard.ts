import { useCallback } from 'react';
import { Alert } from 'react-native';
import type { User } from '../models/User';
import type { FriendlyMatch } from '../models/FriendlyMatch';
import type { MatchJoinValidation } from '../core/types/recommendation';
import { validateMatchJoin } from '../core/recommendation/recommendation.engine';
import { isV3ShellEnabled } from '../config/featureFlags';
import { distanceBetween } from '../utils/geoLocation';
import { useProDayBrain } from './useProDayBrain';
import { useAppTheme } from '../context/ProductLineContext';
import { trackV3Event } from '../core/analytics/v3Events';

function scoreLevel(userLevel?: string, matchLevel?: string): number {
  if (!userLevel || !matchLevel) return 50;
  const u = userLevel.toLowerCase();
  const m = matchLevel.toLowerCase();
  if (u === m) return 100;
  if (u.includes(m) || m.includes(u)) return 75;
  return 40;
}

/** Garde santé V3 — bloque ou avertit avant acceptation match / RSVP oui. */
export function useMatchJoinGuard(profile: User | null) {
  const { productLine } = useAppTheme();
  const brain = useProDayBrain(profile, productLine);
  const health = brain.ai.health;

  const checkMatch = useCallback(
    (match: FriendlyMatch): MatchJoinValidation => {
      const rec = brain.ai.matchRecommendations.find((m) => m.id === match.id);
      return validateMatchJoin({
        health,
        distanceKm: rec?.distanceKm ?? distanceBetween(profile?.location, match.location),
        levelScore: rec?.iaLevelScore ?? scoreLevel(profile?.profile.level, match.level),
      });
    },
    [brain.ai.matchRecommendations, health, profile]
  );

  const guardAction = useCallback(
    (label: string, check: MatchJoinValidation, onProceed: () => void) => {
      if (!isV3ShellEnabled()) {
        onProceed();
        return;
      }
      if (check.allowed) {
        trackV3Event('match_join_allowed', { action: label });
        onProceed();
        return;
      }
      trackV3Event('match_join_blocked', { action: label, reasons: check.reasons });
      Alert.alert('Participation déconseillée', check.reasons.join('\n'), [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Continuer quand même',
          style: 'destructive',
          onPress: () => {
            trackV3Event('match_join_override', { action: label });
            onProceed();
          },
        },
      ]);
    },
    []
  );

  const guardAcceptMatch = useCallback(
    (match: FriendlyMatch, onProceed: () => void) => {
      guardAction('accept_match', checkMatch(match), onProceed);
    },
    [checkMatch, guardAction]
  );

  const guardRsvpYes = useCallback(
    (onProceed: () => void) => {
      const check = validateMatchJoin({
        health,
        distanceKm: null,
        levelScore: 80,
      });
      guardAction('rsvp_yes', check, onProceed);
    },
    [guardAction, health]
  );

  const getMatchIaScore = useCallback(
    (matchId: string) => brain.ai.matchRecommendations.find((m) => m.id === matchId)?.iaScore,
    [brain.ai.matchRecommendations]
  );

  const isHealthBlocked = health.state === 'INJURY_RISK' || health.state === 'OVERLOADED';

  return {
    health,
    guardAcceptMatch,
    guardRsvpYes,
    checkMatch,
    getMatchIaScore,
    isHealthBlocked,
  };
}
