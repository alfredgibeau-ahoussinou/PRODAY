import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion';
import { Icon } from './Icon';
import { ELITE_COLORS, ELITE_RADIUS, ELITE_SPACING } from '../../theme/prodayEliteTheme';

interface EliteHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const EliteHeader: React.FC<EliteHeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightAction,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.leftRow}>
        {onBack ? (
          <PressableSpring
            onPress={onBack}
            haptic
            scaleTo={0.92}
            style={styles.backBtn}
          >
            <Icon name="arrow-back" size={20} color={ELITE_COLORS.textPrimary} />
          </PressableSpring>
        ) : null}
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {rightAction ? <View style={styles.right}>{rightAction}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ELITE_SPACING.lg,
    paddingVertical: ELITE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: ELITE_COLORS.border,
    backgroundColor: ELITE_COLORS.bg,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ELITE_SPACING.md,
    flex: 1,
  },
  backBtn: {
    // §5.1 — squircle 40×40, radius 12, fond surface, bordure border.
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: ELITE_COLORS.bgSurfaceElevated,
    borderWidth: 1,
    borderColor: ELITE_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: ELITE_COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: ELITE_COLORS.textSecondary,
  },
  right: {
    marginLeft: ELITE_SPACING.md,
  },
});
