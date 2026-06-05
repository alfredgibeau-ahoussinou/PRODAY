import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import type { User } from '../../models/User';
import type { ProdayPulseResult, PulseBreakdownItem } from '../../utils/prodayPulse';
import { Logo } from '../Logo';
import { UniverseBadge } from '../branding/UniverseBadge';
import { getHomeDashboardMeta } from '../../content/homeExperience';
import { getDashboardLayoutKind } from '../../content/poleExperience';
import { ROLE_LABELS } from '../../utils/roleCapabilities';
import { ProDayPulseInteractive } from '../interactive/ProDayPulseInteractive';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { ProDayShopButton } from '../shop/ProDayShopButton';
import { spacing, radius, shadows } from '../../theme/designTokens';

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
  const isProLayout = productLine === 'pro';
  const firstName = profile.display_name.split(' ')[0];
  const roleLabel =
    profile.role === 'player' && productLine === 'woman' ? 'Joueuse' : ROLE_LABELS[profile.role];
  const dashMeta = useMemo(
    () => getHomeDashboardMeta(profile.role, productLine),
    [profile.role, productLine]
  );

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: isProLayout ? '#F8FAFC' : colors.surface,
          borderColor: isProLayout ? '#CBD5E1' : colors.border,
        },
        shadows.card,
      ]}
    >
      <View
        style={[
          styles.accentBar,
          { backgroundColor: isProLayout ? '#1D4ED8' : colors.accent },
        ]}
      />

      <View style={styles.topRow}>
        <View style={styles.brandCol}>
          <Logo background="light" width={108} showTagline={false} productLine={productLine} />
          <UniverseBadge productLine={productLine} colors={colors} compact />
        </View>
        <View style={styles.actions}>
          <ProDayShopButton compact />
          {onCarpoolPress ? (
            <HeaderIconBtn
              icon="car"
              onPress={onCarpoolPress}
              colors={colors}
              filled
            />
          ) : null}
          {isAmateurPlayer && onHealthPress ? (
            <HeaderIconBtn
              icon="heart"
              onPress={onHealthPress}
              colors={colors}
              tint="#0F766E"
              bg="#F0FDFA"
              border="#99F6E4"
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
        <Text style={[styles.eyebrow, { color: colors.textMuted }]}>{dashMeta.eyebrow}</Text>
        <Text style={[styles.greeting, { color: colors.text }]}>Bonjour, {firstName}</Text>
        <Text style={[styles.tagline, { color: colors.textSecondary }]}>{dashMeta.tagline}</Text>
        <View style={styles.meta}>
          <Text
            style={[styles.rolePill, { color: colors.brandInverse, backgroundColor: colors.ink }]}
          >
            {roleLabel}
          </Text>
          {profile.city ? (
            <Text style={[styles.city, { color: colors.textMuted }]}>{profile.city}</Text>
          ) : null}
        </View>
      </View>

      <Pressable
        style={[
          styles.pulseCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
          shadows.card,
        ]}
        onPress={onProfilePress}
      >
        <ProDayPulseInteractive
          pulse={pulse}
          breakdown={breakdown}
          variant="light"
          onExpand={onProfilePress}
        />
      </Pressable>
    </View>
  );
};

const HeaderIconBtn: React.FC<{
  icon: 'car' | 'heart' | 'star-four-points' | 'chat' | 'person';
  onPress: () => void;
  colors: { surface: string; border: string; ink: string; error: string; brandInverse: string; background: string };
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
        <Text style={[styles.badgeText, { color: colors.brandInverse }]}>
          {badge > 9 ? '9+' : badge}
        </Text>
      </View>
    ) : null}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accentBar: { height: 4, width: '100%' },
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
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  greeting: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  tagline: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  rolePill: {
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  city: { fontSize: 13, fontWeight: '600' },
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
  badgeText: { fontSize: 9, fontWeight: '800' },
  pulseCard: {
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
});
