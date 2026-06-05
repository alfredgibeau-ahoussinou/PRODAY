import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { User } from '../../models/User';
import { Icon } from '../ui/Icon';
import {
  FREE_TIER_LABEL,
  PRO_TIER_LABEL,
  getPlanForRole,
  ROLES_WITHOUT_STORE_PLAN,
} from '../../content/subscriptionPlans';
import type { SubscriptionUsagePeriod } from '../../models/Subscription';
import { colors, spacing, radius, shadows } from '../../theme/designTokens';

interface ProfileSubscriptionCardProps {
  profile: User;
  tier: 'free' | 'pro';
  usage: SubscriptionUsagePeriod | null;
  onPress: () => void;
}

export const ProfileSubscriptionCard: React.FC<ProfileSubscriptionCardProps> = ({
  profile,
  tier,
  usage,
  onPress,
}) => {
  const plan = getPlanForRole(profile.role);
  if (!plan || ROLES_WITHOUT_STORE_PLAN.includes(profile.role)) return null;

  const isPro = tier === 'pro';
  const hint = useMemo(() => {
    if (isPro) return 'Mercato et outils illimités';
    if (plan.limits.mercato_apply_per_month != null && usage) {
      const lim = plan.limits.mercato_apply_per_month;
      const left = Math.max(0, lim - usage.mercato_applications);
      return `${left} candidature${left !== 1 ? 's' : ''} Mercato restante${left !== 1 ? 's' : ''} ce mois`;
    }
    return plan.tagline;
  }, [isPro, plan, usage]);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.iconWrap}>
        <Icon name={isPro ? 'star' : 'star-outline'} size={22} color={colors.brandInverse} />
      </View>
      <View style={styles.body}>
        <Text style={styles.eyebrow}>Abonnement</Text>
        <Text style={styles.title}>
          {isPro ? PRO_TIER_LABEL : FREE_TIER_LABEL} · {plan.label}
        </Text>
        <Text style={styles.sub} numberOfLines={2}>
          {hint}
        </Text>
      </View>
      <Icon name="chevron-forward" size={20} color={colors.heroMuted} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceInverse,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    ...shadows.card,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.heroMuted,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.brandInverse,
    marginTop: 2,
  },
  sub: {
    fontSize: 12,
    color: colors.heroMuted,
    marginTop: 4,
    lineHeight: 16,
  },
});
