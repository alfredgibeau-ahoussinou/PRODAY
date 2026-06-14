import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { TeamEvent } from '../../models/TeamEvent';
import { aggregateCarpoolBalance } from '../../utils/carpoolBalance';
import { StaggerReveal, PressableSpring } from '../motion';
import { ProDayGradient } from '../ui/ProDayGradient';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

interface CarpoolBalancePanelProps {
  events: TeamEvent[];
  onPropose?: () => void;
}

export const CarpoolBalancePanel: React.FC<CarpoolBalancePanelProps> = ({ events, onPropose }) => {
  const { colors } = useAppTheme();
  const balance = aggregateCarpoolBalance(events);

  if (balance.length === 0) {
    return (
      <ProDaySurface variant="module" style={styles.empty}>
        <Icon name="car" size={32} color={colors.textMuted} />
        <ProDayText variant="section">Aucun conducteur</ProDayText>
        <ProDayText variant="body" muted style={styles.emptySub}>
          Les trajets proposés apparaîtront ici pour équilibrer les déplacements.
        </ProDayText>
      </ProDaySurface>
    );
  }

  return (
    <View style={styles.list}>
      <ProDayText variant="eyebrow" accent style={styles.lead}>
        Équilibre des trajets
      </ProDayText>
      <ProDayText variant="body" muted style={styles.sub}>
        Qui conduit le plus souvent — pensez à alterner !
      </ProDayText>
      {balance.map((row, index) => (
        <StaggerReveal key={row.uid} index={index}>
        <ProDaySurface
          variant="module"
          style={[styles.row, { borderColor: colors.border }]}
        >
          <View style={[styles.rank, { backgroundColor: colors.accentSoft }]}>
            <ProDayText variant="caption" accent style={styles.rankText}>
              {index + 1}
            </ProDayText>
          </View>
          <View style={styles.copy}>
            <ProDayText variant="section">{row.name}</ProDayText>
            <ProDayText variant="caption" muted>
              {row.trips} trajet{row.trips > 1 ? 's' : ''}
              {row.last_trip_at
                ? ` · dernier ${row.last_trip_at.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
                : ''}
            </ProDayText>
          </View>
          <Icon name="car" size={18} color={colors.accent} variant="filled" />
        </ProDaySurface>
        </StaggerReveal>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  lead: { marginBottom: 4 },
  sub: { marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  rank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { fontWeight: '900' },
  copy: { flex: 1, gap: 2 },
  empty: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  emptySub: { textAlign: 'center' },
  cta: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  ctaText: { fontWeight: '800' },
});
