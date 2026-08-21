import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useAdminData } from '../data/AdminDataContext';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminLoading,
  AdminText,
} from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminSpace } from '../theme/adminDesignSystem';
import type { AdminNavSectionId } from '../navigation/adminNavConfig';
import { confirmAdminAction } from '../utils/confirmAdminAction';
import { adminService } from '../../../services/admin.service';
import { useAuth } from '../../../context/AuthContext';
import { canAdminUi } from '../utils/adminRbac';

type Props = { onNavigate: (section: AdminNavSectionId) => void };

const AGENTS = [
  { id: 'admin', label: 'Admin AI', desc: 'Pilotage transversal' },
  { id: 'finance', label: 'Finance AI', desc: 'MRR, impayés, devis' },
  { id: 'sales', label: 'Sales AI', desc: 'CRM & prospects clubs' },
  { id: 'support', label: 'Support AI', desc: 'Tickets & signalements' },
  { id: 'security', label: 'Security AI', desc: 'Audit & anomalies' },
] as const;

type PreparedAction = {
  id: string;
  title: string;
  detail: string;
  section?: AdminNavSectionId;
  run?: () => Promise<void>;
  destructive?: boolean;
};

export function AdminAiPane({ onNavigate }: Props) {
  const data = useAdminData();
  const { firebaseUser, profile } = useAuth();
  const t = ADMIN_TOKENS;
  const [q, setQ] = useState('');
  const [agent, setAgent] = useState<(typeof AGENTS)[number]['id']>('admin');
  const [answer, setAnswer] = useState<string | null>(null);
  const [prepared, setPrepared] = useState<PreparedAction[]>([]);
  const canEditUsers = canAdminUi(profile?.email, 'edit_users');

  const insights = useMemo(() => {
    const pendingQuotes = data.clubQuoteRequests.filter((x) => x.status === 'pending').length;
    const lines: {
      problem: string;
      impact: string;
      action: string;
      section: AdminNavSectionId;
    }[] = [];
    if (pendingQuotes > 0) {
      lines.push({
        problem: `${pendingQuotes} devis clubs en attente`,
        impact: 'Pipeline commercial bloqué',
        action: 'Ouvrir Commercial',
        section: 'commercial',
      });
    }
    if ((data.stats?.pendingVerifications ?? 0) > 0) {
      lines.push({
        problem: `${data.stats?.pendingVerifications} comptes à vérifier`,
        impact: 'Onboarding freiné',
        action: 'Ouvrir Utilisateurs',
        section: 'utilisateurs',
      });
    }
    if (data.payments.filter((p) => p.status === 'pending').length > 3) {
      lines.push({
        problem: 'Pic de paiements en attente',
        impact: 'Trésorerie / confiance clubs',
        action: 'Ouvrir Finances',
        section: 'finances',
      });
    }
    if (data.clubs.filter((c) => c.suspended).length > 0) {
      lines.push({
        problem: `${data.clubs.filter((c) => c.suspended).length} clubs suspendus`,
        impact: 'Revue support / commercial',
        action: 'Ouvrir Clubs',
        section: 'clubs',
      });
    }
    if (lines.length === 0) {
      lines.push({
        problem: 'Aucune anomalie majeure détectée',
        impact: 'Plateforme stable',
        action: 'Voir Plateforme',
        section: 'plateforme',
      });
    }
    return lines;
  }, [data]);

  const buildPrepared = (query: string): PreparedAction[] => {
    const actions: PreparedAction[] = [];
    const pendingQuotes = data.clubQuoteRequests.filter((x) => x.status === 'pending');
    const pendingUsers = data.users.filter((u) => u.verification_status === 'PENDING').slice(0, 3);
    const unpaid = data.payments.filter((p) => p.status === 'pending').slice(0, 3);

    if (!query || query.includes('devis') || query.includes('quote') || agent === 'sales') {
      if (pendingQuotes[0]) {
        actions.push({
          id: 'open-quote',
          title: 'Ouvrir le premier devis pending',
          detail: pendingQuotes[0].club_name,
          section: 'commercial',
        });
      }
    }
    if (!query || query.includes('verif') || query.includes('user') || agent === 'support') {
      for (const u of pendingUsers) {
        actions.push({
          id: `verify-${u.uid}`,
          title: `Préparer validation ${u.display_name}`,
          detail: u.email,
          section: 'utilisateurs',
          run: canEditUsers
            ? async () => {
                await adminService.updateUser(u.uid, {
                  verification_status: 'VERIFIED',
                  is_verified: true,
                });
                await data.refresh();
              }
            : undefined,
        });
      }
    }
    if (!query || query.includes('paiement') || query.includes('finance') || agent === 'finance') {
      for (const p of unpaid) {
        actions.push({
          id: `pay-${p.id}`,
          title: `Voir paiement ${p.label}`,
          detail: `${p.amount_eur} € · ${p.status}`,
          section: 'finances',
        });
      }
    }
    actions.push({
      id: 'refresh',
      title: 'Rafraîchir les données admin',
      detail: 'Recharge Firestore (users, clubs, devis…)',
      run: async () => {
        await data.refresh();
      },
    });
    return actions.slice(0, 8);
  };

  const runQuery = () => {
    const query = q.trim().toLowerCase();
    const pendingQuotes = data.clubQuoteRequests.filter((x) => x.status === 'pending');
    setPrepared(buildPrepared(query));

    if (!query) {
      setAnswer('Actions préparées ci-dessous — confirmez avant exécution.');
      return;
    }
    if (query.includes('devis') || query.includes('quote')) {
      setAnswer(
        `${pendingQuotes.length} devis clubs pending. Ex. : ${
          pendingQuotes[0]?.club_name ?? 'aucun'
        }. Agent ${agent}.`,
      );
      return;
    }
    if (query.includes('ca') || query.includes('mrr') || query.includes('revenu')) {
      const paid = data.users.filter(
        (u) => u.subscription_tier && u.subscription_tier !== 'free',
      ).length;
      setAnswer(
        `Estimation MRR ~ ${(paid * 3.99).toFixed(0)} € (${paid} abonnés payants). Agent ${agent}.`,
      );
      return;
    }
    if (query.includes('club')) {
      setAnswer(
        `${data.clubs.length} clubs · ${data.clubs.filter((c) => !c.verified).length} non validés · ${
          data.clubs.filter((c) => c.suspended).length
        } suspendus.`,
      );
      return;
    }
    setAnswer(
      `Contexte : ${data.users.length} users, ${data.clubs.length} clubs, ${data.workQueue.length} actions. Actions préparées prêtes.`,
    );
  };

  const executePrepared = (a: PreparedAction) => {
    if (a.run) {
      confirmAdminAction(
        a.title,
        a.detail,
        async () => {
          try {
            await a.run!();
            Alert.alert('OK', 'Action exécutée.');
            setPrepared((prev) => prev.filter((x) => x.id !== a.id));
          } catch (e) {
            Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
          }
        },
        a.destructive,
      );
      return;
    }
    if (a.section) onNavigate(a.section);
  };

  if (data.loading) return <AdminLoading />;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
      <AdminText variant="h1">ProDay Admin AI</AdminText>
      <AdminText variant="caption" color={t.muted}>
        Insights live · actions préparées + confirmation (pas de provider LLM externe)
      </AdminText>

      <View style={styles.agents}>
        {AGENTS.map((a) => (
          <Pressable
            key={a.id}
            onPress={() => setAgent(a.id)}
            style={[
              styles.agent,
              {
                borderColor: agent === a.id ? t.accent : t.border,
                backgroundColor: agent === a.id ? t.accentSoft : t.surface,
              },
            ]}
          >
            <AdminText variant="caption" color={agent === a.id ? t.accentHot : t.muted}>
              {a.label}
            </AdminText>
          </Pressable>
        ))}
      </View>

      <AdminCard>
        <AdminText variant="h2">Admin Insights</AdminText>
        {insights.map((ins) => (
          <Pressable
            key={ins.problem}
            onPress={() => onNavigate(ins.section)}
            style={[styles.insight, { borderColor: t.hairline }]}
          >
            <AdminText variant="h3">{ins.problem}</AdminText>
            <AdminText variant="caption" color={t.muted}>
              Impact : {ins.impact}
            </AdminText>
            <AdminBadge label={ins.action} tone="accent" />
          </Pressable>
        ))}
      </AdminCard>

      <AdminCard>
        <AdminText variant="h2">Poser une question</AdminText>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Ex. Quels devis sont en attente ?"
          placeholderTextColor={t.faint}
          onSubmitEditing={runQuery}
          style={[
            styles.input,
            {
              color: t.foreground,
              borderColor: t.border,
              backgroundColor: t.surfaceRaised,
            },
          ]}
        />
        <View style={styles.row}>
          <AdminButton label="Analyser + préparer" onPress={runQuery} />
          <AdminButton
            label="Préparer actions"
            variant="soft"
            onPress={() => {
              setPrepared(buildPrepared(''));
              setAnswer('Actions préparées — confirmez chacune.');
            }}
          />
        </View>
        {answer ? (
          <AdminText variant="body" color={t.muted}>
            {answer}
          </AdminText>
        ) : null}
      </AdminCard>

      {prepared.length > 0 ? (
        <AdminCard>
          <AdminText variant="h2">Actions préparées</AdminText>
          {prepared.map((a) => (
            <View key={a.id} style={[styles.prepared, { borderColor: t.hairline }]}>
              <View style={{ flex: 1, gap: 2 }}>
                <AdminText variant="h3">{a.title}</AdminText>
                <AdminText variant="caption" color={t.muted}>
                  {a.detail}
                </AdminText>
              </View>
              <AdminButton
                label={a.run ? 'Exécuter' : 'Ouvrir'}
                variant={a.run ? 'primary' : 'soft'}
                onPress={() => executePrepared(a)}
              />
            </View>
          ))}
          {!firebaseUser ? (
            <AdminText variant="caption" color={t.faint}>
              Session requise pour muter.
            </AdminText>
          ) : null}
        </AdminCard>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: adminSpace.lg, gap: adminSpace.lg, paddingBottom: 48 },
  agents: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  agent: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  insight: {
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginTop: 8,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  prepared: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
