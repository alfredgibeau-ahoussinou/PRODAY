import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion/PressableSpring';
import { ProDayGradient } from '../ui/ProDayGradient';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius, shadows } from '../../theme/designTokens';

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
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.soft]}
      onPress={onPress}
      scaleTo={0.96}
      haptic
    >
      <ProDayGradient kind="cta" style={styles.accent} />
      <View style={styles.body}>
        <View style={styles.top}>
          <View style={[styles.kindPill, { backgroundColor: colors.accentSoft }]}>
            <ProDayText variant="caption" accent style={styles.kindText}>
              {kindLabel}
            </ProDayText>
          </View>
          <ProDayText variant="caption" muted>
            {dateLabel}
          </ProDayText>
        </View>
        <ProDayText variant="section" numberOfLines={2}>
          {title}
        </ProDayText>
        <ProDayText variant="body" muted numberOfLines={1}>
          {subtitle} · {city}
        </ProDayText>
        <View style={styles.footer}>
          <ProDayText variant="caption" accent style={styles.link}>
            {linkLabel}
          </ProDayText>
          <Icon name="chevron-forward" size={14} color={colors.accent} />
        </View>
      </View>
    </PressableSpring>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  accent: { height: 3, width: '100%' },
  body: { padding: spacing.md },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  kindPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  kindText: { fontWeight: '800', fontSize: 10 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  link: { fontWeight: '800' },
});
