import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import type { TeamEvent } from '../../models/TeamEvent';
import { aggregateCarpoolBalance } from '../../utils/carpoolBalance';
import { StaggerReveal } from '../motion';
import { Icon } from '../ui/Icon';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';
import {
  type CarpoolUiPalette,
  useCarpoolThemedStyles,
  useCarpoolUi,
} from './CarpoolUiContext';
import { CARPOOL_SITE } from '../../content/carpoolSite';

interface CarpoolBalancePanelProps {
  events: TeamEvent[];
  onPropose?: () => void;
}

export const CarpoolBalancePanel: React.FC<CarpoolBalancePanelProps> = ({ events, onPropose }) => {
  const { t } = useTranslation();
  const palette = useCarpoolUi();
  const styles = useCarpoolThemedStyles(createStyles);
  const realBalance = aggregateCarpoolBalance(events);

  if (realBalance.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <View
          style={[
            styles.leaderBadge,
            { backgroundColor: `${palette.signal}18`, borderColor: `${palette.signal}35`, alignSelf: 'center' },
          ]}
        >
          <Icon name="trophy" size={22} color={palette.signal} />
        </View>
        <Text style={styles.emptyTitle}>Classement des conducteurs</Text>
        <Text style={styles.emptyMeta}>
          Les membres du groupe ayant assuré des covoiturages apparaîtront ici.
        </Text>
      </View>
    );
  }

  const leader = realBalance[0];

  return (
    <View style={styles.list}>
      {leader ? (
        <View style={styles.leaderCard}>
          <View
            style={[
              styles.leaderBadge,
              { backgroundColor: `${palette.signal}20`, borderColor: `${palette.signal}50` },
            ]}
          >
            <Icon name="trophy" size={20} color={palette.signal} />
          </View>
          <View style={styles.leaderCopy}>
            <View style={styles.leaderKickerRow}>
              <Text style={[styles.leaderKicker, { color: palette.signal }]}>
                TOP CONDUCTEUR DU CLUB
              </Text>
            </View>
            <Text style={styles.leaderName}>{leader.name}</Text>
            <Text style={styles.leaderMeta}>
              {leader.trips} trajets partagés · ~{leader.trips * 3} coéquipiers véhiculés
            </Text>
          </View>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>CLASSEMENT MOBILITÉ ÉQUIPE</Text>

      {realBalance.map((row, index) => {
        return (
          <StaggerReveal key={row.uid} index={index}>
            <View style={styles.row}>
              <View
                style={[
                  styles.rank,
                  index < 3 && { backgroundColor: '#1C1D26', borderColor: '#282836' },
                ]}
              >
                <Text style={styles.rankText}>#{index + 1}</Text>
              </View>
              <View style={styles.copy}>
                <Text style={styles.rowName}>{row.name}</Text>
                <Text style={styles.rowMeta}>
                  {row.trips} trajet{row.trips > 1 ? 's' : ''} assuré{row.trips > 1 ? 's' : ''}
                </Text>
              </View>
              <View
                style={[
                  styles.tripsBadge,
                  { backgroundColor: `${palette.signal}18`, borderColor: `${palette.signal}35` },
                ]}
              >
                <Icon name="car" size={12} color={palette.signal} />
                <Text style={[styles.tripsText, { color: palette.signal }]}>{row.trips}</Text>
              </View>
            </View>
          </StaggerReveal>
        );
      })}
    </View>
  );
};

function createStyles(palette: CarpoolUiPalette) {
  return StyleSheet.create({
    list: { gap: 10 },
    leaderCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: 16,
      backgroundColor: CARPOOL_SITE.surface,
      borderWidth: 1,
      borderColor: CARPOOL_SITE.lane,
      borderRadius: 18,
      marginBottom: 8,
    },
    leaderBadge: {
      width: 46,
      height: 46,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    leaderCopy: { flex: 1, gap: 2 },
    leaderKickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    leaderKicker: {
      fontSize: 10.5,
      fontWeight: '900',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    leaderName: {
      fontSize: 16,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: -0.2,
    },
    leaderMeta: {
      fontSize: 12,
      fontWeight: '600',
      color: '#A1A1AA',
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: '#8B8B9A',
      textTransform: 'uppercase',
      marginLeft: 4,
      marginTop: 6,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1,
      borderColor: CARPOOL_SITE.lane,
      backgroundColor: CARPOOL_SITE.surface,
      borderRadius: 16,
      padding: 14,
      marginBottom: 4,
    },
    rank: {
      width: 32,
      height: 32,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    },
    rankText: {
      fontWeight: '900',
      color: '#FFFFFF',
      fontSize: 14,
    },
    copy: { flex: 1 },
    rowName: {
      fontWeight: '800',
      color: '#FFFFFF',
      fontSize: 14,
    },
    rowMeta: {
      fontSize: 12,
      color: '#8B8B9A',
      marginTop: 2,
    },
    tripsBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    tripsText: {
      fontSize: 12,
      fontWeight: '800',
    },
    emptyWrap: {
      paddingVertical: 32,
      paddingHorizontal: 20,
      backgroundColor: CARPOOL_SITE.surface,
      borderWidth: 1,
      borderColor: CARPOOL_SITE.lane,
      borderRadius: 18,
      alignItems: 'center',
      gap: 10,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: '#FFFFFF',
      textAlign: 'center',
    },
    emptyMeta: {
      fontSize: 13,
      color: '#8B8B9A',
      textAlign: 'center',
      lineHeight: 18,
    },
  });
}

