import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ELITE_COLORS, ELITE_SPACING, useEliteResponsive } from '../../theme/prodayEliteTheme';
import { Icon } from './Icon';

interface EliteHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export const EliteHeader: React.FC<EliteHeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightAction,
  style,
}) => {
  const insets = useSafeAreaInsets();
  const { isMobile, containerStyle } = useEliteResponsive();

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top > 0 ? insets.top : ELITE_SPACING.md }, style]}>
      <View style={[styles.inner, containerStyle]}>
        <View style={styles.left}>
          {onBack ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onBack}
              style={styles.backButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Icon name="arrow-back" size={20} color={ELITE_COLORS.textPrimary} />
            </TouchableOpacity>
          ) : null}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, isMobile ? styles.titleMobile : styles.titleDesktop]} numberOfLines={1}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: ELITE_COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: ELITE_COLORS.border,
    paddingBottom: ELITE_SPACING.md,
    zIndex: 10,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ELITE_SPACING.lg,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: ELITE_SPACING.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ELITE_COLORS.bgSurfaceElevated,
    borderWidth: 1,
    borderColor: ELITE_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: ELITE_COLORS.textPrimary,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  titleMobile: {
    fontSize: 18,
  },
  titleDesktop: {
    fontSize: 22,
  },
  subtitle: {
    color: ELITE_COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ELITE_SPACING.sm,
  },
});
