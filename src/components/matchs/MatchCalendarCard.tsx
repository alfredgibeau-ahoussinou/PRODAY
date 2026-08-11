import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion/PressableSpring';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { MATCH_SITE } from '../../content/matchPageIdentity';
import { spacing } from '../../theme/designTokens';

interface MatchCalendarCardProps {
  kindLabel: string;
  dateLabel: string;
  title: string;
  subtitle: string;
  city: string;
  linkLabel: string;
  onPress: () => void;
}

export const MatchCalendarCard: React.FC<MatchCalendarCardProps> = ({
  kindLabel,
  dateLabel,
  title,
  subtitle,
  city,
  linkLabel,
  onPress,
}) => {
  const { colors } = useAppTheme();

  return (
    <PressableSpring
      style={[styles.card, { borderColor: MATCH_SITE.border }]}
      onPress={onPress}
      scaleTo={0.98}
      haptic
    >
      <View style={[styles.bar, { backgroundColor: colors.accent }]} />
      <View style={styles.body}>
        <View style={styles.top}>
          <ProDayText variant="caption" style={[styles.kind, { color: colors.accent }]}>
            {kindLabel}
          </ProDayText>
          <ProDayText variant="caption" style={styles.date}>
            {dateLabel}
          </ProDayText>
        </View>
        <ProDayText variant="section" numberOfLines={2} style={styles.title}>
          {title}
        </ProDayText>
        <ProDayText variant="caption" style={styles.meta} numberOfLines={1}>
          {subtitle} · {city}
        </ProDayText>
        <ProDayText variant="caption" style={[styles.link, { color: colors.accent }]}>
          {linkLabel}
        </ProDayText>
      </View>
    </PressableSpring>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: MATCH_SITE.surface,
    marginBottom: 2,
    overflow: 'hidden',
  },
  bar: { width: 3 },
  body: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: 4,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  kind: {
    fontWeight: '800',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  date: { color: MATCH_SITE.muted, fontSize: 11 },
  title: {
    fontWeight: '800',
    letterSpacing: -0.3,
    color: MATCH_SITE.foreground,
  },
  meta: { color: MATCH_SITE.muted },
  link: { fontWeight: '800', marginTop: 2 },
});
