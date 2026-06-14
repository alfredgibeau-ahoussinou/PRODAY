import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import type { User } from '../../models/User';
import type { SubscriptionFeatureId } from '../../content/subscriptionPlans';
import { getPlanForRoleAndLine } from '../../content/subscriptionPlans';
import { getSubscriptionPlanVisual } from '../../content/subscriptionPlanVisuals';
import { useAppTheme } from '../../context/ProductLineContext';
import { AnimatedDialogShell } from '../motion/AnimatedDialogShell';
import { PressableSpring } from '../motion/PressableSpring';
import { Icon } from '../ui/Icon';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { ProDayGradient } from '../ui/ProDayGradient';
import { spacing, radius, shadows } from '../../theme/designTokens';

const FEATURE_HINTS: Partial<Record<SubscriptionFeatureId, string>> = {
  recruitment_message: 'Quota de messages recrutement atteint pour ce mois.',
  club_active_post: "Nombre maximum d'annonces actives sur le plan gratuit.",
  club_team: 'Le plan gratuit est limité à une équipe.',
};

function formatEur(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

interface UpgradePaywallProps {
  visible: boolean;
  feature: SubscriptionFeatureId | null;
  profile: User;
  onClose: () => void;
  onViewPlans: () => void;
}

export const UpgradePaywall: React.FC<UpgradePaywallProps> = ({
  visible,
  feature,
  profile,
  onClose,
  onViewPlans,
}) => {
  const { productLine, colors } = useAppTheme();
  const plan = getPlanForRoleAndLine(profile.role, productLine);
  const visual = getSubscriptionPlanVisual(profile.role, productLine);

  const hint = useMemo(() => {
    if (feature === 'mercato_apply') {
      return `Quota ${visual?.quotaTitle.toLowerCase() ?? 'Mercato'} atteint ce mois-ci.`;
    }
    if (feature) {
      return FEATURE_HINTS[feature] ?? 'Limite du plan gratuit atteinte.';
    }
    return `Passez à ${plan?.label ?? 'Pro'} pour lever les limites.`;
  }, [feature, visual?.quotaTitle, plan?.label]);

  if (!visual || !plan) return null;

  const topFeatures = plan.proIncludes.slice(0, 3);

  return (
    <AnimatedDialogShell visible={visible} onClose={onClose}>
      <ProDaySurface variant="elevated" style={[styles.sheet, { borderColor: colors.border }]}>
        <View style={[styles.iconWrap, { backgroundColor: visual.primarySoft }]}>
          <Icon name={visual.icon} size={28} color={visual.primary} variant="filled" />
        </View>

        <ProDayText variant="eyebrow" accent style={styles.center}>
          {visual.eyebrow}
        </ProDayText>
        <ProDayText variant="section" style={styles.center}>
          Limite atteinte
        </ProDayText>
        <ProDayText variant="body" muted style={[styles.center, styles.body]}>
          {hint}
        </ProDayText>

        <View
          style={[
            styles.planCard,
            {
              backgroundColor: visual.primarySoft,
              borderColor: visual.heroBorder ?? visual.primarySoft,
            },
          ]}
        >
          <ProDayText variant="section" style={{ color: visual.primary }}>
            {plan.label}
          </ProDayText>
          <ProDayText variant="caption" muted>
            À partir de {formatEur(plan.pricing.monthlyEur)} €/mois
          </ProDayText>
          <View style={styles.features}>
            {topFeatures.map((item) => (
              <View key={item} style={styles.featureRow}>
                <Icon name="checkmark-circle" size={16} color={visual.primary} variant="filled" />
                <ProDayText variant="caption" style={styles.featureText}>
                  {item}
                </ProDayText>
              </View>
            ))}
          </View>
        </View>

        <PressableSpring onPress={onViewPlans} scaleTo={0.98} haptic>
          <ProDayGradient kind="cta" style={styles.primaryBtn}>
            <ProDayText variant="caption" inverse style={styles.primaryBtnText}>
              {visual.ctaVerb}
            </ProDayText>
          </ProDayGradient>
        </PressableSpring>

        <TouchableOpacity style={styles.secondaryBtn} onPress={onClose} activeOpacity={0.88}>
          <ProDayText variant="caption" muted>
            Plus tard
          </ProDayText>
        </TouchableOpacity>
      </ProDaySurface>
    </AnimatedDialogShell>
  );
};

const styles = StyleSheet.create({
  sheet: {
    padding: spacing.lg,
    borderWidth: 1,
    ...shadows.interactive,
  },
  iconWrap: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  center: { textAlign: 'center' },
  body: { marginTop: spacing.xs, marginBottom: spacing.md, lineHeight: 22 },
  planCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  features: { marginTop: spacing.sm, gap: spacing.xs },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  featureText: { flex: 1, lineHeight: 18 },
  primaryBtn: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryBtnText: { fontWeight: '800', fontSize: 15 },
  secondaryBtn: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});
