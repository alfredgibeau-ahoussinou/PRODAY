import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
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
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
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
  const { productLine, colors } = useAppTheme();
  const plan = getPlanForRoleAndLine(profile.role, productLine);
  const visual = getSubscriptionPlanVisual(profile.role, productLine);
  const isPro = tier === 'pro';
  const mercatoLabel = getMercatoQuotaLabel(profile.role, productLine);

  const quota = useMemo(() => {
    if (!plan || isPro) return null;
    const limit = plan.limits.mercato_apply_per_month ?? plan.limits.recruitment_messages_per_month;
    if (limit == null || !usage) return null;
    const used =
      plan.limits.mercato_apply_per_month != null
        ? usage.mercato_applications
        : usage.recruitment_messages;
    const label = mercatoLabel ?? visual?.quotaTitle ?? 'Quota';
    return { used, limit, label, left: Math.max(0, limit - used) };
  }, [plan, isPro, usage, mercatoLabel, visual?.quotaTitle]);

  const hint = useMemo(() => {
    if (!plan || !visual) return '';
    if (isPro) return visual.proHighlight ?? plan.proIncludes[0];
    if (quota) {
      return `${quota.left} ${quota.label.toLowerCase()} restante${quota.left !== 1 ? 's' : ''} ce mois`;
    }
    return plan.tagline;
  }, [isPro, plan, visual, quota]);

  if (!plan || !visual || ROLES_WITHOUT_STORE_PLAN.includes(profile.role)) return null;

  const ratio = quota && quota.limit > 0 ? Math.min(1, quota.used / quota.limit) : 0;
  const atLimit = quota ? quota.used >= quota.limit : false;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]} accentBar>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: visual.primarySoft }]}>
            <Icon
              name={isPro ? visual.featureIconPro : visual.icon}
              size={20}
              color={visual.primary}
              variant="filled"
            />
          </View>
          <View style={styles.body}>
            <View style={styles.head}>
              <ProDayText variant="eyebrow" accent numberOfLines={1}>
                {visual.eyebrow}
              </ProDayText>
              <View
                style={[
                  styles.tierPill,
                  isPro
                    ? { backgroundColor: visual.primary }
                    : { backgroundColor: colors.surfaceMuted },
                ]}
              >
                <ProDayText
                  variant="caption"
                  inverse={isPro}
                  style={[styles.tierText, !isPro && { color: colors.textSecondary }]}
                >
                  {isPro ? PRO_TIER_LABEL : FREE_TIER_LABEL}
                </ProDayText>
              </View>
            </View>
            <ProDayText variant="section" numberOfLines={1}>
              {plan.label}
            </ProDayText>
            <ProDayText variant="caption" muted numberOfLines={1}>
              {hint}
            </ProDayText>
            {quota ? (
              <View style={styles.meterWrap}>
                <View style={[styles.meterTrack, { backgroundColor: colors.surfaceMuted }]}>
                  <View
                    style={[
                      styles.meterFill,
                      {
                        width: `${ratio * 100}%`,
                        backgroundColor: atLimit ? colors.warning : visual.primary,
                      },
                    ]}
                  />
                </View>
                <ProDayText
                  variant="caption"
                  muted
                  style={atLimit ? { color: colors.warning, fontWeight: '800' } : undefined}
                >
                  {quota.used}/{quota.limit} {quota.label.toLowerCase()}
                </ProDayText>
              </View>
            ) : null}
          </View>
          <Icon name="chevron-forward" size={18} color={colors.textMuted} />
        </View>
      </ProDaySurface>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    padding: spacing.sm,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0, gap: 2 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  tierPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  tierText: { fontWeight: '800', fontSize: 10 },
  meterWrap: { marginTop: 4, gap: 3 },
  meterTrack: { height: 4, borderRadius: radius.pill, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: radius.pill },
});
