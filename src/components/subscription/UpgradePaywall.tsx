import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import type { User } from '../../models/User';
import type { SubscriptionFeatureId } from '../../content/subscriptionPlans';
import { getPlanForRoleAndLine } from '../../content/subscriptionPlans';
import { getSubscriptionPlanVisual, isDarkSubscriptionVisual } from '../../content/subscriptionPlanVisuals';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import { useAppTheme } from '../../context/ProductLineContext';
import { Icon } from '../ui/Icon';
import { spacing, radius, shadows } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

const FEATURE_HINTS: Partial<Record<SubscriptionFeatureId, string>> = {
  recruitment_message: 'Quota de messages recrutement atteint pour ce mois.',
  club_active_post: "Nombre maximum d'annonces actives sur le plan gratuit.",
  club_team: 'Le plan gratuit est limité à une équipe.',
};

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
  const { productLine, colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const plan = getPlanForRoleAndLine(profile.role, productLine);
  const visual = getSubscriptionPlanVisual(profile.role, productLine);

  const hint =
    feature === 'mercato_apply'
      ? `Quota ${visual?.quotaTitle.toLowerCase() ?? 'Mercato'} atteint ce mois-ci.`
      : feature
        ? FEATURE_HINTS[feature] ?? 'Limite du plan gratuit atteinte.'
        : `Passez à ${plan?.label ?? 'Pro'} pour lever les limites.`;

  if (!visual || !plan) return null;

  const isDark = isDarkSubscriptionVisual(visual);
  const isSponsor = visual.variant === 'sponsor';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            isSponsor && styles.sheetSponsor,
            isDark && !isSponsor && styles.sheetPremium,
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.iconWrap, { backgroundColor: visual.primarySoft }]}>
            <Icon name={visual.icon} size={28} color={visual.primary} variant="filled" />
          </View>
          <Text style={[styles.eyebrow, { color: visual.primary }]}>{visual.eyebrow}</Text>
          <Text style={[styles.title, isDark && styles.titleDark]}>
            Limite atteinte
          </Text>
          <Text style={[styles.body, isDark && styles.bodyDark]}>
            {hint}
          </Text>
          <Text style={[styles.planName, { color: visual.primary }]}>
            {plan.label} — {plan.pricing.monthlyEur.toFixed(2).replace('.', ',')} €/mois
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: visual.primary }]}
            onPress={onViewPlans}
            activeOpacity={0.88}
          >
            <Text style={[styles.primaryBtnText, { color: visual.onPrimary }]}>
              {visual.ctaVerb}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onClose} activeOpacity={0.88}>
            <Text style={[styles.secondaryBtnText, isDark && styles.secondaryBtnTextDark]}>
              Plus tard
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.xl,
      paddingBottom: spacing.xxl,
      ...shadows.card,
    },
    sheetPremium: {
      backgroundColor: '#18181B',
    },
    sheetSponsor: {
      backgroundColor: SPONSOR_THEME.surface,
      borderTopWidth: 1,
      borderColor: SPONSOR_THEME.borderSubtle,
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
    eyebrow: {
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1,
      textTransform: 'uppercase',
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    titleDark: { color: '#FAFAFA' },
    body: {
      fontSize: 15,
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.md,
    },
    bodyDark: { color: '#A1A1AA' },
    planName: {
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    primaryBtn: {
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    primaryBtnText: {
      fontWeight: '700',
      fontSize: 16,
    },
    secondaryBtn: {
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    secondaryBtnText: {
      color: c.textMuted,
      fontSize: 15,
    },
    secondaryBtnTextDark: { color: '#94A3B8' },
  });
}
