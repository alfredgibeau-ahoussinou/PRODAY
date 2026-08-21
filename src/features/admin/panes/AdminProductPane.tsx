import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminLoading,
  AdminText,
} from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminSpace } from '../theme/adminDesignSystem';
import { CLUB_OFFERS } from '../../../content/clubOffers';
import {
  DEFAULT_CLUB_PRICING,
  normalizeClubPricing,
  type ClubPricingRates,
} from '../utils/adminPricing';
import { adminService } from '../../../services/admin.service';
import type { PlatformConfig, PlatformFeatureFlags } from '../../../models/PlatformConfig';
import { useAuth } from '../../../context/AuthContext';
import { confirmAdminAction } from '../utils/confirmAdminAction';
import { adminAuditService } from '../../../services/adminAudit.service';

const FLAG_LABELS: { key: keyof PlatformFeatureFlags; label: string }[] = [
  { key: 'community_reels', label: 'Community reels' },
  { key: 'mercato', label: 'Mercato' },
  { key: 'supporter', label: 'Supporter' },
  { key: 'shop', label: 'Boutique' },
  { key: 'stages', label: 'Stages' },
  { key: 'registration_open', label: 'Inscriptions ouvertes' },
  { key: 'club_video', label: 'Vidéo Club (admin)' },
  { key: 'coach_video', label: 'Vidéo Coach (admin)' },
];

export function AdminProductPane() {
  const t = ADMIN_TOKENS;
  const { firebaseUser, profile } = useAuth();
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [pricing, setPricing] = useState<ClubPricingRates>(DEFAULT_CLUB_PRICING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const cfg = await adminService.getPlatformConfig();
    setConfig(cfg);
    setPricing(normalizeClubPricing(cfg.club_pricing));
  };

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, []);

  if (loading || !config) return <AdminLoading label="Chargement produit…" />;

  const toggleFlag = (key: keyof PlatformFeatureFlags, value: boolean) => {
    if (key === 'sante_visio') return;
    confirmAdminAction(
      value ? `Activer ${key} ?` : `Désactiver ${key} ?`,
      'Écriture platform_config/main — visible live par les clients.',
      async () => {
        if (!firebaseUser?.uid) return;
        setSaving(true);
        try {
          await adminService.updatePlatformConfig(
            { feature_flags: { [key]: value } },
            firebaseUser.uid,
            profile?.email ?? undefined,
          );
          await adminAuditService.log({
            action: 'platform_config_updated',
            actor_uid: firebaseUser.uid,
            actor_email: profile?.email ?? undefined,
            target_type: 'platform_config',
            target_id: 'main',
            summary: `Feature ${key} → ${value}`,
          });
          await load();
        } catch (e) {
          Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
        } finally {
          setSaving(false);
        }
      },
    );
  };

  const savePricing = () =>
    confirmAdminAction(
      'Enregistrer les tarifs ?',
      'Les devis utiliseront ces valeurs par défaut.',
      async () => {
        if (!firebaseUser?.uid) return;
        setSaving(true);
        try {
          const next = normalizeClubPricing(pricing);
          await adminService.updatePlatformConfig(
            { club_pricing: next },
            firebaseUser.uid,
            profile?.email ?? undefined,
          );
          await adminAuditService.log({
            action: 'platform_config_updated',
            actor_uid: firebaseUser.uid,
            actor_email: profile?.email ?? undefined,
            target_type: 'platform_config',
            target_id: 'club_pricing',
            summary: `Tarifs ${next.min_per_member_eur}/${next.standard_per_member_eur}/${next.promo_per_member_eur} €`,
          });
          await load();
          Alert.alert('OK', 'Tarification enregistrée.');
        } catch (e) {
          Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
        } finally {
          setSaving(false);
        }
      },
    );

  const offers = Object.values(CLUB_OFFERS);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
      <AdminText variant="h1">Produit</AdminText>
      <AdminText variant="caption" color={t.muted}>
        Feature flags + tarification — source platform_config
      </AdminText>

      <AdminCard>
        <AdminText variant="h2">Tarification adhérent (€)</AdminText>
        <PriceField
          label="Minimum"
          value={String(pricing.min_per_member_eur)}
          onChange={(v) =>
            setPricing((p) => ({ ...p, min_per_member_eur: Number(v) || 0 }))
          }
        />
        <PriceField
          label="Standard"
          value={String(pricing.standard_per_member_eur)}
          onChange={(v) =>
            setPricing((p) => ({ ...p, standard_per_member_eur: Number(v) || 0 }))
          }
        />
        <PriceField
          label="Promo"
          value={String(pricing.promo_per_member_eur)}
          onChange={(v) =>
            setPricing((p) => ({ ...p, promo_per_member_eur: Number(v) || 0 }))
          }
        />
        <AdminButton
          label={saving ? '…' : 'Enregistrer tarifs'}
          disabled={saving}
          onPress={savePricing}
        />
      </AdminCard>

      <AdminCard>
        <AdminText variant="h2">Feature flags</AdminText>
        {FLAG_LABELS.map(({ key, label }) => (
          <View key={key} style={styles.flagRow}>
            <View style={{ flex: 1 }}>
              <AdminText variant="h3">{label}</AdminText>
              <AdminText variant="caption" color={t.faint}>
                {key}
              </AdminText>
            </View>
            <Switch
              value={!!config.feature_flags[key]}
              disabled={saving}
              onValueChange={(v) => toggleFlag(key, v)}
            />
          </View>
        ))}
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
    </ScrollView>
  );
}

function PriceField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const t = ADMIN_TOKENS;
  return (
    <View style={{ gap: 4 }}>
      <AdminText variant="label" color={t.faint}>
        {label}
      </AdminText>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        style={[
          styles.input,
          { color: t.foreground, borderColor: t.border, backgroundColor: t.surfaceRaised },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: adminSpace.lg, gap: adminSpace.lg, paddingBottom: 48 },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ADMIN_TOKENS.hairline,
  },
  row: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
});
