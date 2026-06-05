import React from 'react';
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
import { getPlanForRole } from '../../content/subscriptionPlans';
import { Icon } from '../ui/Icon';
import { colors, spacing, radius, shadows } from '../../theme/designTokens';

const FEATURE_HINTS: Record<SubscriptionFeatureId, string> = {
  mercato_apply: 'Vous avez utilisé votre candidature Mercato gratuite ce mois-ci.',
  recruitment_message: 'Quota de messages recrutement atteint pour ce mois.',
  club_active_post: 'Nombre maximum d’annonces actives sur le plan gratuit.',
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
  const plan = getPlanForRole(profile.role);
  const hint = feature ? FEATURE_HINTS[feature] : 'Passez au plan Pro pour lever les limites.';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.iconWrap}>
            <Icon name="star-outline" size={28} color={colors.brand} />
          </View>
          <Text style={styles.title}>Limite du plan gratuit</Text>
          <Text style={styles.body}>{hint}</Text>
          {plan ? (
            <Text style={styles.planName}>
              {plan.label} — {plan.pricing.monthlyEur.toFixed(2).replace('.', ',')} €/mois
            </Text>
          ) : null}
          <TouchableOpacity style={styles.primaryBtn} onPress={onViewPlans} activeOpacity={0.88}>
            <Text style={styles.primaryBtnText}>Voir mon abonnement</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onClose} activeOpacity={0.88}>
            <Text style={styles.secondaryBtnText}>Plus tard</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    ...shadows.card,
  },
  iconWrap: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  planName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.brand,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  primaryBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  primaryBtnText: {
    color: colors.brandInverse,
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryBtn: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: colors.textMuted,
    fontSize: 15,
  },
});
