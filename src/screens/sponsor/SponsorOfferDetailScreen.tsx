import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Share } from 'react-native';
import type { SponsorOffer } from '../../models/SponsorOffer';
import { getOfferTypeLabel, SPONSOR_TARGET_CATEGORIES } from '../../content/sponsorContent';
import { sponsorsService } from '../../services/sponsors.service';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Icon } from '../../components/ui/Icon';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import { spacing, radius } from '../../theme/designTokens';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useSponsorDashboard } from '../../hooks/useSponsorDashboard';
import { useSubscriptionOptional } from '../../context/SubscriptionContext';
import {
  assertCanActivateSponsorOffer,
  assertCanPublishActiveSponsorOffer,
  isSubscriptionLimitError,
} from '../../utils/sponsorOfferActions';

interface SponsorOfferDetailScreenProps {
  offer: SponsorOffer;
  onBack: () => void;
  onUpdated: () => void;
}

export const SponsorOfferDetailScreen: React.FC<SponsorOfferDetailScreenProps> = ({
  offer,
  onBack,
  onUpdated,
}) => {
  const profile = useSessionProfile();
  const subscription = useSubscriptionOptional();
  const { activeOffers } = useSponsorDashboard(profile?.uid, profile?.display_name);

  const handleToggle = async () => {
    if (!profile) return;
    try {
      if (!offer.active) {
        await assertCanActivateSponsorOffer(profile, offer, activeOffers.length);
      }
      await sponsorsService.toggleOfferActive(offer.id, !offer.active);
      Alert.alert(
        offer.active ? 'Offre en pause' : 'Offre réactivée',
        offer.active
          ? 'Elle n’est plus visible des clubs.'
          : 'Elle est de nouveau visible sur ProDay.'
      );
      onUpdated();
      onBack();
    } catch (e) {
      if (isSubscriptionLimitError(e)) {
        subscription?.openUpgradeForFeature(e.feature);
      }
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Action impossible.');
    }
  };

  const handleDuplicate = async () => {
    if (!profile) return;
    try {
      await assertCanPublishActiveSponsorOffer(profile);
      await sponsorsService.duplicateOffer(offer);
      Alert.alert('Offre dupliquée', 'Une copie a été ajoutée à vos campagnes.');
      onUpdated();
      onBack();
    } catch (e) {
      if (isSubscriptionLimitError(e)) {
        subscription?.openUpgradeForFeature(e.feature);
      }
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Duplication impossible.');
    }
  };

  const handleShare = async () => {
    const message = `${offer.company_name}. ${offer.value}\n${offer.description}\n${offer.city} · ProDay Sponsors`;
    await Share.share({ message });
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Détail offre" onBack={onBack} centered sponsorDark />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.company}>{offer.company_name}</Text>
          <View style={styles.pillRow}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>{getOfferTypeLabel(offer.offer_type)}</Text>
            </View>
            <View style={[styles.pill, !offer.active && styles.pillPaused]}>
              <Text style={styles.pillText}>{offer.active ? 'Active' : 'En pause'}</Text>
            </View>
          </View>
          <Text style={styles.value}>{offer.value}</Text>
          <Text style={styles.desc}>{offer.description}</Text>
          <Text style={styles.location}>
            {offer.city}
            {offer.target_categories.length > 0
              ? ` · ${offer.target_categories.join(', ')}`
              : ''}
          </Text>
        </View>

        <Text style={styles.section}>Performance</Text>
        <View style={styles.metricsRow}>
          <MetricBox label="Vues" value={String(offer.views_count ?? 0)} />
          <MetricBox label="Clics" value={String(offer.clicks_count ?? 0)} />
          <MetricBox label="Contacts" value={String(offer.leads_count ?? 0)} highlight />
        </View>

        <Text style={styles.section}>Cibles possibles</Text>
        <View style={styles.chips}>
          {(offer.target_categories.length > 0
            ? offer.target_categories
            : [...SPONSOR_TARGET_CATEGORIES]
          ).map((cat) => (
            <View key={cat} style={styles.chip}>
              <Text style={styles.chipText}>{cat}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <ActionBtn icon="share" label="Partager" onPress={() => void handleShare()} />
          <ActionBtn icon="document" label="Dupliquer" onPress={() => void handleDuplicate()} />
          <ActionBtn
            icon={offer.active ? 'close' : 'add'}
            label={offer.active ? 'Pause' : 'Réactiver'}
            onPress={() => void handleToggle()}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const MetricBox: React.FC<{ label: string; value: string; highlight?: boolean }> = ({
  label,
  value,
  highlight,
}) => (
  <View style={[styles.metricBox, highlight && styles.metricBoxHighlight]}>
    <Text style={[styles.metricValue, highlight && { color: SPONSOR_THEME.success }]}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const ActionBtn: React.FC<{
  icon: 'share' | 'document' | 'close' | 'add';
  label: string;
  onPress: () => void;
}> = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
    <Icon name={icon} size={18} color={SPONSOR_THEME.primary} />
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SPONSOR_THEME.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  hero: {
    backgroundColor: SPONSOR_THEME.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
    marginBottom: spacing.lg,
  },
  company: { fontSize: 22, fontWeight: '900', color: SPONSOR_THEME.text },
  pillRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  pill: {
    backgroundColor: SPONSOR_THEME.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  pillPaused: { backgroundColor: SPONSOR_THEME.surfaceMuted },
  pillText: { fontSize: 10, fontWeight: '800', color: SPONSOR_THEME.heroSubtext },
  value: { fontSize: 16, fontWeight: '800', color: SPONSOR_THEME.primary, marginTop: spacing.md },
  desc: { fontSize: 14, color: SPONSOR_THEME.textSecondary, marginTop: spacing.sm, lineHeight: 20 },
  location: { fontSize: 12, color: SPONSOR_THEME.textMuted, marginTop: spacing.sm },
  section: {
    fontSize: 11,
    fontWeight: '800',
    color: SPONSOR_THEME.sectionLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  metricsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  metricBox: {
    flex: 1,
    backgroundColor: SPONSOR_THEME.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
  },
  metricBoxHighlight: { borderColor: SPONSOR_THEME.success },
  metricValue: { fontSize: 20, fontWeight: '900', color: SPONSOR_THEME.text },
  metricLabel: { fontSize: 9, fontWeight: '700', color: SPONSOR_THEME.textMuted, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    backgroundColor: SPONSOR_THEME.surfaceMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  chipText: { fontSize: 11, fontWeight: '700', color: SPONSOR_THEME.textSecondary },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.md },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionLabel: { fontSize: 11, fontWeight: '700', color: SPONSOR_THEME.textSecondary },
});
