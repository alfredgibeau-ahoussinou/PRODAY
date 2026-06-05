import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { User } from '../../models/User';
import { Icon } from '../ui/Icon';
import {
  FREE_TIER_LABEL,
  PRO_TIER_LABEL,
  getPlanForRoleAndLine,
  ROLES_WITHOUT_STORE_PLAN,
} from '../../content/subscriptionPlans';
import { getMercatoQuotaLabel } from '../../content/subscriptionPlansByLine';
import { getSubscriptionPlanVisual } from '../../content/subscriptionPlanVisuals';
import type { SubscriptionUsagePeriod } from '../../models/Subscription';
import { useAppTheme } from '../../context/ProductLineContext';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import { spacing, radius } from '../../theme/designTokens';

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
  const { productLine } = useAppTheme();
  const plan = getPlanForRoleAndLine(profile.role, productLine);
  const visual = getSubscriptionPlanVisual(profile.role, productLine);
  if (!plan || !visual || ROLES_WITHOUT_STORE_PLAN.includes(profile.role)) return null;

  const isPro = tier === 'pro';
  const mercatoLabel = getMercatoQuotaLabel(profile.role, productLine);
  const hint = useMemo(() => {
    if (isPro) return visual.proHighlight ?? plan.proIncludes[0];
    if (plan.limits.mercato_apply_per_month != null && usage && mercatoLabel) {
      const lim = plan.limits.mercato_apply_per_month;
      const left = Math.max(0, lim - usage.mercato_applications);
      return `${left} ${mercatoLabel.toLowerCase()} restante${left !== 1 ? 's' : ''} ce mois`;
    }
    return plan.tagline;
  }, [isPro, plan, usage, mercatoLabel, visual.proHighlight]);

  const isSponsor = profile.role === 'sponsor';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isSponsor ? SPONSOR_THEME.surface : visual.heroBg,
          borderColor: isSponsor ? SPONSOR_THEME.borderSubtle : visual.heroBorder ?? visual.primary,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={[styles.iconWrap, { backgroundColor: visual.primarySoft }]}>
        <Icon
          name={isPro ? visual.featureIconPro : visual.icon}
          size={22}
          color={visual.primary}
          variant="filled"
        />
      </View>
      <View style={styles.body}>
        <Text
          style={[
            styles.eyebrow,
            { color: isSponsor ? SPONSOR_THEME.sectionLabel : visual.heroSubtext },
          ]}
        >
          {visual.eyebrow}
        </Text>
        <Text style={[styles.title, { color: isSponsor ? SPONSOR_THEME.text : visual.heroText }]}>
          {isPro ? PRO_TIER_LABEL : FREE_TIER_LABEL} · {plan.label}
        </Text>
        <Text
          style={[
            styles.sub,
            { color: isSponsor ? SPONSOR_THEME.textSecondary : visual.heroSubtext },
          ]}
          numberOfLines={2}
        >
          {hint}
        </Text>
      </View>
      <Icon name="chevron-forward" size={20} color={visual.primary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  sub: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
});
