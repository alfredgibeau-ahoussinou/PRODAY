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
  ANNUAL_DISCOUNT_PERCENT,
  annualSavingsFromMonthly,
  monthlyEquivalentFromYearly,
} from '../../utils/subscriptionPricing';
import {
  FREE_TIER_LABEL,
  PRO_TIER_LABEL,
  ROLES_WITHOUT_STORE_PLAN,
  getPlanForRoleAndLine,
  type SubscriptionPlanDefinition,
} from '../../content/subscriptionPlans';
import { getMercatoQuotaLabel } from '../../content/subscriptionPlansByLine';
import {
  getSubscriptionPlanVisual,
  isDarkSubscriptionVisual,
  type SubscriptionPlanVisual,
} from '../../content/subscriptionPlanVisuals';
import { subscriptionService } from '../../services/subscription.service';
import { useSubscription } from '../../context/SubscriptionContext';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius, shadows } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

function formatEur(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

interface QuotaMeterProps {
  label: string;
  used: number;
  limit: number;
  visual: SubscriptionPlanVisual;
}

const QuotaMeter: React.FC<QuotaMeterProps> = ({ label, used, limit, visual }) => {
  const { colors: c } = useAppTheme();
  const meterStyles = useMemo(() => createMeterStyles(c), [c]);
  const ratio = limit > 0 ? Math.min(1, used / limit) : 0;
  const atLimit = used >= limit;
  const isDark = isDarkSubscriptionVisual(visual);

  return (
    <View style={meterStyles.wrap}>
      <View style={meterStyles.row}>
        <Text style={[meterStyles.label, isDark && { color: '#E4E4E7' }]}>{label}</Text>
        <Text style={[meterStyles.value, atLimit && meterStyles.valueWarn, isDark && { color: '#FAFAFA' }]}>
          {used} / {limit}
        </Text>
      </View>
      <View style={[meterStyles.track, isDark && { backgroundColor: '#27272A' }]}>
        <View
          style={[
            meterStyles.fill,
            { width: `${ratio * 100}%`, backgroundColor: visual.primary },
            atLimit && { backgroundColor: c.warning },
          ]}
        />
      </View>
    </View>
  );
};

function createMeterStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: { marginBottom: spacing.md },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
    label: { fontSize: 14, fontWeight: '600', color: c.text },
    value: { fontSize: 14, fontWeight: '800', color: c.text },
    valueWarn: { color: c.warning },
    track: {
      height: 6,
      borderRadius: radius.pill,
      backgroundColor: c.surfaceMuted,
      overflow: 'hidden',
    },
    fill: { height: '100%', borderRadius: radius.pill },
  });
}

interface PlanColumnProps {
  title: string;
  items: string[];
  visual: SubscriptionPlanVisual;
  highlighted?: boolean;
  priceLabel?: string;
}

