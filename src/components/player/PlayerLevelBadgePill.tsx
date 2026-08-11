import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { User } from '../../models/User';
import { playerLevelBadgeFor } from '../../utils/playerLevelBadge';
import { hasJoueurVerifieBadge, JOUEUR_VERIFIE_BADGE } from '../../utils/proPlayerVerification';
import { ProDayText } from '../ui/ProDayText';
import { spacing, radius } from '../../theme/designTokens';

type Props = {
  user: Pick<User, 'player_level' | 'product_line' | 'profile' | 'role' | 'player_verification' | 'club_certification_verified' | 'is_verified' | 'verification_status'>;
  /** Affiche aussi le badge Joueur vérifié si applicable. */
  showVerified?: boolean;
  compact?: boolean;
};

/** Pills Amateur / Formation / Haut niveau (bleu ProDay) + optionnel Joueur vérifié. */
export function PlayerLevelBadgePill({ user, showVerified = true, compact }: Props) {
  if (user.role !== 'player') return null;
  const badge = playerLevelBadgeFor(user);
  const verified = showVerified && hasJoueurVerifieBadge(user);

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.pill,
          compact && styles.pillCompact,
          { backgroundColor: `${badge.colorHex}22`, borderColor: `${badge.colorHex}66` },
        ]}
      >
        <View style={[styles.dot, { backgroundColor: badge.colorHex }]} />
        <ProDayText
          variant="caption"
          style={[styles.label, { color: badge.colorHex }]}
          numberOfLines={1}
        >
          {compact ? badge.shortLabel : badge.label}
        </ProDayText>
      </View>
      {verified ? (
        <View
          style={[
            styles.pill,
            compact && styles.pillCompact,
            {
              backgroundColor: `${JOUEUR_VERIFIE_BADGE.colorHex}22`,
              borderColor: `${JOUEUR_VERIFIE_BADGE.colorHex}66`,
            },
          ]}
        >
          <ProDayText
            variant="caption"
            style={[styles.label, { color: JOUEUR_VERIFIE_BADGE.colorHex }]}
            numberOfLines={1}
          >
            {JOUEUR_VERIFIE_BADGE.shortLabel}
          </ProDayText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillCompact: { paddingHorizontal: 6, paddingVertical: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontWeight: '700', fontSize: 11 },
});
