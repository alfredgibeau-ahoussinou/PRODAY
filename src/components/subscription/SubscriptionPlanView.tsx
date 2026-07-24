import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { User } from '../../models/User';
import { ScreenHeader } from '../ui/ScreenHeader';
import { Icon, type IconName } from '../ui/Icon';
import {
  ANNUAL_DISCOUNT_PERCENT,
  annualSavingsFromMonthly,
  monthlyEquivalentFromYearly,
} from '../../utils/subscriptionPricing';
import {
  FREE_TIER_LABEL,
  PRO_TIER_LABEL,
  ROLES_WITHOUT_STORE_PLAN,
  type SubscriptionPlanDefinition,
} from '../../content/subscriptionPlans';
import { getMercatoQuotaLabel, getPlanForRoleAndLine } from '../../content/subscriptionPlansByLine';
import {
  getSubscriptionPlanVisual,
  isDarkSubscriptionVisual,
  type SubscriptionPlanVisual,
} from '../../content/subscriptionPlanVisuals';
import { subscriptionService } from '../../services/subscription.service';
import { iapService } from '../../services/iap.service';
import { useSubscription } from '../../context/SubscriptionContext';
import { useAppTheme } from '../../context/ProductLineContext';
import { ProDayScreenCanvas } from '../ui/ProDayScreenCanvas';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { ProDayGradient } from '../ui/ProDayGradient';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing, radius, shadows } from '../../theme/designTokens';

type BillingCycle = 'monthly' | 'yearly';