const PlanColumn: React.FC<PlanColumnProps> = ({
  title,
  items,
  visual,
  highlighted,
  priceLabel,
}) => {
  const { colors: c } = useAppTheme();
  const colStyles = useMemo(() => createColStyles(c), [c]);
  const isPremium = visual.priceStyle === 'premium' && highlighted;
  const isMedical = visual.priceStyle === 'medical';
  const isDarkRoot = isDarkSubscriptionVisual(visual);

  return (
    <View
      style={[
        colStyles.card,
        highlighted && { backgroundColor: visual.heroBg, borderColor: visual.primary },
        isPremium && colStyles.cardPremium,
        isMedical && highlighted && { backgroundColor: visual.primary, borderColor: visual.primary },
        !highlighted && isDarkRoot && colStyles.cardDarkFree,
      ]}
    >
      <Text
        style={[
          colStyles.title,
          highlighted && { color: isMedical ? visual.onPrimary : visual.heroSubtext },
          !highlighted && isDarkRoot && { color: '#A1A1AA' },
        ]}
      >
        {title}
      </Text>
      {priceLabel ? (
        <Text
          style={[
            colStyles.price,
            highlighted && { color: isMedical ? visual.onPrimary : visual.heroText },
          ]}
        >
          {priceLabel}
        </Text>
      ) : null}
      {items.map((item) => (
        <View key={item} style={colStyles.row}>
          <Icon
            name={highlighted ? visual.featureIconPro : visual.featureIconFree}
            size={14}
            color={highlighted ? (isMedical ? visual.onPrimary : visual.primary) : c.success}
          />
          <Text
            style={[
              colStyles.item,
              highlighted && { color: isMedical ? visual.onPrimary : visual.heroSubtext },
              !highlighted && isDarkRoot && { color: '#D4D4D8' },
            ]}
          >
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
};

function createColStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      minWidth: 0,
    },
    cardPremium: {
      borderWidth: 2,
      ...shadows.card,
    },
    cardDarkFree: {
      backgroundColor: '#18181B',
      borderColor: '#3F3F46',
    },
    title: {
      fontSize: 11,
      fontWeight: '900',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      color: c.textMuted,
      marginBottom: spacing.xs,
    },
    price: { fontSize: 20, fontWeight: '900', color: c.text, marginBottom: spacing.sm },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, marginTop: spacing.xs },
    item: { flex: 1, fontSize: 12, lineHeight: 17, color: c.textSecondary },
  });
}

interface SubscriptionPlanViewProps {
  profile: User;
  onBack: () => void;
}

