import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { User } from '../../../models/User';
import { AnimatedEntrance, PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { ProDayText } from '../../../components/ui/ProDayText';
import { ProDayGradient } from '../../../components/ui/ProDayGradient';
import { ProDayShopButton } from '../../../components/shop/ProDayShopButton';
import { ProfileAvatarButton } from '../../../components/profile/ProfileAvatarButton';
import { useAppTheme } from '../../../context/ProductLineContext';
import { useTranslation } from '../../../context/LocaleContext';
import { brandForProductLine } from '../../../models/ProductLine';
import { spacing, radius } from '../../../theme/designTokens';

interface HomeIaHeaderProps {
  profile: User;
  globalScore: number;
  notificationCount: number;
  onAvatarPress: () => void;
  onLocationPress: () => void;
  onNotificationsPress: () => void;
}

/** En-tête Accueil IA — score dynamique, alertes, avatar. */
export const HomeIaHeader: React.FC<HomeIaHeaderProps> = ({
  profile,
  globalScore,
  notificationCount,
  onAvatarPress,
  onLocationPress,
  onNotificationsPress,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, productLine } = useAppTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const brand = brandForProductLine(productLine);
  const firstName = profile.display_name.split(' ')[0];

  return (
    <AnimatedEntrance kind="fadeDown">
      <View style={styles.shell}>
        <ProDayGradient kind="cta" style={styles.accentBar} />
        <View style={[styles.wrap, { paddingTop: Math.max(insets.top, spacing.sm) }]}>
          <View style={styles.left}>
            <ProfileAvatarButton
              displayName={profile.display_name}
              avatarUrl={profile.avatar_url}
              onPress={onAvatarPress}
              size={44}
            />
            <View style={styles.copy}>
              <ProDayText variant="caption" muted style={styles.caption}>
                {brand.name}
              </ProDayText>
              <ProDayText variant="hero" style={styles.title}>
                {t('home.greeting', { name: firstName })}
              </ProDayText>
              {profile.city ? (
                <PressableSpring onPress={onLocationPress} scaleTo={0.98}>
                  <ProDayText variant="caption" accent style={styles.city}>
                    {profile.city}
                  </ProDayText>
                </PressableSpring>
              ) : null}
            </View>
          </View>
          <View style={styles.actions}>
            <View style={[styles.scorePill, { backgroundColor: colors.accentSoft, borderColor: colors.accentMuted }]}>
              <ProDayText variant="caption" accent style={styles.scoreLabel}>
                {t('home.pulse')}
              </ProDayText>
              <ProDayText variant="section" accent style={styles.scoreValue}>
                {globalScore}
              </ProDayText>
            </View>
            <ProDayShopButton compact />
            <TopIconBtn
              icon="notifications"
              onPress={onNotificationsPress}
              badge={notificationCount}
            />
          </View>
        </View>
      </View>
    </AnimatedEntrance>
  );
};

const TopIconBtn: React.FC<{
  icon: 'notifications';
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

function createStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    shell: { marginBottom: spacing.md },
    accentBar: { height: 4, width: '100%' },
    wrap: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minWidth: 0 },
    copy: { flex: 1, minWidth: 0, gap: 2 },
    caption: { textTransform: 'uppercase', letterSpacing: 1, fontSize: 10 },
    title: { fontWeight: '800', letterSpacing: -0.5 },
    city: { fontWeight: '600', marginTop: 2 },
    actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    scorePill: {
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.md,
      borderWidth: 1,
      minWidth: 48,
    },
    scoreLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
    scoreValue: { fontWeight: '800', lineHeight: 20 },
  });
}

const iconStyles = StyleSheet.create({
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, fontWeight: '700' },
});
