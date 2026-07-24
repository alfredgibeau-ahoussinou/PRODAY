import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Switch, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/admin.service';
import type { PlatformConfig, PlatformFeatureFlags } from '../../models/PlatformConfig';
import {
  PLATFORM_FEATURE_FLAG_META,
  type PlatformFeatureFlagKey,
} from '../../content/platformFeatureFlags';
import { AdminSectionHeader } from './AdminSectionHeader';
import { AdminSettingsCard } from './AdminSettingsCard';
import { useAdminStyles } from './adminStyles';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

const FLAG_ROWS: PlatformFeatureFlagKey[] = [
  'registration_open',
  'sante_visio',
  'community_reels',
  'mercato',
  'stages',
  'supporter',
  'shop',
];

export const AdminPlatformConfigPanel: React.FC = () => {
  const { profile, firebaseUser } = useAuth();
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await adminService.getPlatformConfig();
      setConfig(next);
      setMaintenanceMessage(next.maintenance_message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (patch: Parameters<typeof adminService.updatePlatformConfig>[0]) => {
    if (!profile?.uid) return;
    setSaving(true);
    try {
      await adminService.updatePlatformConfig(
        patch,
        profile.uid,
        firebaseUser?.email ?? profile.email,
      );
      await load();
      Alert.alert('Configuration', 'Paramètres enregistrés.');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  const toggleMaintenance = async (value: boolean) => {
    if (!config) return;
    // Optimistic — l’écoute live des autres clients se déclenche après Firestore.
    setConfig({ ...config, maintenance_mode: value });
    await save({
      maintenance_mode: value,
      maintenance_message:
        maintenanceMessage.trim() ||
        'ProDay est momentanément indisponible pour maintenance.',
    });
  };

  const toggleFlag = async (key: keyof PlatformFeatureFlags, value: boolean) => {
    if (!config) return;
    await save({ feature_flags: { ...config.feature_flags, [key]: value } });
  };

  if (loading || !config) {
    return <ActivityIndicator color={c.brand} style={{ marginVertical: spacing.lg }} />;
  }

  return (
    <View>
      <AdminSectionHeader title="Configuration plateforme" />

      <AdminSettingsCard
        icon="shield"
        title="Mode maintenance"
        actionLabel={saving ? 'Enregistrement…' : 'Enregistrer le message'}
        onAction={() => void save({ maintenance_message: maintenanceMessage.trim() })}
        actionDisabled={saving}
      >
        {config.maintenance_mode ? (
          <View style={styles.liveBanner}>
            <Text style={styles.liveBannerText}>
              Maintenance ACTIVE — les utilisateurs voient l’écran de coupure en direct.
            </Text>
          </View>
        ) : null}
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Maintenance active</Text>
          <Switch
            value={config.maintenance_mode}
            onValueChange={(v) => void toggleMaintenance(v)}
            trackColor={{ false: c.border, true: c.brandSoft }}
            thumbColor={config.maintenance_mode ? c.brand : c.textMuted}
            disabled={saving}
          />
        </View>
        <Text style={styles.hint}>
          Quand activé, tous les utilisateurs (hors admins) voient immédiatement un écran
          « Maintenance en cours » — écoute live de{' '}
          <Text style={styles.mono}>platform_config/main</Text>.
        </Text>
        <TextInput
          style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surfaceMuted }]}
          placeholder="Message affiché aux utilisateurs"
          placeholderTextColor={c.textMuted}
          value={maintenanceMessage}
          onChangeText={setMaintenanceMessage}
          multiline
        />
      </AdminSettingsCard>

      <AdminSettingsCard icon="settings" title="Feature flags">
        <Text style={[styles.hint, { marginBottom: spacing.sm }]}>
          Les changements s’appliquent en direct via{' '}
          <Text style={styles.mono}>platform_config/main</Text> (écoute live).
        </Text>
        {FLAG_ROWS.map((key) => {
          const meta = PLATFORM_FEATURE_FLAG_META[key];
          return (
            <View key={key} style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>{meta.label}</Text>
                <Text style={styles.hint}>{meta.adminHint}</Text>
              </View>
              <Switch
                value={config.feature_flags[key]}
                onValueChange={(v) => void toggleFlag(key, v)}
                trackColor={{ false: c.border, true: c.brandSoft }}
                thumbColor={config.feature_flags[key] ? c.brand : c.textMuted}
                disabled={saving}
              />
            </View>
          );
        })}
      </AdminSettingsCard>

      {config.updated_at ? (
        <Text style={styles.footer}>
          Dernière mise à jour · {config.updated_at.toLocaleString('fr-FR')}
        </Text>
      ) : null}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    switchLabel: { fontSize: 14, fontWeight: '700', color: c.text },
    hint: { fontSize: 11, color: c.textMuted, lineHeight: 16, marginTop: 2 },
    mono: { fontFamily: 'monospace', fontSize: 11, color: c.textSecondary },
    liveBanner: {
      backgroundColor: c.brandSoft,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      marginBottom: spacing.sm,
    },
    liveBannerText: {
      fontSize: 12,
      fontWeight: '700',
      color: c.brand,
      lineHeight: 17,
    },
    input: {
      minHeight: 72,
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.sm,
      marginTop: spacing.sm,
      textAlignVertical: 'top',
      fontSize: 13,
      lineHeight: 18,
    },
    footer: { fontSize: 11, color: c.textMuted, marginBottom: spacing.md },
  });
}