export const SubscriptionPlanView: React.FC<SubscriptionPlanViewProps> = ({
  profile,
  onBack,
}) => {
  const { subscription, usage, loading, refresh } = useSubscription();
  const { productLine, colors: c } = useAppTheme();
  const styles = useMemo(() => createPlanViewStyles(c), [c]);
  const plan = getPlanForRoleAndLine(profile.role, productLine);
  const visual = getSubscriptionPlanVisual(profile.role, productLine);
  const [upgrading, setUpgrading] = useState(false);

  const isPro = subscription?.tier === 'pro';
  const noStorePlan = ROLES_WITHOUT_STORE_PLAN.includes(profile.role);
  const isDarkRoot = visual ? isDarkSubscriptionVisual(visual) : false;
  const isSponsorPlan = visual?.variant === 'sponsor';

  const meters = useMemo(() => {
    if (!plan || !visual || isPro || noStorePlan || !usage) return [];
    const rows: { label: string; used: number; limit: number }[] = [];
    const mercatoLabel = getMercatoQuotaLabel(profile.role, productLine);
    if (plan.limits.mercato_apply_per_month != null && mercatoLabel) {
      rows.push({
        label: mercatoLabel,
        used: usage.mercato_applications,
        limit: plan.limits.mercato_apply_per_month,
      });
    }
    if (plan.limits.recruitment_messages_per_month != null) {
      rows.push({
        label: mercatoLabel ?? visual.quotaTitle,
        used: usage.recruitment_messages,
        limit: plan.limits.recruitment_messages_per_month,
      });
    }
    return rows;
  }, [plan, visual, isPro, noStorePlan, usage, profile.role, productLine]);

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

  if (!visual || !plan) {
    return (
      <SafeAreaView style={styles.fallback} edges={['top', 'bottom']}>
        <ScreenHeader title="Abonnement" onBack={onBack} centered />
        <Text style={styles.fallbackText}>Aucune offre pour ce profil.</Text>
      </SafeAreaView>
    );
  }

  const renderCompare = (p: SubscriptionPlanDefinition) => {
    if (visual.priceStyle === 'premium') {
      return (
        <View style={styles.compareStack}>
          <PlanColumn
            title={visual.freeColumnTitle}
            items={p.freeIncludes}
            visual={visual}
          />
          <PlanColumn
            title={p.label}
            items={p.proIncludes}
            visual={visual}
            highlighted
            priceLabel={`${formatEur(p.pricing.monthlyEur)} €/mois`}
          />
        </View>
      );
    }

    return (
      <View style={styles.compareRow}>
        <PlanColumn title={visual.freeColumnTitle} items={p.freeIncludes} visual={visual} />
        <PlanColumn
          title={p.label}
          items={p.proIncludes}
          visual={visual}
          highlighted
          priceLabel={`${formatEur(p.pricing.monthlyEur)} €/mois`}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: visual.rootBg }]} edges={['top', 'bottom']}>
      <ScreenHeader
        title={visual.screenTitle}
        onBack={onBack}
        centered
        sponsorDark={isSponsorPlan}
        dark={isDarkRoot && !isSponsorPlan}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.hero,
            {
              backgroundColor: visual.heroBg,
              borderColor: visual.heroBorder ?? 'transparent',
            },
            visual.heroBorder ? styles.heroBordered : null,
          ]}
        >
          <View style={[styles.heroIcon, { backgroundColor: visual.primarySoft }]}>
            <Icon name={visual.icon} size={28} color={visual.primary} variant="filled" />
          </View>
          <Text style={[styles.heroEyebrow, { color: visual.heroSubtext }]}>{visual.eyebrow}</Text>
          <View
            style={[
              styles.tierPill,
              isPro
                ? { backgroundColor: visual.primary }
                : { backgroundColor: visual.heroMode === 'light' ? visual.primarySoft : 'rgba(255,255,255,0.12)' },
            ]}
          >
            <Icon
              name={isPro ? 'star' : 'star-outline'}
              size={14}
              color={isPro ? visual.onPrimary : visual.primary}
            />
            <Text
              style={[
                styles.tierText,
                { color: isPro ? visual.onPrimary : visual.heroMode === 'light' ? visual.primary : visual.heroSubtext },
              ]}
            >
              {isPro ? PRO_TIER_LABEL : FREE_TIER_LABEL}
            </Text>
          </View>
          <Text style={[styles.heroTitle, { color: visual.heroText }]}>{plan.label}</Text>
          <Text style={[styles.heroSub, { color: visual.heroSubtext }]}>{plan.tagline}</Text>
          {visual.proHighlight ? (
            <View style={[styles.highlightPill, { backgroundColor: visual.primarySoft }]}>
              <Text style={[styles.highlightText, { color: visual.primary }]}>
                {visual.proHighlight}
              </Text>
            </View>
          ) : null}
        </View>

        {!isPro ? (
          <View
            style={[
              styles.priceCard,
              visual.priceStyle === 'premium' && styles.priceCardPremium,
              visual.priceStyle === 'medical' && styles.priceCardMedical,
              isDarkRoot && styles.priceCardDark,
            ]}
          >
            <Text
              style={[
                styles.priceMain,
                isDarkRoot && { color: visual.primary },
                visual.priceStyle === 'medical' && { color: visual.primary },
              ]}
            >
              {formatEur(plan.pricing.monthlyEur)} €
            </Text>
            <Text style={[styles.pricePer, isDarkRoot && { color: '#A1A1AA' }]}>/ mois</Text>
            <Text style={[styles.priceAlt, isDarkRoot && { color: '#D4D4D8' }]}>
              ou {formatEur(plan.pricing.yearlyEur)} € / an · −{ANNUAL_DISCOUNT_PERCENT} % (
              {formatEur(annualSavingsFromMonthly(plan.pricing.monthlyEur))} € d&apos;économie)
            </Text>
            {plan.bookingCommissionPercent != null ? (
              <Text style={[styles.commissionNote, { color: visual.primary }]}>
                + {plan.bookingCommissionPercent} % par RDV réservé via l&apos;app
              </Text>
            ) : null}
          </View>
        ) : null}

        {plan.bookingCommissionNote ? (
          <View style={[styles.commissionCard, { backgroundColor: visual.primarySoft, borderColor: visual.heroBorder ?? visual.primarySoft }]}>
            <Icon name="heart" size={18} color={visual.primary} />
            <Text style={[styles.commissionCardText, { color: visual.heroText }]}>{plan.bookingCommissionNote}</Text>
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator color={visual.primary} style={styles.loader} />
        ) : meters.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDarkRoot && styles.sectionTitleDark]}>
              {visual.quotaTitle}
            </Text>
            <View style={[styles.meterCard, isDarkRoot && styles.meterCardDark]}>
              {meters.map((m) => (
                <QuotaMeter key={m.label} label={m.label} used={m.used} limit={m.limit} visual={visual} />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkRoot && styles.sectionTitleDark]}>
            {visual.compareTitle}
          </Text>
          {renderCompare(plan)}
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {!isPro ? (
        <View style={[styles.footer, isDarkRoot && styles.footerDark]}>
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: visual.primary }]}
            onPress={() => void handleUpgrade()}
            disabled={upgrading}
            activeOpacity={0.88}
          >
            {upgrading ? (
              <ActivityIndicator size="small" color={visual.onPrimary} />
            ) : (
              <Text style={[styles.ctaText, { color: visual.onPrimary }]}>{visual.ctaVerb}</Text>
            )}
          </TouchableOpacity>
          <Text style={[styles.ctaFootnote, isDarkRoot && { color: '#71717A' }]}>
            {plan.pricing.storeAvailable
              ? 'Paiement App Store / Google Play'
              : 'Disponible très prochainement'}
          </Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.refreshLink} onPress={() => void refresh()}>
          <Text style={[styles.refreshText, isDarkRoot && { color: '#A1A1AA' }]}>Actualiser</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

