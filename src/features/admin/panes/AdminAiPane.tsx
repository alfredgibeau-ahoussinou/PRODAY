import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useAdminData } from '../data/AdminDataContext';
import {
  AdminBadge,
  AdminCard,
  AdminLoading,
  AdminText,
} from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminSpace } from '../theme/adminDesignSystem';
import type { AdminNavSectionId } from '../navigation/adminNavConfig';

type Props = { onNavigate: (section: AdminNavSectionId) => void };

const AGENTS = [
  { id: 'admin', label: 'Admin AI', desc: 'Pilotage transversal' },
  { id: 'finance', label: 'Finance AI', desc: 'MRR, impayés, devis' },
  { id: 'sales', label: 'Sales AI', desc: 'CRM & prospects clubs' },
  { id: 'support', label: 'Support AI', desc: 'Tickets & signalements' },
  { id: 'security', label: 'Security AI', desc: 'Audit & anomalies' },
] as const;

export function AdminAiPane({ onNavigate }: Props) {
  const data = useAdminData();
  const t = ADMIN_TOKENS;
  const [q, setQ] = useState('');
  const [agent, setAgent] = useState<(typeof AGENTS)[number]['id']>('admin');
  const [answer, setAnswer] = useState<string | null>(null);

  const insights = useMemo(() => {
    const pendingQuotes = data.clubQuoteRequests.filter((x) => x.status === 'pending').length;
    const lines: { problem: string; impact: string; action: string; section: AdminNavSectionId }[] = [];
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

  const runQuery = () => {
    const query = q.trim().toLowerCase();
    if (!query) return;
    const pendingQuotes = data.clubQuoteRequests.filter((x) => x.status === 'pending');
    if (query.includes('devis') || query.includes('quote')) {
      setAnswer(
        `${pendingQuotes.length} devis clubs pending. Ex. : ${
          pendingQuotes[0]?.club_name ?? 'aucun'
        }. Agent ${agent}.`,
      );
      return;
    }
    if (query.includes('ca') || query.includes('mrr') || query.includes('revenu')) {
      const paid = data.users.filter((u) => u.subscription_tier && u.subscription_tier !== 'free').length;
      setAnswer(`Estimation MRR ~ ${(paid * 3.99).toFixed(0)} € (${paid} abonnés payants). Agent ${agent}.`);
      return;
    }
    if (query.includes('club')) {
      setAnswer(`${data.clubs.length} clubs · ${data.clubs.filter((c) => !c.verified).length} non validés.`);
      return;
    }
    setAnswer(
      `Contexte chargé : ${data.users.length} users, ${data.clubs.length} clubs, ${data.workQueue.length} actions. Précisez devis, clubs, MRR ou santé.`,
    );
  };

  if (data.loading) return <AdminLoading />;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
      <AdminText variant="h1">ProDay Admin AI</AdminText>
      <AdminText variant="caption" color={t.muted}>
        Assistant contextuel + multi-agents (routage local sur données live)
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
          style={[styles.input, { color: t.foreground, borderColor: t.border, backgroundColor: t.surfaceRaised }]}
        />
        <Pressable onPress={runQuery} style={[styles.ask, { backgroundColor: t.accent }]}>
          <AdminText variant="caption" color="#fff">
            Analyser
          </AdminText>
        </Pressable>
        {answer ? (
          <AdminText variant="body" color={t.muted}>
            {answer}
          </AdminText>
        ) : null}
      </AdminCard>
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
  ask: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
});
