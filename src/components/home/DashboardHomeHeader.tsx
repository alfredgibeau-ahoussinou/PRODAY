import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import type { User } from '../../models/User';
import type { ProdayPulseResult, PulseBreakdownItem } from '../../utils/prodayPulse';
import { Logo } from '../Logo';
import { UniverseBadge } from '../branding/UniverseBadge';
import { getHomeDashboardMeta } from '../../content/homeExperience';
import { getDashboardLayoutKind } from '../../content/poleExperience';
import { ROLE_LABELS } from '../../utils/roleCapabilities';
import { isFemalePresentationForUser } from '../../utils/playerSegment';
import { ProDayPulseInteractive } from '../interactive/ProDayPulseInteractive';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { ProDayShopButton } from '../shop/ProDayShopButton';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { fontFamily } from '../../theme/typography';

interface DashboardHomeHeaderProps {
  profile: User;
  pulse: ProdayPulseResult;
  breakdown: PulseBreakdownItem[];
  unreadMessages: number;
  onProfilePress: () => void;
  onMessagesPress: () => void;
  onFeedPress?: () => void;
  onHealthPress?: () => void;
  onCarpoolPress?: () => void;
}

export const DashboardHomeHeader: React.FC<DashboardHomeHeaderProps> = ({
  profile,
  pulse,
  breakdown,
  unreadMessages,
  onProfilePress,
  onMessagesPress,
  onFeedPress,
  onHealthPress,
  onCarpoolPress,
}) => {
  const { colors, productLine } = useAppTheme();
  const isAmateurPlayer = getDashboardLayoutKind(productLine, profile.role) === 'amateur_player';
  const firstName = profile.display_name.split(' ')[0];
  const roleLabel =
    profile.role === 'player' && isFemalePresentationForUser(profile, productLine)
      ? 'Joueuse'
      : ROLE_LABELS[profile.role];
  const dashMeta = useMemo(
    () => getHomeDashboardMeta(profile.role, productLine),
    [profile.role, productLine],
  );

  return (
    <ProDaySurface variant="elevated" accentBar style={styles.wrap}>
      <View style={styles.topRow}>
        <View style={styles.brandCol}>
          <Logo background="light" width={108} showTagline={false} productLine={productLine} />
          <UniverseBadge productLine={productLine} colors={colors} compact />
        </View>
        <View style={styles.actions}>
          <ProDayShopButton compact />
          {onCarpoolPress ? (
            <HeaderIconBtn icon="car" onPress={onCarpoolPress} colors={colors} filled />
          ) : null}
          {isAmateurPlayer && onHealthPress ? (
            <HeaderIconBtn
              icon="heart"
              onPress={onHealthPress}
              colors={colors}
              tint={colors.tone4}
              bg={colors.accentSoft}
              border={colors.accentMuted}
              filled
            />
          ) : null}
          {onFeedPress ? (
            <HeaderIconBtn icon="star-four-points" onPress={onFeedPress} colors={colors} />
          ) : null}
          <HeaderIconBtn
            icon="chat"
            onPress={onMessagesPress}
            colors={colors}
            badge={unreadMessages}
          />
          <HeaderIconBtn icon="person" onPress={onProfilePress} colors={colors} />
        </View>
      </View>

      <View style={styles.greetBlock}>
        <ProDayText variant="eyebrow">{dashMeta.eyebrow}</ProDayText>
        <ProDayText variant="hero" style={styles.greeting}>
          Bonjour, {firstName}
        </ProDayText>
        <ProDayText variant="body" style={styles.tagline}>
          {dashMeta.tagline}
        </ProDayText>
        <View style={styles.meta}>
          <ProDayGradientPill label={roleLabel} colors={colors} />
          {profile.city ? (
            <ProDayText variant="caption" muted>
              {profile.city}
            </ProDayText>
          ) : null}
        </View>
      </View>

      <Pressable style={styles.pulseCard} onPress={onProfilePress}>
        <ProDaySurface variant="module" style={styles.pulseInner}>
          <ProDayPulseInteractive
            pulse={pulse}
            breakdown={breakdown}
            variant="light"
            onExpand={onProfilePress}
          />
        </ProDaySurface>
      </Pressable>
    </ProDaySurface>
  );
};

const ProDayGradientPill: React.FC<{
  label: string;
  colors: { ink: string; brandInverse: string; accent: string };
}> = ({ label, colors }) => (
  <View style={[styles.rolePill, { backgroundColor: colors.ink }]}>
    <ProDayText variant="caption" inverse style={styles.rolePillText}>
      {label}
    </ProDayText>
  </View>
);

const HeaderIconBtn: React.FC<{
  icon: 'car' | 'heart' | 'star-four-points' | 'chat' | 'person';
  onPress: () => void;
  colors: {
    surface: string;
    border: string;
    ink: string;
    error: string;
    brandInverse: string;
    background: string;
  };
  badge?: number;
  filled?: boolean;
  tint?: string;
  bg?: string;
  border?: string;
}> = ({ icon, onPress, colors, badge, filled, tint, bg, border }) => (
  <TouchableOpacity
    style={[
      styles.iconBtn,
      {
        backgroundColor: bg ?? colors.surface,
        borderColor: border ?? colors.border,
      },
      shadows.soft,
    ]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <Icon name={icon} size={20} color={tint ?? colors.ink} variant={filled ? 'filled' : 'outline'} />
    {badge && badge > 0 ? (
      <View
        style={[
          styles.badge,
          { backgroundColor: colors.error, borderColor: colors.background },
        ]}
      >
        <ProDayText variant="caption" inverse style={styles.badgeText}>
          {badge > 9 ? '9+' : badge}
        </ProDayText>
      </View>
    ) : null}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  brandCol: {
    alignItems: 'flex-start',
    gap: spacing.sm,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    maxWidth: 200,
  },
  greetBlock: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  greeting: {
    marginTop: 4,
  },
  tagline: {
    marginTop: 6,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  rolePillText: {
    fontFamily: fontFamily.extrabold,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 2,
  },
  badgeText: {
    fontSize: 9,
    lineHeight: 11,
  },
  pulseCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  pulseInner: {
    padding: spacing.md,
  },
});
