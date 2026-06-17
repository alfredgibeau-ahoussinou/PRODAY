import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { TeamEvent } from '../../models/TeamEvent';
import { aggregateCarpoolBalance } from '../../utils/carpoolBalance';
import { StaggerReveal } from '../motion';
import { ProDayGradient } from '../ui/ProDayGradient';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';
import { CarpoolEmptyState, CarpoolSectionIntro } from './carpoolUi';

interface CarpoolBalancePanelProps {
  events: TeamEvent[];
  onPropose?: () => void;
}

export const CarpoolBalancePanel: React.FC<CarpoolBalancePanelProps> = ({ events, onPropose }) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const balance = aggregateCarpoolBalance(events);

  if (balance.length === 0) {
    return (
      <CarpoolEmptyState
        icon="car"
        title={t('carpool.balance.noDriver')}
        subtitle={t('carpool.balance.emptySub')}
        ctaLabel={onPropose ? t('carpool.cta.proposeTrip') : undefined}
        onCta={onPropose}
      />
    );
  }

  const leader = balance[0];

  return (
    <View style={styles.list}>
      <CarpoolSectionIntro
        icon="people"
        title={t('carpool.balance.title')}
        subtitle={t('carpool.balance.subtitle')}
      />

      {leader ? (
        <View style={styles.leaderCard}>
          <ProDayGradient kind="cta" style={styles.leaderGradient} />
          <View style={styles.leaderContent}>
            <View style={styles.leaderBadge}>
              <Icon name="car" size={20} color="#fff" variant="filled" />
            </View>
            <View style={styles.leaderCopy}>
              <ProDayText variant="caption" inverse muted>
                {t('carpool.balance.topDriver')}
              </ProDayText>
              <ProDayText variant="section" inverse style={styles.leaderName}>
                {leader.name}
              </ProDayText>
              <ProDayText variant="caption" inverse style={styles.leaderMeta}>
                {leader.trips > 1
                  ? t('carpool.balance.trips', { n: leader.trips })
                  : t('carpool.balance.trip', { n: leader.trips })}
              </ProDayText>
            </View>
          </View>
        </View>
      ) : null}

      {balance.map((row, index) => (
        <StaggerReveal key={row.uid} index={index}>
          <View style={[styles.row, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <View style={[styles.rank, { backgroundColor: colors.accentSoft }]}>
              <ProDayText variant="caption" accent style={styles.rankText}>
                {index + 1}
              </ProDayText>
            </View>
            <View style={styles.copy}>
              <ProDayText variant="section">{row.name}</ProDayText>
              <ProDayText variant="caption" muted>
                {row.trips > 1
                  ? t('carpool.balance.rowTrips', { n: row.trips })
                  : t('carpool.balance.rowTrip', { n: row.trips })}
                {row.last_trip_at
                  ? t('carpool.balance.lastTrip', {
                      date: row.last_trip_at.toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                      }),
                    })
                  : ''}
              </ProDayText>
            </View>
            <View style={[styles.tripsPill, { backgroundColor: colors.surfaceMuted }]}>
              <ProDayText variant="caption" accent style={styles.tripsText}>
                {row.trips}
              </ProDayText>
            </View>
          </View>
        </StaggerReveal>
      ))}
    </View>
  );
};

function createStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    list: { gap: spacing.sm },
    leaderCard: {
      borderRadius: radius.lg,
      overflow: 'hidden',
      marginBottom: spacing.sm,
    },
    leaderGradient: { ...StyleSheet.absoluteFillObject },
    leaderContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
    },
    leaderBadge: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    leaderCopy: { flex: 1, gap: 2 },
    leaderName: { fontWeight: '800' },
    leaderMeta: { fontWeight: '700', opacity: 0.9 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      borderWidth: 1,
      borderRadius: radius.lg,
      padding: spacing.md,
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
    copy: { flex: 1 },
    tripsPill: {
      minWidth: 36,
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.pill,
    },
    tripsText: { fontWeight: '900' },
  });
}
