import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AdminButton } from '../../../components/admin/AdminButton';
import { AdminAuditLogPanel } from '../../../components/admin/AdminAuditLogPanel';
import { AdminIntelCard } from '../../../components/admin/AdminIntelCard';
import { AdminFocPageHeader, AdminFocTabs } from '../../../components/admin/foc/AdminFocTabs';
import { ADMIN_SECURITE_TABS } from '../../../navigation/adminNavConfig';
import { useAuth } from '../../../context/AuthContext';
import { useAdminData } from '../../../context/AdminDataContext';
import { adminChrome, adminType } from '../../../theme/adminTheme';
import { spacing } from '../../../theme/designTokens';
import type { AdminNavTarget } from '../../../navigation/adminNavConfig';

type TabId = (typeof ADMIN_SECURITE_TABS)[number]['id'];

type Props = {
  onPreviewUserApp?: () => void;
  initialTab?: string;
  onNavigateTarget?: (t: AdminNavTarget) => void;
};

export function AdminFocSecuriteScreen({
  onPreviewUserApp,
  initialTab,
  onNavigateTarget,
}: Props) {
  const { profile, firebaseUser, signOut, refreshAdminClaim } = useAuth();
  const { reelReports, workQueue } = useAdminData();
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<TabId>(
    ADMIN_SECURITE_TABS.some((t) => t.id === initialTab) ? (initialTab as TabId) : 'audit',
  );
  const styles = useMemo(() => createStyles(), []);
  const securityReports = workQueue.filter((w) => w.kind === 'report').length;

  const refreshToken = async () => {
    setBusy(true);
    try {
      await refreshAdminClaim();
      Alert.alert('Session', 'Jeton admin rafraîchi.');
    } catch {
      Alert.alert('Erreur', 'Impossible de rafraîchir le jeton.');
    } finally {
      setBusy(false);
    }
  };

  const confirmSignOut = () => {
    Alert.alert('Déconnexion', 'Quitter la console admin ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  return (
    <View style={styles.root}>
      <AdminFocPageHeader
        title="Sécurité"
        subtitle="Audit réel, session courante — pas d’incidents inventés."
      />
      <AdminFocTabs
        tabs={[...ADMIN_SECURITE_TABS]}
        value={tab}
        onChange={(id) => setTab(id as TabId)}
      />

      {tab === 'audit' ? (
        <View style={styles.panel}>
          <AdminAuditLogPanel />
        </View>
      ) : tab === 'signalements' ? (
        <ScrollView contentContainerStyle={styles.body}>
          <AdminIntelCard
            title={`${reelReports.length} signalement${reelReports.length === 1 ? '' : 's'} publication`}
            body={`${securityReports} item${securityReports === 1 ? '' : 's'} encore dans la file (kind report).`}
            cta={{
              label: 'Ouvrir Contenu → Signalements',
              onPress: () =>
                onNavigateTarget?.({ section: 'contenus', screenTab: 'signalements' }),
            }}
          />
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.card}>
            <Text style={styles.kicker}>Session</Text>
            <Text style={styles.title}>{profile?.display_name || 'Admin'}</Text>
            <Text style={styles.meta}>{firebaseUser?.email ?? profile?.email ?? '—'}</Text>
            <Text style={styles.meta}>UID · {profile?.uid ?? '—'}</Text>
            <AdminButton
              label="Rafraîchir le jeton admin"
              variant="secondary"
              size="sm"
              loading={busy}
              disabled={busy}
              onPress={() => void refreshToken()}
            />
            {onPreviewUserApp ? (
              <AdminButton
                label="Prévisualiser l’app utilisateur"
                variant="ghost"
                size="sm"
                onPress={onPreviewUserApp}
              />
            ) : null}
            <AdminButton
              label="Se déconnecter"
              variant="danger"
              size="sm"
              onPress={confirmSignOut}
            />
          </View>
          <AdminIntelCard
            title="Connexions inhabituelles"
            body="Non branché — ProDay n’expose pas encore de journal de sessions suspectes. Aucun incident fictif n’est affiché."
            tone="warn"
          />
          <View style={styles.card}>
            <Text style={styles.kicker}>Actions irréversibles</Text>
            <Text style={styles.bodyText}>
              Toute suppression et tout passage en gratuit immédiat demandent une confirmation.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: adminChrome.band },
    panel: { flex: 1, minHeight: 0 },
    body: { padding: spacing.md, gap: spacing.md, paddingBottom: 80 },
    card: {
      backgroundColor: adminChrome.shell,
      borderRadius: adminChrome.radius,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
      padding: spacing.md,
      gap: spacing.sm,
    },
    kicker: {
      fontFamily: adminType.bodyExtra,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: adminChrome.accent,
    },
    title: {
      fontFamily: adminType.bodyExtra,
      fontSize: 18,
      fontWeight: '800',
      color: adminChrome.text,
    },
    meta: {
      fontFamily: adminType.body,
      fontSize: 13,
      color: adminChrome.textMuted,
    },
    bodyText: {
      fontFamily: adminType.body,
      fontSize: 13,
      lineHeight: 19,
      color: adminChrome.textSecondary,
    },
  });
}
