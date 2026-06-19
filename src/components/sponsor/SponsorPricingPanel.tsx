import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from '../ui/Icon';
import { SPONSOR_PRICING_TIERS, type SponsorPricingTier } from '../../content/sponsorPricing';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import { spacing, radius } from '../../theme/designTokens';

type BillingCycle = 'monthly' | 'yearly';

export type { BillingCycle };

interface SponsorPricingPanelProps {
  onSelectTier: (tier: SponsorPricingTier, billing: BillingCycle) => void;
  compact?: boolean;
}

function formatPrice(value: number): string {
  if (value === 0) return '0 €';
  return `${value.toLocaleString('fr-FR')} €`;
}

export const SponsorPricingPanel: React.FC<SponsorPricingPanelProps> = ({
  onSelectTier,
  compact = false,
}) => {
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const styles = useMemo(() => createStyles(compact), [compact]);

  return (
    <View style={styles.wrap}>
      <View style={styles.billingRow}>
        {(['monthly', 'yearly'] as const).map((cycle) => (
          <TouchableOpacity
            key={cycle}
            style={[styles.billingChip, billing === cycle && styles.billingChipOn]}
            onPress={() => setBilling(cycle)}
            activeOpacity={0.85}
          >
            <Text style={[styles.billingText, billing === cycle && styles.billingTextOn]}>
              {cycle === 'monthly' ? 'Mensuel' : 'Annuel −20 %'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {SPONSOR_PRICING_TIERS.map((tier) => {
        const price = billing === 'monthly' ? tier.monthlyEur : tier.yearlyEur;
        const priceLabel =
          tier.monthlyEur === 0
            ? 'Gratuit'
            : billing === 'monthly'
              ? `${formatPrice(price)}/mois`
              : `${formatPrice(price)}/an`;

        return (
          <View
            key={tier.id}
            style={[styles.card, tier.highlighted && styles.cardHighlighted]}
          >
            {tier.badge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{tier.badge}</Text>
              </View>
            ) : null}
            <Text style={styles.tierName}>{tier.name}</Text>
            <Text style={styles.tierTagline}>{tier.tagline}</Text>
            <Text style={styles.price}>{priceLabel}</Text>
            {billing === 'yearly' && tier.monthlyEur > 0 ? (
              <Text style={styles.priceHint}>
                soit {formatPrice(Math.round((tier.yearlyEur / 12) * 100) / 100)}/mois
              </Text>
            ) : null}
            <View style={styles.features}>
              {tier.features.map((feature) => (
                <View key={feature} style={styles.featureRow}>
                  <Icon name="checkmark-circle" size={14} color={SPONSOR_THEME.gold} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.cta, tier.highlighted && styles.ctaHighlighted]}
              onPress={() => onSelectTier(tier, billing)}
              activeOpacity={0.88}
            >
              <Text style={[styles.ctaText, tier.highlighted && styles.ctaTextHighlighted]}>
                {tier.ctaLabel}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
};

function createStyles(compact: boolean) {
  return StyleSheet.create({
    wrap: { gap: spacing.md },
    billingRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    billingChip: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: SPONSOR_THEME.borderSubtle,
      alignItems: 'center',
      backgroundColor: SPONSOR_THEME.surface,
    },
    billingChipOn: {
      backgroundColor: SPONSOR_THEME.primary,
      borderColor: SPONSOR_THEME.primary,
    },
    billingText: { fontSize: 12, fontWeight: '700', color: SPONSOR_THEME.textMuted },
    billingTextOn: { color: SPONSOR_THEME.onPrimary },
    card: {
      backgroundColor: SPONSOR_THEME.surface,
      borderRadius: radius.lg,
      padding: compact ? spacing.md : spacing.lg,
      borderWidth: 1,
      borderColor: SPONSOR_THEME.borderSubtle,
      gap: spacing.xs,
    },
    cardHighlighted: {
      borderColor: SPONSOR_THEME.gold,
      backgroundColor: SPONSOR_THEME.goldSurface,
    },
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: SPONSOR_THEME.gold,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.pill,
      marginBottom: spacing.xs,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: SPONSOR_THEME.goldInk,
      textTransform: 'uppercase',
    },
    tierName: { fontSize: 20, fontWeight: '800', color: SPONSOR_THEME.text },
    tierTagline: { fontSize: 13, color: SPONSOR_THEME.textSecondary, marginBottom: spacing.sm },
    price: { fontSize: 28, fontWeight: '800', color: SPONSOR_THEME.gold },
    priceHint: { fontSize: 11, color: SPONSOR_THEME.textMuted, marginBottom: spacing.sm },
    features: { gap: spacing.sm, marginVertical: spacing.md },
    featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    featureText: { flex: 1, fontSize: 13, color: SPONSOR_THEME.textSecondary, lineHeight: 18 },
    cta: {
      marginTop: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: SPONSOR_THEME.borderSubtle,
      backgroundColor: SPONSOR_THEME.surfaceMuted,
    },
    ctaHighlighted: {
      backgroundColor: SPONSOR_THEME.primary,
      borderColor: SPONSOR_THEME.primary,
    },
    ctaText: { fontSize: 14, fontWeight: '800', color: SPONSOR_THEME.text },
    ctaTextHighlighted: { color: SPONSOR_THEME.onPrimary },
  });
}
