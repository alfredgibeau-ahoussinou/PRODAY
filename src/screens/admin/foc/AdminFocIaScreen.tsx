import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { AdminFocPageHeader, AdminFocTabs } from '../../../components/admin/foc/AdminFocTabs';
import { AdminIntelCard, AdminIntelBadge } from '../../../components/admin/AdminIntelCard';
import { AdminCopilotConversation } from '../../../components/admin/AdminAiCopilot';
import { AdminButton } from '../../../components/admin/AdminButton';
import { ADMIN_IA_TABS } from '../../../navigation/adminNavConfig';
import type { AdminNavTarget } from '../../../navigation/adminNavConfig';
import { useAdminData } from '../../../context/AdminDataContext';
import { adminChrome, adminType } from '../../../theme/adminTheme';
import { spacing } from '../../../theme/designTokens';
import {
  buildAdminIntelAlerts,
  evaluateAdminAutomations,
} from '../../../utils/adminIntel';
import type { AdminCopilotSnapshot } from '../../../utils/adminCopilot';
import type { AdminFocPreferences } from '../../../services/adminPreferences.service';
import { DEFAULT_ADMIN_AUTOMATION_TOGGLES } from '../../../utils/adminIntel';

type TabId = (typeof ADMIN_IA_TABS)[number]['id'];

type Props = {
  initialTab?: string;
  prefs?: AdminFocPreferences;
  onChangePrefs?: (p: AdminFocPreferences) => void;
  onNavigateTarget?: (t: AdminNavTarget) => void;
};

function toSnapshot(data: ReturnType<typeof useAdminData>): AdminCopilotSnapshot {
  return {
    users: data.users.map((u) => ({
      uid: u.uid,
      display_name: u.display_name,
      email: u.email,
      role: u.role,
      subscription_tier: u.subscription_tier,
      last_active_at: u.last_active_at,
      verification_status: u.verification_status,
      club_id: u.profile?.club_id,
    })),
    clubs: data.clubs.map((c) => ({
      id: c.id,
      name: c.name,
      created_at: c.created_at,
      verified: c.verified,
    })),
    events: data.events.map((e) => ({ club_id: e.club_id, starts_at: e.starts_at })),
    payments: data.payments.map((p) => ({
      id: p.id,
      status: p.status,
      amount_eur: p.amount_eur,
      member_name: p.member_name,
      member_uid: p.member_uid,
      label: p.label,
    })),
    workQueue: data.workQueue,
    reelReports: data.reelReports.map((r) => ({ id: r.id })),
    cameras: data.cameras,
    dailySnapshots: data.dailySnapshots,
  };
}

export function AdminFocIaScreen({
  initialTab,
  prefs,
  onChangePrefs,
  onNavigateTarget,
}: Props) {
  const data = useAdminData();
  const [tab, setTab] = useState<TabId>(
    ADMIN_IA_TABS.some((t) => t.id === initialTab) ? (initialTab as TabId) : 'alertes',
  );
  useEffect(() => {
    if (initialTab && ADMIN_IA_TABS.some((t) => t.id === initialTab)) {
      setTab(initialTab as TabId);
    }
  }, [initialTab]);
  const styles = useMemo(() => createStyles(), []);
  const snapshot = useMemo(() => toSnapshot(data), [data]);
  const alerts = useMemo(() => buildAdminIntelAlerts(snapshot), [snapshot]);
  const toggles = prefs?.automations ?? DEFAULT_ADMIN_AUTOMATION_TOGGLES;
  const rules = useMemo(
    () => evaluateAdminAutomations(snapshot, toggles),
    [snapshot, toggles],
  );

  const go = (t: AdminNavTarget) => {
    onNavigateTarget?.(t);
  };

  return (
    <View style={styles.root}>
      <AdminFocPageHeader
        title="IA ProDay"
        subtitle="Alertes dérivées des faits · copilote déterministe · règles locales."
      />
      <AdminFocTabs tabs={[...ADMIN_IA_TABS]} value={tab} onChange={(id) => setTab(id as TabId)} />

      {tab === 'chat' ? (
        <AdminCopilotConversation embedded onNavigate={(t) => go(t)} />
      ) : tab === 'automations' ? (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {rules.map((rule) => (
            <AdminIntelCard
              key={rule.id}
              title={rule.label}
              body={rule.description}
              meta={
                rule.evaluable
                  ? `${rule.matchCount} correspondance${rule.matchCount === 1 ? '' : 's'}`
                  : undefined
              }
            >
              {!rule.evaluable ? (
                <AdminIntelBadge label={rule.missingLabel ?? 'Donnée manquante'} tone="warn" />
              ) : null}
              <View style={styles.row}>
                <Text style={styles.toggleLabel}>{toggles[rule.id] ? 'Activée' : 'Désactivée'}</Text>
                <Switch
                  value={toggles[rule.id]}
                  onValueChange={(v) => {
                    if (!onChangePrefs || !prefs) {
                      Alert.alert('Préférences', 'Impossible d’enregistrer le toggle.');
                      return;
                    }
                    onChangePrefs({
                      ...prefs,
                      automations: { ...toggles, [rule.id]: v },
                    });
                  }}
                  trackColor={{ false: adminChrome.shellMid, true: adminChrome.accentMuted }}
                  thumbColor={toggles[rule.id] ? adminChrome.accent : adminChrome.textMuted}
                />
              </View>
            </AdminIntelCard>
          ))}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {alerts.length === 0 ? (
            <AdminIntelCard
              title="Aucune alerte dérivée"
              body="La file est vide et aucun paiement / club inactif datable n’est sorti."
            />
          ) : (
            alerts.map((a) => (
              <AdminIntelCard
                key={a.id}
                kicker={a.source}
                title={a.title}
                body={a.problem}
                meta={[a.impact, a.reco].filter(Boolean).join(' · ')}
                tone={a.level === 'critical' || a.level === 'high' ? 'danger' : 'default'}
                cta={{
                  label: 'Analyser',
                  onPress: () => go(a.nav),
                }}
              >
                <AdminIntelBadge
                  label={a.level}
                  tone={a.level === 'critical' || a.level === 'high' ? 'danger' : 'warn'}
                />
              </AdminIntelCard>
            ))
          )}
          <AdminButton
            label="Ouvrir le chat ProDay AI"
            variant="primary"
            onPress={() => setTab('chat')}
          />
        </ScrollView>
      )}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: adminChrome.band },
    body: { padding: spacing.md, paddingBottom: 100, gap: spacing.md },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    toggleLabel: {
      color: adminChrome.textSecondary,
      fontFamily: adminType.bodySemi,
      fontSize: 13,
    },
  });
}
