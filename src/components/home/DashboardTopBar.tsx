import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedEntrance, PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { ProDayShopButton } from '../shop/ProDayShopButton';
import { ProDayText } from '../ui/ProDayText';
import { ProDayGradient } from '../ui/ProDayGradient';
import { useAppTheme } from '../../context/ProductLineContext';
import { brandForProductLine } from '../../models/ProductLine';
import { spacing, radius } from '../../theme/designTokens';

interface DashboardTopBarProps {
  firstName: string;
  unreadMessages: number;
  onMessagesPress: () => void;
  onProfilePress: () => void;
}

/** Barre d’accueil — pleine largeur, style app native. */
export const DashboardTopBar: React.FC<DashboardTopBarProps> = ({
  firstName,
  unreadMessages,
  onMessagesPress,
  onProfilePress,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, productLine } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const brand = brandForProductLine(productLine);

  return (
    <AnimatedEntrance kind="fadeDown">
      <View style={styles.shell}>
        <ProDayGradient kind="cta" style={styles.accentBar} />
        <View style={[styles.wrap, { paddingTop: Math.max(insets.top, spacing.sm) }]}>
          <View style={styles.copy}>
            <ProDayText variant="caption" muted style={styles.caption}>
              {brand.name}
            </ProDayText>
            <ProDayText variant="hero" style={styles.title}>
              Accueil
            </ProDayText>
            <ProDayText variant="body" muted>
              Bonjour {firstName}
            </ProDayText>
          </View>
          <View style={styles.actions}>
            <ProDayShopButton compact />
            <TopIconBtn icon="chat" onPress={onMessagesPress} badge={unreadMessages} />
            <TopIconBtn icon="person" onPress={onProfilePress} />
          </View>
        </View>
      </View>
    </AnimatedEntrance>
  );
};

const TopIconBtn: React.FC<{
  icon: 'chat' | 'person';
  onPress: () => void;
  badge?: number;
}> = ({ icon, onPress, badge }) => {
  const { colors } = useAppTheme();
  return (
    <PressableSpring
      style={[iconStyles.iconBtn, { backgroundColor: colors.surfaceMuted, borderColor: colors.borderStrong }]}
      onPress={onPress}
      scaleTo={0.92}
      haptic
    >
      <Icon name={icon} size={20} color={colors.ink} />
      {badge && badge > 0 ? (
        <View style={[iconStyles.badge, { backgroundColor: colors.error }]}>
          <ProDayText variant="caption" inverse style={iconStyles.badgeText}>
            {badge > 9 ? '9+' : badge}
          </ProDayText>
        </View>
      ) : null}
    </PressableSpring>
  );
};

const iconStyles = StyleSheet.create({
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, lineHeight: 11 },
});

function createStyles(c: { surface: string; border: string }) {
  return StyleSheet.create({
    shell: {
      backgroundColor: c.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    accentBar: {
      height: 3,
      width: '100%',
    },
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      gap: spacing.sm,
    },
    copy: { flex: 1, minWidth: 0 },
    caption: {
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      fontSize: 11,
      marginBottom: 2,
    },
    title: {
      fontSize: 28,
      lineHeight: 32,
      fontWeight: '800',
      letterSpacing: -0.6,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
  });
}
