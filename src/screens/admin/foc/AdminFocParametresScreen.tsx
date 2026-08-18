import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminPlatformConfigPanel } from '../../../components/admin/AdminPlatformConfigPanel';
import { AdminBetaProgramPanel } from '../../../components/admin/AdminBetaProgramPanel';
import { AdminAuditLogPanel } from '../../../components/admin/AdminAuditLogPanel';
import { AdminOpsDataPanel } from '../../../components/admin/AdminOpsDataPanel';
import { AdminFocPersonnaliserScreen } from './AdminFocPersonnaliserScreen';
import { ADMIN_FOC_SCREEN_TABS } from '../../../navigation/adminFocConfig';
import { AdminFocTabs, AdminFocPageHeader } from '../../../components/admin/foc/AdminFocTabs';
import { adminChrome } from '../../../theme/adminTheme';
import { spacing } from '../../../theme/designTokens';
import { useAuth } from '../../../context/AuthContext';
import { useAdminData } from '../../../context/AdminDataContext';
import { adminService } from '../../../services/admin.service';
import { adminAuditService } from '../../../services/adminAudit.service';
import {
  type AdminFocPreferences,
  DEFAULT_ADMIN_FOC_PREFS,
} from '../../../services/adminPreferences.service';

const TABS = ADMIN_FOC_SCREEN_TABS.parametres;
type TabId = (typeof TABS)[number]['id'];

type Props = {
  prefs?: AdminFocPreferences;
  onChangePrefs?: (p: AdminFocPreferences) => void;
  onSavePrefs?: () => void;
  onPreviewUserApp?: () => void;
};

export function AdminFocParametresScreen({
  prefs: externalPrefs,
  onChangePrefs,
  onSavePrefs,
  onPreviewUserApp,
}: Props) {
  const insets = useSafeAreaInsets();
  const { profile, signOut, refreshAdminClaim, firebaseUser } = useAuth();
  const { refresh, stats } = useAdminData();
  const [tab, setTab] = useState<TabId>('personnaliser');
  const [localPrefs, setLocalPrefs] = useState<AdminFocPreferences>(externalPrefs ?? { ...DEFAULT_ADMIN_FOC_PREFS });
  const [busy, setBusy] = useState(false);

  const prefs = externalPrefs ?? localPrefs;
  const handleChange = onChangePrefs ?? setLocalPrefs;

  const handleSave = onSavePrefs ?? (() => {
    Alert.alert('Préférences', 'Préférences enregistrées localement.');
  });

  const forceSnapshot = async () => {
    setBusy(true);
    try {
      const s = await adminService.getPlatformStats();
      await adminService.recordDailyPlatformSnapshot(s);
      await adminAuditService.log({
        action: 'snapshot_recorded',
        actor_uid: profile?.uid ?? '',
        actor_email: firebaseUser?.email ?? profile?.email,
        target_type: 'platform_stats_daily',
        target_id: new Date().toISOString().slice(0, 10),
        summary: 'Instantané plateforme enregistré manuellement',
      });
      await refresh();
      Alert.alert('Instantané', 'Instantané du jour enregistré.');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : "Échec de l'instantané.");
    } finally {
      setBusy(false);
    }
  };

  const handleRefreshToken = async () => {
    setBusy(true);
    try {
      await refreshAdminClaim();
      Alert.alert('Session', 'Token admin rafraîchi.');
    } catch {
      Alert.alert('Erreur', 'Impossible de rafraîchir le token.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={s.root}>
      <AdminFocPageHeader title="Paramètres" />
      <AdminFocTabs tabs={TABS} value={tab} onChange={(id) => setTab(id as TabId)} />

      {tab === 'personnaliser' ? (
        <AdminFocPersonnaliserScreen
          prefs={prefs}
          onChange={handleChange}
          onSave={handleSave}
        />
      ) : tab === 'systeme' ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
        >
          <AdminPlatformConfigPanel />

          <View style={s.section}>
            <Text style={s.sectionTitle}>Session & actions</Text>
            <View style={s.card}>
              <SessionRow
                label="Rafraîchir le token admin"
                sub="Recharge les droits admin sans déconnexion"
                onPress={() => void handleRefreshToken()}
                disabled={busy}
              />
              <View style={s.divider} />
              <SessionRow
                label="Forcer un instantané plateforme"
                sub={`Enregistre les stats actuelles · ${stats?.users ?? '—'} utilisateurs`}
                onPress={() => void forceSnapshot()}
                disabled={busy}
              />
              {onPreviewUserApp ? (
                <>
                  <View style={s.divider} />
                  <SessionRow
                    label="Aperçu app utilisateur"
                    sub="Voir l'application comme un membre standard"
                    onPress={onPreviewUserApp}
                  />
                </>
              ) : null}
              <View style={s.divider} />
              <SessionRow
                label="Se déconnecter"
                sub={profile?.email ?? ''}
                tone="danger"
                onPress={() => {
                  Alert.alert('Déconnexion', 'Se déconnecter de ProDay ?', [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Déconnecter', style: 'destructive', onPress: () => void signOut() },
                  ]);
                }}
              />
            </View>
          </View>
        </ScrollView>
      ) : tab === 'beta' ? (
        <AdminBetaProgramPanel />
      ) : tab === 'audit' ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
        >
          <AdminAuditLogPanel />
          <View style={s.section}>
            <Text style={s.sectionTitle}>Données ops</Text>
            <AdminOpsDataPanel />
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

/* ─── SessionRow helper ─────────────────────────────────────────────── */

function SessionRow({
  label,
  sub,
  onPress,
  tone,
  disabled,
}: {
  label: string;
  sub?: string;
  onPress: () => void;
  tone?: 'danger';
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [s.sessionRow, pressed && s.sessionRowPressed, disabled && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={s.sessionMain}>
        <Text style={[s.sessionLabel, tone === 'danger' && { color: adminChrome.danger }]}>{label}</Text>
        {sub ? <Text style={s.sessionSub} numberOfLines={1}>{sub}</Text> : null}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminChrome.band },
  content: { gap: spacing.md, padding: spacing.md },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: adminChrome.textMuted,
  },
  card: {
    backgroundColor: adminChrome.shell,
    borderRadius: adminChrome.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminChrome.shellBorder,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: adminChrome.shellBorder,
    marginLeft: spacing.md,
  },
  sessionRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    backgroundColor: adminChrome.shell,
  },
  sessionRowPressed: { backgroundColor: adminChrome.rowHover },
  sessionMain: { gap: 2 },
  sessionLabel: { fontSize: 14, fontWeight: '600', color: adminChrome.text },
  sessionSub: { fontSize: 12, color: adminChrome.textMuted },
});
