import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { User } from '../../models/User';
import { ScreenHeader } from '../ui/ScreenHeader';
import { Icon } from '../ui/Icon';
import {
  FREE_TIER_LABEL,
  PRO_TIER_LABEL,
  getPlanForRole,
  ROLES_WITHOUT_STORE_PLAN,
  type SubscriptionPlanDefinition,
} from '../../content/subscriptionPlans';
import { subscriptionService } from '../../services/subscription.service';
import { useSubscription } from '../../context/SubscriptionContext';
import { colors, spacing, radius, shadows } from '../../theme/designTokens';

function formatEur(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

interface QuotaMeterProps {
  label: string;
  used: number;
  limit: number;
}

const QuotaMeter: React.FC<QuotaMeterProps> = ({ label, used, limit }) => {
  const ratio = limit > 0 ? Math.min(1, used / limit) : 0;
  const atLimit = used >= limit;
  return (
    <View style={meterStyles.wrap}>
      <View style={meterStyles.row}>
        <Text style={meterStyles.label}>{label}</Text>
        <Text style={[meterStyles.value, atLimit && meterStyles.valueWarn]}>
          {used} / {limit}
        </Text>
      </View>
      <View style={meterStyles.track}>
        <View style={[meterStyles.fill, { width: `${ratio * 100}%` }, atLimit && meterStyles.fillFull]} />
      </View>
    </View>
  );
};

const meterStyles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  value: { fontSize: 14, fontWeight: '800', color: colors.text },
  valueWarn: { color: colors.warning },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
  },
  fillFull: { backgroundColor: colors.warning },
});

interface PlanColumnProps {
  title: string;
  highlighted?: boolean;
  priceLabel?: string;
  items: string[];
}

const PlanColumn: React.FC<PlanColumnProps> = ({ title, highlighted, priceLabel, items }) => (
  <View style={[colStyles.card, highlighted && colStyles.cardPro]}>
    <Text style={[colStyles.title, highlighted && colStyles.titlePro]}>{title}</Text>
    {priceLabel ? <Text style={[colStyles.price, highlighted && colStyles.pricePro]}>{priceLabel}</Text> : null}
    {items.map((item) => (
      <View key={item} style={colStyles.row}>
        <Icon
          name={highlighted ? 'star' : 'checkmark-circle'}
          size={14}
          color={highlighted ? colors.brandInverse : colors.success}
        />
        <Text style={[colStyles.item, highlighted && colStyles.itemPro]}>{item}</Text>
      </View>
    ))}
  </View>
);

const colStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 0,
  },
  cardPro: {
    backgroundColor: colors.surfaceInverse,
    borderColor: colors.brand,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  titlePro: { color: colors.heroMuted },
  price: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  pricePro: { color: colors.brandInverse },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, marginTop: spacing.xs },
  item: { flex: 1, fontSize: 12, lineHeight: 17, color: colors.textSecondary },
  itemPro: { color: colors.heroMuted },
});

interface SubscriptionPlanViewProps {
  profile: User;
  onBack: () => void;
}

