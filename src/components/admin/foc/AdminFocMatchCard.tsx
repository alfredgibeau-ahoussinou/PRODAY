import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableSpring } from '../../motion';
import { adminChrome, adminType } from '../../../theme/adminTheme';
import { spacing } from '../../../theme/designTokens';

export type MatchStatusTone = 'upcoming' | 'live' | 'done';

interface AdminFocMatchCardProps {
  homeName: string;
  awayName: string;
  dateLabel: string;
  timeLabel?: string;
  city: string;
  statusLabel: string;
  statusTone: MatchStatusTone;
  competition?: string;
  onPress?: () => void;
}

const TONE_COLORS: Record<MatchStatusTone, { bg: string; text: string; border: string }> = {
  upcoming: {
    bg: adminChrome.soft,
    text: adminChrome.accent,
    border: adminChrome.accentMuted,
  },
  live: {
    bg: adminChrome.pitchSoft,
    text: adminChrome.pitch,
    border: adminChrome.pitch,
  },
  done: {
    bg: adminChrome.shellElevated,
    text: adminChrome.textMuted,
    border: adminChrome.shellBorder,
  },
};

const MatchCardContent: React.FC<AdminFocMatchCardProps> = ({
  homeName,
  awayName,
  dateLabel,
  timeLabel,
  city,
  statusLabel,
  statusTone,
  competition,
}) => {
  const styles = useMemo(() => createStyles(), []);
  const tone = TONE_COLORS[statusTone];

  return (
    <View style={styles.card}>
      <View style={styles.pitchStripe} />

      <View style={styles.inner}>
        <View style={styles.matchup}>
          <Text style={styles.teamName} numberOfLines={1}>
            {homeName}
          </Text>
          <View style={styles.vsBadge}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          <Text style={[styles.teamName, styles.teamNameRight]} numberOfLines={1}>
            {awayName}
          </Text>
        </View>

        <View style={styles.meta}>
          <Text style={styles.metaText}>{dateLabel}</Text>
          {timeLabel ? <Text style={styles.metaDot}>·</Text> : null}
          {timeLabel ? <Text style={styles.metaText}>{timeLabel}</Text> : null}
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText} numberOfLines={1}>
            {city}
          </Text>
          {competition ? (
            <>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaText} numberOfLines={1}>
                {competition}
              </Text>
            </>
          ) : null}
        </View>

        <View style={styles.footer}>
          <View style={[styles.pill, { backgroundColor: tone.bg, borderColor: tone.border }]}>
            {statusTone === 'live' ? <View style={styles.liveDot} /> : null}
            <Text style={[styles.pillText, { color: tone.text }]}>{statusLabel}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export const AdminFocMatchCard: React.FC<AdminFocMatchCardProps> = (props) => {
  if (!props.onPress) {
    return <MatchCardContent {...props} />;
  }
  return (
    <PressableSpring onPress={props.onPress} scaleTo={0.97} haptic>
      <MatchCardContent {...props} />
    </PressableSpring>
  );
};

function createStyles() {
  return StyleSheet.create({
    card: {
      backgroundColor: adminChrome.shell,
      borderRadius: adminChrome.radiusLg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
      overflow: 'hidden',
      shadowColor: adminChrome.cardShadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 12,
      elevation: 2,
    },
    pitchStripe: {
      height: 3,
      backgroundColor: adminChrome.pitch,
      opacity: 0.7,
    },
    inner: {
      padding: spacing.md,
      gap: spacing.sm,
    },
    matchup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    teamName: {
      flex: 1,
      fontFamily: adminType.display,
      fontSize: 15,
      fontWeight: '800',
      color: adminChrome.text,
      letterSpacing: -0.3,
    },
    teamNameRight: {
      textAlign: 'right',
    },
    vsBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: adminChrome.radiusSm,
      backgroundColor: adminChrome.shellElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
    },
    vsText: {
      fontFamily: adminType.bodyExtra,
      fontSize: 10,
      fontWeight: '900',
      color: adminChrome.textMuted,
      letterSpacing: 1,
    },
    meta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontFamily: adminType.bodySemi,
      fontSize: 11,
      color: adminChrome.textMuted,
      fontWeight: '600',
    },
    metaDot: {
      fontSize: 11,
      color: adminChrome.shellBorderStrong,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: adminChrome.radiusSm,
      borderWidth: StyleSheet.hairlineWidth,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: adminChrome.pitch,
    },
    pillText: {
      fontFamily: adminType.bodyExtra,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.2,
    },
  });
}
