import React, { useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { useJoueurTheme } from '../../hooks/useJoueurTheme';
import { spacing } from '../../theme/designTokens';

type Props = {
  kicker?: string;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** En-tête de section FUT18 — kicker accent + titre bold. */
export function JoueurSectionHeader({ kicker, title, subtitle, trailing, style }: Props) {
  const theme = useJoueurTheme();
  const styles = useMemo(() => createStyles(theme.accent), [theme.accent]);

  return (
    <View style={[styles.root, style]}>
      <View style={styles.copy}>
        {kicker ? (
          <View style={styles.kickerRow}>
            <View style={[styles.dot, { backgroundColor: theme.accent }]} />
            <ProDayText variant="caption" style={[styles.kicker, { color: theme.accent }]}>
              {kicker.toUpperCase()}
            </ProDayText>
          </View>
        ) : null}
        <ProDayText variant="section" style={[styles.title, { color: theme.ink }]}>
          {title}
        </ProDayText>
        {subtitle ? (
          <ProDayText variant="caption" style={[styles.subtitle, { color: theme.inkMuted }]}>
            {subtitle}
          </ProDayText>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}

function createStyles(accent: string) {
  return StyleSheet.create({
    root: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    copy: { flex: 1, gap: 4 },
    kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    kicker: {
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 2,
    },
    title: {
      fontWeight: '900',
      letterSpacing: -0.3,
    },
    subtitle: {
      lineHeight: 18,
    },
  });
}