export const SubscriptionPlanView: React.FC<SubscriptionPlanViewProps> = ({
  profile,
  onBack,
}) => {
  const { subscription, usage, loading, refresh } = useSubscription();
  const plan = getPlanForRole(profile.role);
  const [upgrading, setUpgrading] = useState(false);

  const isPro = subscription?.tier === 'pro';
  const noStorePlan = ROLES_WITHOUT_STORE_PLAN.includes(profile.role);

  const meters = useMemo(() => {
    if (!plan || isPro || noStorePlan || !usage) return [];
    const rows: { label: string; used: number; limit: number }[] = [];
    if (plan.limits.mercato_apply_per_month != null) {
      rows.push({
        label: 'Candidatures Mercato',
        used: usage.mercato_applications,
        limit: plan.limits.mercato_apply_per_month,
      });
    }
    if (plan.limits.recruitment_messages_per_month != null) {
      rows.push({
        label: 'Messages recrutement',
        used: usage.recruitment_messages,
        limit: plan.limits.recruitment_messages_per_month,
      });
    }
    return rows;
  }, [plan, isPro, noStorePlan, usage]);

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

  const renderCompare = (p: SubscriptionPlanDefinition) => (
    <View style={styles.compareRow}>
      <PlanColumn title={FREE_TIER_LABEL} items={p.freeIncludes} />
      <PlanColumn
        title={p.label}
        highlighted
        priceLabel={`${formatEur(p.pricing.monthlyEur)} €/mois`}
        items={p.proIncludes}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScreenHeader title="Mon abonnement" onBack={onBack} centered />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={[styles.tierPill, isPro ? styles.tierPillPro : styles.tierPillFree]}>
            <Icon
              name={isPro ? 'star' : 'star-outline'}
              size={16}
              color={isPro ? colors.brandInverse : colors.brand}
            />
            <Text style={[styles.tierText, isPro && styles.tierTextPro]}>
              {isPro ? PRO_TIER_LABEL : FREE_TIER_LABEL}
            </Text>
          </View>
          <Text style={styles.heroTitle}>{plan?.label ?? 'ProDay'}</Text>
          <Text style={styles.heroSub}>
            {noStorePlan
              ? 'Accès complet inclus pour votre rôle au lancement beta.'
              : plan?.tagline ?? 'Gérez votre formule et vos limites mensuelles.'}
          </Text>
        </View>

        {noStorePlan ? (
          <View style={styles.infoCard}>
            <Icon name="checkmark-circle" size={22} color={colors.success} />
            <Text style={styles.infoText}>
              Organisateurs, sponsors et pôle médical : pas d’abonnement payant requis pour
              l’instant. Profitez de toutes les fonctionnalités ouvertes en beta.
            </Text>
          </View>
        ) : null}

        {!noStorePlan && plan && !isPro ? (
          <View style={styles.priceCard}>
            <Text style={styles.priceMain}>{formatEur(plan.pricing.monthlyEur)} €</Text>
            <Text style={styles.pricePer}>/ mois</Text>
            <Text style={styles.priceAlt}>
              ou {plan.pricing.yearlyEur} € / an · économisez ~20 %
            </Text>
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator color={colors.brand} style={styles.loader} />
        ) : meters.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ce mois-ci</Text>
            <View style={styles.meterCard}>
              {meters.map((m) => (
                <QuotaMeter key={m.label} label={m.label} used={m.used} limit={m.limit} />
              ))}
            </View>
          </View>
        ) : null}

        {plan && !noStorePlan ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comparer les offres</Text>
            {renderCompare(plan)}
          </View>
        ) : null}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {!noStorePlan && !isPro && plan ? (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => void handleUpgrade()}
            disabled={upgrading}
            activeOpacity={0.88}
          >
            {upgrading ? (
              <ActivityIndicator size="small" color={colors.brandInverse} />
            ) : (
              <Text style={styles.ctaText}>Passer à {plan.label}</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.ctaFootnote}>
            {plan.pricing.storeAvailable
              ? 'Paiement App Store / Google Play'
              : 'Disponible très prochainement'}
          </Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.refreshLink} onPress={() => void refresh()}>
          <Text style={styles.refreshText}>Actualiser</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  hero: {
    backgroundColor: colors.surfaceInverse,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  tierPillFree: { backgroundColor: 'rgba(255,255,255,0.12)' },
  tierPillPro: { backgroundColor: colors.brandInverse },
  tierText: { fontWeight: '800', fontSize: 12, color: colors.heroMuted },
  tierTextPro: { color: colors.brand },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.brandInverse,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 14,
    color: colors.heroMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.successBg,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.success,
  },
  infoText: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.text },
  priceCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priceMain: { fontSize: 28, fontWeight: '900', color: colors.text },
  pricePer: { fontSize: 16, color: colors.textMuted, fontWeight: '600', marginTop: -4 },
  priceAlt: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  meterCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compareRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'stretch',
  },
  loader: { marginVertical: spacing.xl },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  cta: {
    alignSelf: 'stretch',
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    maxHeight: 48,
  },
  ctaText: { color: colors.brandInverse, fontWeight: '800', fontSize: 15 },
  ctaFootnote: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  refreshLink: { alignItems: 'center', padding: spacing.md },
  refreshText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
});
