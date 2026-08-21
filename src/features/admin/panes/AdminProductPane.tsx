import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  AdminBadge,
  AdminCard,
  AdminText,
} from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminSpace } from '../theme/adminDesignSystem';
import { CLUB_OFFERS } from '../../../content/clubOffers';
import {
  DEFAULT_PRICE_PER_MEMBER_EUR,
  PROMO_PRICE_PER_MEMBER_EUR,
  STANDARD_PRICE_PER_MEMBER_EUR,
} from '../utils/adminPricing';

const FLAGS = [
  'AI_COACH',
  'AI_PLAYER',
  'VIDEO',
  'VEO',
  'TOURNAMENTS',
  'RECRUITMENT',
  'MARKETPLACE',
  'SPONSORSHIP',
  'SUPPORTER',
] as const;

export function AdminProductPane() {
  const t = ADMIN_TOKENS;
  const offers = Object.values(CLUB_OFFERS);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
      <AdminText variant="h1">Produit</AdminText>
      <AdminText variant="caption" color={t.muted}>
        Catalogue offres & feature flags (lecture catalogue réel)
      </AdminText>

      <AdminCard>
        <AdminText variant="h2">Tarification adhérent</AdminText>
        <AdminText variant="body" color={t.muted}>
          Min {DEFAULT_PRICE_PER_MEMBER_EUR} € · Standard {STANDARD_PRICE_PER_MEMBER_EUR} € · Promo{' '}
          {PROMO_PRICE_PER_MEMBER_EUR} € — source `adminPricing`
        </AdminText>
      </AdminCard>

      <AdminCard>
        <AdminText variant="h2">Catalogue club</AdminText>
        {offers.map((o) => (
          <View key={o.id} style={[styles.row, { borderColor: t.hairline }]}>
            <View style={{ flex: 1 }}>
              <AdminText variant="h3">{o.label}</AdminText>
              <AdminText variant="caption" color={t.muted}>
                {o.priceHint}
              </AdminText>
            </View>
            <AdminBadge label={o.billing} tone="info" />
          </View>
        ))}
      </AdminCard>

      <AdminCard>
        <AdminText variant="h2">Feature flags (registre)</AdminText>
        <View style={styles.flags}>
          {FLAGS.map((f) => (
            <AdminBadge key={f} label={f} tone="accent" />
          ))}
        </View>
        <AdminText variant="caption" color={t.faint}>
          Activation club-par-club via platform config / abonnements existants.
        </AdminText>
      </AdminCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: adminSpace.lg, gap: adminSpace.lg, paddingBottom: 48 },
  row: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  flags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
});
