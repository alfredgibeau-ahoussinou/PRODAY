import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { User } from '../models/User';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon } from '../components/ui/Icon';
import {
  FREE_TIER_LABEL,
  PRO_TIER_LABEL,
  getPlanForRole,
  ROLES_WITHOUT_STORE_PLAN,
} from '../content/subscriptionPlans';
import { subscriptionService } from '../services/subscription.service';
import { useSubscription } from '../context/SubscriptionContext';
import { colors, spacing, radius } from '../theme/designTokens';

interface SubscriptionScreenProps {
  profile: User;
  onBack: () => void;
}

export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({
  profile,
  onBack,
}) => {
  const { subscription, usage, loading, refresh } = useSubscription();
  const plan = getPlanForRole(profile.role);
  const [upgrading, setUpgrading] = useState(false);

  const isPro = subscription?.tier === 'pro';
  const noStorePlan = ROLES_WITHOUT_STORE_PLAN.includes(profile.role);

  const handleUpgrade = useCallback(async () => {
    if (!plan) return;
    setUpgrading(true);
    try {
      const res = await subscriptionService.requestUpgrade(plan.id);
      Alert.alert(res.ok ? 'Abonnement' : 'Bientôt disponible', res.message);
    } finally {
      setUpgrading(false);
    }
  }, [plan]);

  const quotaLines = (): { label: string; value: string }[] => {
    if (!plan || isPro || noStorePlan) return [];
    const lines: { label: string; value: string }[] = [];
    if (plan.limits.mercato_apply_per_month != null && usage) {
      const lim = plan.limits.mercato_apply_per_month;
      lines.push({
        label: 'Candidatures Mercato',
        value: `${usage.mercato_applications} / ${lim} ce mois`,
      });
    }
    if (plan.limits.recruitment_messages_per_month != null && usage) {
      const lim = plan.limits.recruitment_messages_per_month;
      lines.push({
        label: 'Messages recrutement',
        value: `${usage.recruitment_messages} / ${lim} ce mois`,
      });
    }
    if (plan.limits.club_active_posts != null) {
      lines.push({
        label: 'Annonces actives',
        value: `max. ${plan.limits.club_active_posts}`,
      });
    }
    if (plan.limits.club_teams != null) {
      lines.push({
        label: 'Équipes',
        value: `max. ${plan.limits.club_teams}`,
      });
    }
    return lines;
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Mon abonnement" onBack={onBack} centered />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.badge, isPro ? styles.badgePro : styles.badgeFree]}>
          <Icon
            name={isPro ? 'star' : 'star-outline'}
            size={22}
            color={isPro ? colors.brandInverse : colors.brand}
          />
          <Text style={[styles.badgeText, isPro && styles.badgeTextPro]}>
            {isPro ? PRO_TIER_LABEL : FREE_TIER_LABEL}
            {plan && !noStorePlan ? ` · ${plan.label}` : ''}
          </Text>
        </View>

        {noStorePlan ? (
          <Text style={styles.note}>
            Votre rôle bénéficie de l’accès complet gratuit au lancement stores. Les abonnements
            payants concernent d’abord joueurs, coachs, clubs et agents.
          </Text>
        ) : plan ? (
          <>
            <Text style={styles.tagline}>{plan.tagline}</Text>
            {!isPro && (
              <View style={styles.priceRow}>
                <Text style={styles.price}>
                  {plan.pricing.monthlyEur.toFixed(2).replace('.', ',')} €
                  <Text style={styles.priceUnit}>/mois</Text>
                </Text>
                <Text style={styles.priceYear}>
                  ou {plan.pricing.yearlyEur} €/an (−20 %)
                </Text>
              </View>
            )}
          </>
        ) : null}

        {loading ? (
          <ActivityIndicator color={colors.brand} style={styles.loader} />
        ) : (
          quotaLines().length > 0 && (
            <View style={styles.quotaCard}>
              <Text style={styles.sectionTitle}>Utilisation ce mois</Text>
              {quotaLines().map((q) => (
                <View key={q.label} style={styles.quotaRow}>
                  <Text style={styles.quotaLabel}>{q.label}</Text>
                  <Text style={styles.quotaValue}>{q.value}</Text>
                </View>
              ))}
            </View>
          )
        )}

        {plan && (
          <>
            <Text style={styles.sectionTitle}>Plan gratuit</Text>
            {plan.freeIncludes.map((item) => (
              <View key={item} style={styles.bulletRow}>
                <Icon name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}

            <Text style={[styles.sectionTitle, styles.sectionGap]}>Avec {plan.label}</Text>
            {plan.proIncludes.map((item) => (
              <View key={item} style={styles.bulletRow}>
                <Icon name="star" size={14} color={colors.brand} />
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </>
        )}

        {!noStorePlan && !isPro && plan && (
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => void handleUpgrade()}
            disabled={upgrading}
            activeOpacity={0.88}
          >
            {upgrading ? (
              <ActivityIndicator color={colors.brandInverse} />
            ) : (
              <Text style={styles.upgradeBtnText}>
                Passer à {plan.label}
                {plan.pricing.storeAvailable ? '' : ' (bientôt)'}
              </Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.refreshBtn} onPress={() => void refresh()}>
          <Text style={styles.refreshText}>Actualiser les quotas</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  badgeFree: { backgroundColor: colors.accentSoft },
  badgePro: { backgroundColor: colors.brand },
  badgeText: { fontWeight: '700', fontSize: 16, color: colors.brand },
  badgeTextPro: { color: colors.brandInverse },
  tagline: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 15,
    marginBottom: spacing.md,
  },
  note: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: spacing.lg,
  },
  priceRow: { alignItems: 'center', marginBottom: spacing.lg },
  price: { fontSize: 32, fontWeight: '800', color: colors.text },
  priceUnit: { fontSize: 16, fontWeight: '500', color: colors.textMuted },
  priceYear: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  sectionGap: { marginTop: spacing.lg },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  bulletText: { flex: 1, fontSize: 15, color: colors.text, lineHeight: 21 },
  quotaCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quotaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  quotaLabel: { fontSize: 14, color: colors.text },
  quotaValue: { fontSize: 14, fontWeight: '600', color: colors.brand },
  upgradeBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  upgradeBtnText: { color: colors.brandInverse, fontWeight: '700', fontSize: 16 },
  refreshBtn: { alignItems: 'center', marginTop: spacing.md, padding: spacing.sm },
  refreshText: { color: colors.textMuted, fontSize: 14 },
  loader: { marginVertical: spacing.lg },
});
