import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableSpring } from '../discover/PressableSpring';
import type { ProdayPulseResult } from '../../utils/prodayPulse';
import { Icon } from '../ui/Icon';
import { spacing, radius } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';

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
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
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
        <Icon name="star-four-points" size={18} color={c.accent} />
        <Text style={styles.title}>Boost Pulse</Text>
      </View>
      {actions.slice(0, 2).map((a) => (
        <PressableSpring key={a.label} style={styles.row} onPress={a.onPress} scaleTo={0.98}>
          <View style={styles.rowBody}>
            <Text style={styles.rowLabel}>{a.label}</Text>
            <Text style={styles.rowSub}>{a.sub}</Text>
          </View>
          <Icon name="chevron-forward" size={18} color={c.accent} />
        </PressableSpring>
      ))}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      marginBottom: spacing.lg,
      backgroundColor: c.accentSoft,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.accent,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
    title: { fontSize: 14, fontWeight: '900', color: c.accent },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    rowBody: { flex: 1 },
    rowLabel: { fontSize: 13, fontWeight: '800', color: c.text },
    rowSub: { fontSize: 11, color: c.textMuted, marginTop: 2 },
  });
}
