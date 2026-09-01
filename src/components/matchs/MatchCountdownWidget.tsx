import React, { useEffect, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { MATCH_SITE } from '../../content/matchPageIdentity';
import { spacing, radius } from '../../theme/designTokens';

interface MatchCountdownWidgetProps {
  startsAt: Date;
  matchTitle?: string;
  opponent?: string;
  style?: StyleProp<ViewStyle>;
  accentColor?: string;
  onKickoff?: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isLive: boolean;
}

function computeTimeRemaining(startsAt: Date): TimeRemaining {
  const totalMs = startsAt.getTime() - Date.now();
  if (totalMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs, isLive: true };
  }
  const seconds = Math.floor((totalMs / 1000) % 60);
  const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
  const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  return { days, hours, minutes, seconds, totalMs, isLive: false };
}

export const MatchCountdownWidget: React.FC<MatchCountdownWidgetProps> = ({
  startsAt,
  matchTitle,
  opponent,
  style,
  accentColor = MATCH_SITE.accent,
  onKickoff,
}) => {
  const [time, setTime] = useState<TimeRemaining>(() => computeTimeRemaining(startsAt));

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = computeTimeRemaining(startsAt);
      setTime(remaining);
      if (remaining.isLive && onKickoff) {
        onKickoff();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startsAt, onKickoff]);

  if (time.isLive) {
    return (
      <View style={[styles.card, { borderColor: MATCH_SITE.live }, style]}>
        <View style={styles.liveHeader}>
          <View style={[styles.liveDot, { backgroundColor: MATCH_SITE.live }]} />
          <ProDayText variant="caption" style={[styles.liveText, { color: MATCH_SITE.live }]}>
            COUP D'ENVOI IMMINENT / MATCH EN COURS
          </ProDayText>
        </View>
        {matchTitle ? (
          <ProDayText variant="body" style={styles.matchTitle}>
            {matchTitle} {opponent ? `vs ${opponent}` : ''}
          </ProDayText>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.card, { borderColor: `${accentColor}55` }, style]}>
      <View style={styles.header}>
        <Icon name="time" size={14} color={accentColor} />
        <ProDayText variant="caption" style={[styles.kicker, { color: accentColor }]}>
          COMPTE À REBOURS DU COUP D'ENVOI
        </ProDayText>
      </View>

      {matchTitle ? (
        <ProDayText variant="caption" muted numberOfLines={1} style={styles.titleSub}>
          {matchTitle} {opponent ? `· vs ${opponent}` : ''}
        </ProDayText>
      ) : null}

      <View style={styles.digitsRow}>
        {time.days > 0 ? (
          <CountdownUnit value={time.days} label="Jours" accent={accentColor} />
        ) : null}
        <CountdownUnit value={time.hours} label="Heures" accent={accentColor} />
        <CountdownUnit value={time.minutes} label="Min" accent={accentColor} />
        <CountdownUnit value={time.seconds} label="Sec" accent={accentColor} isLast />
      </View>
    </View>
  );
};

const CountdownUnit: React.FC<{
  value: number;
  label: string;
  accent: string;
  isLast?: boolean;
}> = ({ value, label, accent, isLast }) => (
  <View style={styles.unitWrap}>
    <View style={styles.unitBox}>
      <ProDayText variant="section" style={[styles.unitDigit, { color: accent }]}>
        {value.toString().padStart(2, '0')}
      </ProDayText>
      <ProDayText variant="caption" muted style={styles.unitLabel}>
        {label}
      </ProDayText>
    </View>
    {!isLast ? (
      <ProDayText variant="section" muted style={styles.separator}>
        :
      </ProDayText>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: MATCH_SITE.surface,
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  kicker: {
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 1.2,
  },
  titleSub: {
    marginBottom: spacing.xs,
  },
  liveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1,
  },
  matchTitle: {
    fontWeight: '700',
    marginTop: 2,
  },
  digitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  unitWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  unitBox: {
    alignItems: 'center',
    minWidth: 44,
  },
  unitDigit: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  unitLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  separator: {
    fontSize: 18,
    fontWeight: '700',
    opacity: 0.5,
    marginBottom: 10,
  },
});
