import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableSpring } from '../discover/PressableSpring';
import type { ProdayPulseResult } from '../../utils/prodayPulse';
import { Icon } from '../ui/Icon';
import { colors, spacing, radius } from '../../theme/designTokens';

interface DashboardPulseBoostProps {
  pulse: ProdayPulseResult;
  pendingConvocations: number;
  profileComplete: number;
  onProfile: () => void;
  onMatchs: () => void;
  onRecruitment: () => void;
}

export const DashboardPulseBoost: React.FC<DashboardPulseBoostProps> = ({
  pulse,
  pendingConvocations,
  profileComplete,
  onProfile,
  onMatchs,
  onRecruitment,
}) => {
  const actions: { label: string; sub: string; onPress: () => void }[] = [];

  if (profileComplete < 80) {
    actions.push({
      label: 'Booster mon profil',
      sub: `+${100 - profileComplete}% visibilité possible`,
      onPress: onProfile,
    });
  }
  if (pendingConvocations > 0) {
    actions.push({
      label: `${pendingConvocations} convocation${pendingConvocations > 1 ? 's' : ''} à confirmer`,
      sub: 'Répondez pour monter votre Pulse',
      onPress: onMatchs,
    });
  }
  if (pulse.tier === 'starter' || pulse.tier === 'rising') {
    actions.push({
      label: 'Explorer le Mercato',
      sub: 'Annonces & détections exclusives',
      onPress: onRecruitment,
    });
  }

  if (actions.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Icon name="star-four-points" size={18} color={colors.accent} />
        <Text style={styles.title}>Boost Pulse</Text>
      </View>
      {actions.slice(0, 2).map((a) => (
        <PressableSpring key={a.label} style={styles.row} onPress={a.onPress} scaleTo={0.98}>
          <View style={styles.rowBody}>
            <Text style={styles.rowLabel}>{a.label}</Text>
            <Text style={styles.rowSub}>{a.sub}</Text>
          </View>
          <Icon name="chevron-forward" size={18} color={colors.accent} />
        </PressableSpring>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  title: { fontSize: 14, fontWeight: '900', color: colors.accent },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,51,153,0.15)',
  },
  rowBody: { flex: 1 },
  rowLabel: { fontSize: 13, fontWeight: '800', color: colors.text },
  rowSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
