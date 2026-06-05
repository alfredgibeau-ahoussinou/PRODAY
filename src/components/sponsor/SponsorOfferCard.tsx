import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { SponsorOffer } from '../../models/SponsorOffer';
import { getOfferTypeLabel } from '../../content/sponsorContent';
import { Icon } from '../ui/Icon';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import { spacing, radius } from '../../theme/designTokens';

interface SponsorOfferCardProps {
  offer: SponsorOffer;
  owned?: boolean;
  onPress?: () => void;
  onToggleActive?: () => void;
  onDuplicate?: () => void;
}

export const SponsorOfferCard: React.FC<SponsorOfferCardProps> = ({
  offer,
  owned,
  onPress,
  onToggleActive,
  onDuplicate,
}) => (
  <View style={[styles.card, !offer.active && styles.cardPaused]}>
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.85 : 1} disabled={!onPress}>
    <View style={styles.head}>
      <Text style={styles.name}>{offer.company_name}</Text>
      <View style={[styles.typePill, !offer.active && styles.typePillPaused]}>
        <Text style={styles.typeText}>
          {!offer.active ? 'En pause' : getOfferTypeLabel(offer.offer_type)}
        </Text>
      </View>
    </View>
    <Text style={styles.desc} numberOfLines={2}>
      {offer.description}
    </Text>
    <Text style={styles.meta}>
      {offer.value} · {offer.city}
    </Text>
    {offer.target_categories.length > 0 ? (
      <Text style={styles.cats}>{offer.target_categories.join(' · ')}</Text>
    ) : null}

    {(offer.views_count != null || offer.leads_count != null) && (
      <View style={styles.metrics}>
        {offer.views_count != null ? (
          <Text style={styles.metric}>{offer.views_count} vues</Text>
        ) : null}
        {offer.clicks_count != null ? (
          <Text style={styles.metric}>{offer.clicks_count} clics</Text>
        ) : null}
        {offer.leads_count != null ? (
          <Text style={[styles.metric, styles.metricHighlight]}>{offer.leads_count} contacts</Text>
        ) : null}
      </View>
    )}
    </TouchableOpacity>

    {owned && (onToggleActive || onDuplicate) ? (
      <View style={styles.actions}>
        {onToggleActive ? (
          <TouchableOpacity style={styles.actionBtn} onPress={onToggleActive}>
            <Icon name={offer.active ? 'close' : 'add'} size={14} color={SPONSOR_THEME.heroSubtext} />
            <Text style={styles.actionText}>{offer.active ? 'Mettre en pause' : 'Réactiver'}</Text>
          </TouchableOpacity>
        ) : null}
        {onDuplicate ? (
          <TouchableOpacity style={styles.actionBtn} onPress={onDuplicate}>
            <Icon name="document" size={14} color={SPONSOR_THEME.heroSubtext} />
            <Text style={styles.actionText}>Dupliquer</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: SPONSOR_THEME.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
    marginBottom: spacing.sm,
  },
  cardPaused: { opacity: 0.72 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '800', color: SPONSOR_THEME.text, flex: 1 },
  typePill: {
    backgroundColor: SPONSOR_THEME.primarySoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: spacing.sm,
  },
  typePillPaused: { backgroundColor: SPONSOR_THEME.surfaceMuted },
  typeText: {
    fontSize: 9,
    fontWeight: '800',
    color: SPONSOR_THEME.heroSubtext,
    textTransform: 'uppercase',
  },
  desc: { fontSize: 13, color: SPONSOR_THEME.textSecondary, marginTop: spacing.xs, lineHeight: 18 },
  meta: { fontSize: 12, fontWeight: '700', color: SPONSOR_THEME.heroSubtext, marginTop: spacing.sm },
  cats: { fontSize: 10, color: SPONSOR_THEME.textMuted, marginTop: 4 },
  metrics: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  metric: { fontSize: 10, fontWeight: '700', color: SPONSOR_THEME.textMuted },
  metricHighlight: { color: SPONSOR_THEME.success },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 11, fontWeight: '700', color: SPONSOR_THEME.heroSubtext },
});
