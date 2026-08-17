import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { CoachText } from '../../../components/coach/coachPortalUi';
import { Icon } from '../../../components/ui/Icon';
import { spacing } from '../../../theme/designTokens';
import { useCoachTheme, useCoachThemedStyles } from './CoachThemeContext';
import type { CoachThemeTokens } from '../../../utils/coachTeamTheme';

type Props = {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  onPress: () => void;
  badge?: number;
  locked?: boolean;
  aiBadge?: boolean;
  accessibilityLabel?: string;
  showSeparator?: boolean;
};

/** Ligne navigation iOS Settings — icône cercle, label, chevron. */
export function CoachNavRow({
  icon,
  label,
  onPress,
  badge = 0,
  locked = false,
  aiBadge = false,
  accessibilityLabel,
  showSeparator = true,
}: Props) {
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);

  return (
    <View>
      <Pressable
        onPress={onPress}
        disabled={locked}
        style={({ pressed }) => [styles.row, pressed && !locked && styles.rowPressed]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: locked }}
      >
        <View style={[styles.iconCircle, locked && styles.iconCircleLocked]}>
          <Icon
            name={icon}
            size={18}
            color={locked ? tokens.muted : tokens.accent}
            variant="outline"
          />
          {aiBadge ? <View style={styles.aiDot} /> : null}
          {locked ? (
            <View style={styles.lockBadge}>
              <Icon name="lock" size={9} color={tokens.muted} />
            </View>
          ) : null}
        </View>
        <CoachText
          variant="section"
          numberOfLines={1}
          style={[styles.label, locked && styles.labelLocked]}
        >
          {label}
        </CoachText>
        {badge > 0 ? (
          <View style={styles.badge}>
            <CoachText variant="caption" style={styles.badgeText}>
              {badge > 99 ? '99+' : String(badge)}
            </CoachText>
          </View>
        ) : null}
        <Icon name="chevron-forward" size={16} color={tokens.muted} variant="outline" />
      </Pressable>
      {showSeparator ? <View style={styles.separator} /> : null}
    </View>
  );
}

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: 48,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
    },
    rowPressed: { opacity: 0.65 },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.elevated,
    },
    iconCircleLocked: { opacity: 0.6 },
    aiDot: {
      position: 'absolute',
      top: -1,
      right: -1,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: tokens.accent,
    },
    lockBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 14,
      height: 14,
      borderRadius: 7,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.elevated,
    },
    label: {
      flex: 1,
      fontSize: 16,
      fontWeight: '500',
      color: tokens.foreground,
    },
    labelLocked: { color: tokens.muted },
    badge: {
      minWidth: 20,
      height: 20,
      paddingHorizontal: 6,
      borderRadius: 10,
      backgroundColor: tokens.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: { color: tokens.onAccent, fontSize: 11, fontWeight: '700', lineHeight: 13 },
    separator: {
      marginLeft: spacing.md + 32 + spacing.sm,
      height: StyleSheet.hairlineWidth,
      backgroundColor: tokens.border,
    },
  });
}