function createPlanViewStyles(c: AppColors) {
  return StyleSheet.create({
  root: { flex: 1 },
  fallback: { flex: 1, backgroundColor: c.background },
  fallbackText: { textAlign: 'center', color: c.textMuted, padding: spacing.xl },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  hero: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  heroBordered: { borderWidth: 1 },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
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
  tierText: { fontWeight: '800', fontSize: 12 },
  heroTitle: { fontSize: 26, fontWeight: '900', textAlign: 'center' },
  heroSub: { fontSize: 14, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  highlightPill: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  highlightText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  priceCard: {
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: c.border,
  },
  priceCardPremium: {
    backgroundColor: '#18181B',
    borderColor: '#F59E0B',
    borderWidth: 2,
  },
  priceCardMedical: {
    backgroundColor: '#FFFFFF',
    borderColor: '#99F6E4',
  },
  priceCardDark: {
    backgroundColor: '#18181B',
    borderColor: '#3F3F46',
  },
  priceMain: { fontSize: 32, fontWeight: '900', color: c.text },
  pricePer: { fontSize: 16, color: c.textMuted, fontWeight: '600', marginTop: -4 },
  priceAlt: { fontSize: 13, color: c.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
  commissionNote: { fontSize: 12, fontWeight: '700', marginTop: spacing.sm, textAlign: 'center' },
  commissionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  commissionCardText: { flex: 1, fontSize: 13, lineHeight: 19 },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: c.textMuted,
    marginBottom: spacing.sm,
  },
  sectionTitleDark: { color: '#A1A1AA' },
  meterCard: {
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: c.border,
  },
  meterCardDark: { backgroundColor: '#18181B', borderColor: '#3F3F46' },
  compareRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'stretch' },
  compareStack: { gap: spacing.sm },
  loader: { marginVertical: spacing.xl },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.border,
    backgroundColor: c.surface,
    alignItems: 'center',
  },
  footerDark: { backgroundColor: '#09090B', borderTopColor: '#27272A' },
  cta: {
    alignSelf: 'stretch',
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    maxHeight: 48,
  },
  ctaText: { fontWeight: '800', fontSize: 15 },
  ctaFootnote: {
    fontSize: 11,
    color: c.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  refreshLink: { alignItems: 'center', padding: spacing.md },
  refreshText: { fontSize: 13, color: c.textMuted, fontWeight: '600' },
  });
}
