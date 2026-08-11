import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import type { TeamEvent } from '../../models/TeamEvent';
import { aggregateCarpoolBalance } from '../../utils/carpoolBalance';
import { StaggerReveal } from '../motion';
import { Icon } from '../ui/Icon';
import { useTranslation } from '../../context/LocaleContext';
import { spacing } from '../../theme/designTokens';
import { CARPOOL_SITE } from '../../content/carpoolSite';
import { CarpoolEmptyState, CarpoolSectionIntro } from './carpoolUi';

interface CarpoolBalancePanelProps {
  events: TeamEvent[];
  onPropose?: () => void;
}

export const CarpoolBalancePanel: React.FC<CarpoolBalancePanelProps> = ({ events, onPropose }) => {
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(), []);
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
          <View style={styles.leaderBadge}>
            <Icon name="car" size={18} color={CARPOOL_SITE.asphalt} variant="filled" />
          </View>
          <View style={styles.leaderCopy}>
            <Text style={styles.leaderKicker}>{t('carpool.balance.topDriver')}</Text>
            <Text style={styles.leaderName}>{leader.name}</Text>
            <Text style={styles.leaderMeta}>
              {leader.trips > 1
                ? t('carpool.balance.trips', { n: leader.trips })
                : t('carpool.balance.trip', { n: leader.trips })}
            </Text>
          </View>
        </View>
      ) : null}

      {balance.map((row, index) => (
        <StaggerReveal key={row.uid} index={index}>
          <View style={styles.row}>
            <View style={styles.rank}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <View style={styles.copy}>
              <Text style={styles.rowName}>{row.name}</Text>
              <Text style={styles.rowMeta}>
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
              </Text>
            </View>
            <Text style={styles.trips}>{row.trips}</Text>
          </View>
        </StaggerReveal>
      ))}
    </View>
  );
};

function createStyles() {
  return StyleSheet.create({
    list: { gap: spacing.sm },
    leaderCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      backgroundColor: CARPOOL_SITE.signal,
      borderRadius: 16,
      marginBottom: spacing.sm,
    },
    leaderBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(11,18,32,0.12)',
    },
    leaderCopy: { flex: 1, gap: 2 },
    leaderKicker: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: CARPOOL_SITE.asphalt,
      opacity: 0.7,
    },
    leaderName: {
      fontFamily: CARPOOL_SITE.display,
      fontSize: 18,
      fontWeight: '800',
      color: CARPOOL_SITE.asphalt,
    },
    leaderMeta: { fontSize: 12, fontWeight: '700', color: CARPOOL_SITE.asphalt },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      borderWidth: 1.5,
      borderColor: CARPOOL_SITE.fog,
      backgroundColor: CARPOOL_SITE.surface,
      borderRadius: 14,
      padding: spacing.md,
      marginBottom: spacing.xs,
    },
    rank: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: CARPOOL_SITE.signalSoft,
    },
    rankText: { fontWeight: '900', color: CARPOOL_SITE.signalDeep, fontSize: 12 },
    copy: { flex: 1 },
    rowName: { fontWeight: '800', color: CARPOOL_SITE.ink, fontSize: 15 },
    rowMeta: { fontSize: 12, color: CARPOOL_SITE.inkMuted, marginTop: 2 },
    trips: {
      fontFamily: CARPOOL_SITE.display,
      fontSize: 18,
      fontWeight: '800',
      color: CARPOOL_SITE.signalDeep,
    },
  });
}