function formatEur(value: number): string {
  return value.toFixed(2).replace('.', ',');
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
  const { productLine, playerSegment, colors } = useAppTheme();
  const plan = getPlanForRoleAndLine(profile.role, productLine, playerSegment);
  const visual = getSubscriptionPlanVisual(profile.role, productLine, playerSegment);
  const [upgrading, setUpgrading] = useState(false);
  const [billing, setBilling] = useState<BillingCycle>('monthly');

  const isPro = subscription?.tier === 'pro';
  const noStorePlan = ROLES_WITHOUT_STORE_PLAN.includes(profile.role);
  const iapReady = iapService.isAvailable();
  const isDarkHero = visual ? isDarkSubscriptionVisual(visual) : false;
  const isSponsorPlan = visual?.variant === 'sponsor';

  const meters = useMemo(() => {
    if (!plan || !visual || isPro || noStorePlan || !usage) return [];
    const rows: { label: string; used: number; limit: number }[] = [];
    const mercatoLabel = getMercatoQuotaLabel(profile.role, productLine, playerSegment);
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
    if (plan.limits.sponsor_club_messages_per_month != null) {
      rows.push({
        label: 'Messages clubs',
        used: usage.sponsor_club_messages,
        limit: plan.limits.sponsor_club_messages_per_month,
      });
    }
    return rows;
  }, [plan, visual, isPro, noStorePlan, usage, profile.role, productLine, playerSegment]);

  const handleUpgrade = useCallback(async () => {
    if (!plan) return;
    setUpgrading(true);
    try {
      const res = await subscriptionService.requestUpgrade(plan.id, billing);
      Alert.alert(res.ok ? 'Abonnement activé' : 'Bêta ProDay', res.message);
      if (res.ok) await refresh();
    } finally {
      setUpgrading(false);
    }
  }, [plan, billing, refresh]);

  if (!visual || !plan) {
    return (
      <ProDayScreenCanvas>
        <SafeAreaView style={styles.fallback} edges={['top', 'bottom']}>
          <ScreenHeader title="Abonnement" onBack={onBack} centered />
          <ProDayText variant="body" muted style={styles.fallbackText}>
            Aucune offre pour ce profil.
          </ProDayText>
        </SafeAreaView>
      </ProDayScreenCanvas>
    );
  }

  const displayPrice =
    billing === 'monthly'
      ? plan.pricing.monthlyEur
      : monthlyEquivalentFromYearly(plan.pricing.yearlyEur);
  const billedLabel =
    billing === 'monthly'
      ? 'Facturation mensuelle'
      : `${formatEur(plan.pricing.yearlyEur)} € / an · −${ANNUAL_DISCOUNT_PERCENT} %`;

  return (
    <ProDayScreenCanvas>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <ScreenHeader
          title={visual.screenTitle}
          onBack={onBack}
          centered
          sponsorDark={isSponsorPlan}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <SubscriptionHero
            visual={visual}
            plan={plan}
            isPro={isPro}
            isDarkHero={isDarkHero}
          />

          {isPro ? (
            <ProDaySurface variant="accent" style={styles.proActiveCard}>
              <Icon name="checkmark-circle" size={22} color={colors.accent} variant="filled" />
              <View style={styles.proActiveCopy}>
                <ProDayText variant="section" accent>
                  Abonnement actif
                </ProDayText>
                <ProDayText variant="caption" muted>
                  {visual.proHighlight ?? plan.proIncludes[0]}
                </ProDayText>
              </View>
            </ProDaySurface>
          ) : (
            <>
              <BillingToggle billing={billing} onChange={setBilling} visual={visual} />

              <ProDaySurface variant="elevated" style={[styles.priceCard, { borderColor: colors.border }]}>
                <ProDayText variant="eyebrow" muted>
                  {plan.label}
                </ProDayText>
                <View style={styles.priceRow}>
                  <ProDayText variant="hero" style={{ color: visual.primary }}>
                    {formatEur(displayPrice)} €
                  </ProDayText>
                  <ProDayText variant="body" muted>
                    / mois
                  </ProDayText>
                </View>
                <ProDayText variant="caption" muted style={styles.billedLabel}>
                  {billedLabel}
                </ProDayText>
                {billing === 'yearly' ? (
                  <View style={[styles.savingsPill, { backgroundColor: visual.primarySoft }]}>
                    <ProDayText variant="caption" style={{ color: visual.primary, fontWeight: '800' }}>
                      Économisez {formatEur(annualSavingsFromMonthly(plan.pricing.monthlyEur))} € / an
                    </ProDayText>
                  </View>
                ) : null}
                {plan.bookingCommissionPercent != null ? (
                  <ProDayText variant="caption" accent style={styles.commission}>
                    + {plan.bookingCommissionPercent} % par RDV réservé via l&apos;app
                  </ProDayText>
                ) : null}
              </ProDaySurface>
            </>
          )}

          {plan.bookingCommissionNote ? (
            <ProDaySurface variant="module" style={[styles.noteCard, { borderColor: colors.border }]}>
              <Icon name="heart" size={18} color={visual.primary} />
              <ProDayText variant="caption" muted style={styles.noteText}>
                {plan.bookingCommissionNote}
              </ProDayText>
            </ProDaySurface>
          ) : null}

          {loading ? (
            <ActivityIndicator color={visual.primary} style={styles.loader} />
          ) : meters.length > 0 ? (
            <View style={styles.section}>
              <ProDayText variant="eyebrow" muted>
                {visual.quotaTitle}
              </ProDayText>
              <ProDaySurface variant="module" style={[styles.meterCard, { borderColor: colors.border }]}>
                {meters.map((m) => (
                  <QuotaMeter key={m.label} {...m} accent={visual.primary} />
                ))}
              </ProDaySurface>
            </View>
          ) : null}

          <View style={styles.section}>
            <ProDayText variant="eyebrow" muted>
              {visual.compareTitle}
            </ProDayText>

            <ProDaySurface
              variant="module"
              style={[
                styles.proPlanCard,
                { borderColor: visual.primary, backgroundColor: visual.primarySoft },
              ]}
              accentBar
            >
              <View style={styles.proPlanHead}>
                <View style={[styles.proBadge, { backgroundColor: visual.primary }]}>
                  <Icon name="star" size={12} color={visual.onPrimary} variant="filled" />
                  <ProDayText variant="caption" inverse style={styles.proBadgeText}>
                    {PRO_TIER_LABEL}
                  </ProDayText>
                </View>
                {!isPro ? (
                  <ProDayText variant="caption" style={{ color: visual.primary, fontWeight: '800' }}>
                    {billing === 'monthly'
                      ? `${formatEur(plan.pricing.monthlyEur)} €/mois`
                      : `${formatEur(plan.pricing.yearlyEur)} €/an`}
                  </ProDayText>
                ) : null}
              </View>
              <ProDayText variant="section" style={{ color: visual.primary }}>
                {plan.label}
              </ProDayText>
              {plan.proIncludes.map((item) => (
                <FeatureRow key={item} text={item} icon={visual.featureIconPro} color={visual.primary} />
              ))}
            </ProDaySurface>

            <ProDaySurface variant="flat" style={[styles.freePlanCard, { borderColor: colors.border }]}>
              <ProDayText variant="caption" muted style={styles.freeLabel}>
                {visual.freeColumnTitle} · {FREE_TIER_LABEL}
              </ProDayText>
              {plan.freeIncludes.map((item) => (
                <FeatureRow key={item} text={item} icon={visual.featureIconFree} color={colors.textMuted} muted />
              ))}
            </ProDaySurface>
          </View>
        </ScrollView>

        {!isPro ? (
          <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
            <TouchableOpacity onPress={() => void handleUpgrade()} disabled={upgrading} activeOpacity={0.9}>
              <ProDayGradient kind="cta" style={styles.cta}>
                {upgrading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ProDayText variant="caption" inverse style={styles.ctaText}>
                    {plan.pricing.storeAvailable && iapReady
                      ? visual.ctaVerb
                      : 'Infos abonnement'}
                  </ProDayText>
                )}
              </ProDayGradient>
            </TouchableOpacity>
            <ProDayText variant="caption" muted style={styles.footnote}>
              {plan.pricing.storeAvailable
                ? iapReady
                  ? 'Paiement sécurisé App Store / Google Play'
                  : 'Accès gratuit pendant la bêta — achats store via build EAS'
                : 'Accès gratuit pendant la bêta — abonnements store à venir'}
            </ProDayText>
          </View>
        ) : (
          <TouchableOpacity style={styles.refreshLink} onPress={() => void refresh()}>
            <ProDayText variant="caption" muted>
              Actualiser mon abonnement
            </ProDayText>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </ProDayScreenCanvas>
  );
};

const SubscriptionHero: React.FC<{
  visual: SubscriptionPlanVisual;
  plan: SubscriptionPlanDefinition;
  isPro: boolean;
  isDarkHero: boolean;
}> = ({ visual, plan, isPro, isDarkHero }) => (
  <View
    style={[
      styles.hero,
      {
        backgroundColor: visual.heroBg,
        borderColor: visual.heroBorder ?? 'transparent',
      },
      visual.heroBorder ? styles.heroBordered : null,
      shadows.card,
    ]}
  >
    <View style={[styles.heroIcon, { backgroundColor: visual.primarySoft }]}>
      <Icon name={visual.icon} size={28} color={visual.primary} variant="filled" />
    </View>
    <ProDayText
      variant="eyebrow"
      inverse={isDarkHero}
      muted={!isDarkHero}
      style={{ color: isDarkHero ? visual.heroSubtext : undefined }}
    >
      {visual.eyebrow}
    </ProDayText>
    <View
      style={[
        styles.tierPill,
        isPro
          ? { backgroundColor: visual.primary }
          : { backgroundColor: isDarkHero ? 'rgba(255,255,255,0.12)' : visual.primarySoft },
      ]}
    >
      <Icon
        name={isPro ? 'star' : 'star-outline'}
        size={14}
        color={isPro ? visual.onPrimary : visual.primary}
      />
      <ProDayText
        variant="caption"
        inverse={isPro || isDarkHero}
        style={{
          fontWeight: '800',
          color: isPro ? visual.onPrimary : isDarkHero ? visual.heroSubtext : visual.primary,
        }}
      >
        {isPro ? PRO_TIER_LABEL : FREE_TIER_LABEL}
      </ProDayText>
    </View>
    <ProDayText
      variant="hero"
      inverse={isDarkHero}
      style={[styles.heroTitle, { color: isDarkHero ? visual.heroText : undefined }]}
    >
      {plan.label}
    </ProDayText>
    <ProDayText
      variant="body"
      inverse={isDarkHero}
      muted={!isDarkHero}
      style={[styles.heroSub, { color: isDarkHero ? visual.heroSubtext : undefined }]}
    >
      {plan.tagline}
    </ProDayText>
    {visual.proHighlight ? (
      <View style={[styles.highlightPill, { backgroundColor: visual.primarySoft }]}>
        <ProDayText variant="caption" style={{ color: visual.primary, fontWeight: '800' }}>
          {visual.proHighlight}
        </ProDayText>
      </View>
    ) : null}
  </View>
);

const BillingToggle: React.FC<{
  billing: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
  visual: SubscriptionPlanVisual;
}> = ({ billing, onChange, visual }) => {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.billingTrack, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
      {(['monthly', 'yearly'] as const).map((cycle) => {
        const on = billing === cycle;
        return (
          <TouchableOpacity
            key={cycle}
            style={[
              styles.billingTab,
              on && { backgroundColor: colors.surface, ...shadows.soft },
            ]}
            onPress={() => onChange(cycle)}
            activeOpacity={0.9}
          >
            <ProDayText variant="caption" style={on ? { fontWeight: '800' } : undefined}>
              {cycle === 'monthly' ? 'Mensuel' : 'Annuel'}
            </ProDayText>
            {cycle === 'yearly' ? (
              <ProDayText variant="caption" style={{ color: visual.primary, fontWeight: '800', fontSize: 10 }}>
                −{ANNUAL_DISCOUNT_PERCENT} %
              </ProDayText>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const QuotaMeter: React.FC<{ label: string; used: number; limit: number; accent: string }> = ({
  label,
  used,
  limit,
  accent,
}) => {
  const { colors } = useAppTheme();
  const ratio = limit > 0 ? Math.min(1, used / limit) : 0;
  const atLimit = used >= limit;
  return (
    <View style={styles.meterRow}>
      <View style={styles.meterHead}>
        <ProDayText variant="caption">{label}</ProDayText>
        <ProDayText variant="caption" style={atLimit ? { color: colors.warning, fontWeight: '800' } : undefined}>
          {used} / {limit}
        </ProDayText>
      </View>
      <View style={[styles.meterTrack, { backgroundColor: colors.surfaceMuted }]}>
        <View
          style={[
            styles.meterFill,
            { width: `${ratio * 100}%`, backgroundColor: atLimit ? colors.warning : accent },
          ]}
        />
      </View>
    </View>
  );
};

const FeatureRow: React.FC<{
  text: string;
  icon: IconName;
  color: string;
  muted?: boolean;
}> = ({ text, icon, color, muted }) => (
  <View style={styles.featureRow}>
    <Icon name={icon} size={15} color={color} variant="filled" />
    <ProDayText variant="caption" muted={muted} style={styles.featureText}>
      {text}
    </ProDayText>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1 },
  fallback: { flex: 1 },
  fallbackText: { textAlign: 'center', padding: spacing.xl },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.lg,
  },
  hero: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
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
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  heroTitle: { textAlign: 'center' },
  heroSub: { textAlign: 'center', marginTop: spacing.xs },
  highlightPill: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  billingTrack: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 4,
    marginBottom: spacing.md,
    gap: 4,
  },
  billingTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: 2,
  },
  priceCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  billedLabel: { marginTop: spacing.xs },
  savingsPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
  },
  commission: { marginTop: spacing.sm },
  noteCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  noteText: { flex: 1, lineHeight: 18 },
  proActiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  proActiveCopy: { flex: 1, gap: 2 },
  section: { marginBottom: spacing.lg, gap: spacing.sm },
  meterCard: { borderWidth: 1, padding: spacing.md, gap: spacing.md },
  meterRow: { gap: spacing.xs },
  meterHead: { flexDirection: 'row', justifyContent: 'space-between' },
  meterTrack: { height: 6, borderRadius: radius.pill, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: radius.pill },
  proPlanCard: { borderWidth: 2, padding: spacing.md, marginBottom: spacing.sm, gap: spacing.xs },
  proPlanHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  proBadgeText: { fontWeight: '800', fontSize: 10 },
  freePlanCard: { borderWidth: 1, padding: spacing.md, gap: spacing.xs },
  freeLabel: { fontWeight: '800', marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: spacing.xs },
  featureText: { flex: 1, lineHeight: 18 },
  loader: { marginVertical: spacing.lg },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cta: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  ctaText: { fontWeight: '800', fontSize: 15 },
  footnote: { textAlign: 'center', marginTop: spacing.xs },
  refreshLink: { alignItems: 'center', padding: spacing.md },
});
