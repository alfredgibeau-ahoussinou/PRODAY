import React, { useMemo } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAdminData } from '../data/AdminDataContext';
import { useAuth } from '../../../context/AuthContext';
import {
  AdminBadge,
  AdminCard,
  AdminLoading,
  AdminMetric,
  AdminText,
} from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminSpace } from '../theme/adminDesignSystem';
import type { AdminNavSectionId } from '../navigation/adminNavConfig';
import { countWorkByKind } from '../../../utils/adminInsights';
import { getRoleLabel } from '../../../screens/signup/signupFlowConfig';

type Props = {
  onNavigate: (section: AdminNavSectionId, focusId?: string) => void;
};

export function AdminDashboardPane({ onNavigate }: Props) {
  const { profile } = useAuth();
  const data = useAdminData();
  const t = ADMIN_TOKENS;
  const byKind = useMemo(() => countWorkByKind(data.workQueue), [data.workQueue]);

  if (data.loading) return <AdminLoading label="Chargement du centre de commande…" />;

  const paidUsers = data.users.filter((u) => u.subscription_tier && u.subscription_tier !== 'free').length;
  const pendingQuotes = data.clubQuoteRequests.filter((q) => q.status === 'pending').length;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={data.refreshing}
          onRefresh={() => void data.refresh()}
          tintColor={t.accent}
        />
      }
    >
      <LinearGradient
        colors={['rgba(59,130,246,0.18)', 'transparent']}
        style={styles.heroGlow}
        pointerEvents="none"
      />

      <View style={styles.hero}>
        <AdminText variant="label" color={t.accentHot}>
          ProDay · maintenant
        </AdminText>
        <AdminText variant="display">
          Bonjour{profile?.display_name ? `, ${profile.display_name.split(' ')[0]}` : ''}
        </AdminText>
        <AdminText variant="body" color={t.muted}>
          Centre de contrôle de toute la plateforme. Surveillez, décidez, agissez.
        </AdminText>
      </View>

      <Pressable onPress={() => onNavigate('plateforme')} style={styles.healthHit}>
        <AdminCard style={styles.healthCard}>
          <View style={styles.healthRow}>
            <View style={{ flex: 1, gap: 4 }}>
              <AdminText variant="label" color={t.faint}>
                ProDay Health
              </AdminText>
              <AdminText variant="stat" color={
                data.health.score >= 75 ? t.healthGood : data.health.score >= 55 ? t.healthMid : t.healthBad
              }>
                {data.health.score}%
              </AdminText>
              <AdminText variant="caption" color={t.muted}>
                {data.health.label} · appuyer pour diagnostic
              </AdminText>
            </View>
            <AdminBadge
              label={`${data.workQueue.length} actions`}
              tone={data.workQueue.length > 8 ? 'danger' : data.workQueue.length > 0 ? 'warn' : 'success'}
            />
          </View>
        </AdminCard>
      </Pressable>

      <View style={styles.metrics}>
        <AdminMetric label="Utilisateurs" value={data.stats?.users ?? 0} hint={`${paidUsers} payants`} />
        <AdminMetric label="Clubs" value={data.stats?.clubs ?? 0} hint={`${data.clubs.filter((c) => c.verified).length} vérifiés`} />
        <AdminMetric label="Coachs" value={data.stats?.coaches ?? 0} />
        <AdminMetric label="Joueurs" value={data.stats?.players ?? 0} />
      </View>

      <AdminCard>
        <AdminText variant="h2">Action required</AdminText>
        <AdminText variant="caption" color={t.muted}>
          Éléments actionnables — branchement données réelles
        </AdminText>
        <View style={styles.actionGrid}>
          {[
            { label: 'Devis clubs', n: byKind.club_quote || pendingQuotes, section: 'commercial' as const },
            { label: 'Vérifications', n: byKind.verification, section: 'utilisateurs' as const },
            { label: 'Paiements', n: byKind.payment, section: 'finances' as const },
            { label: 'Adhésions', n: byKind.membership, section: 'clubs' as const },
            { label: 'Demandes abo', n: byKind.subscription_request, section: 'finances' as const },
            { label: 'Signalements', n: byKind.report, section: 'securite' as const },
          ].map((row) => (
            <Pressable
              key={row.label}
              onPress={() => onNavigate(row.section)}
              style={[styles.actionRow, { borderColor: t.border }]}
            >
              <AdminText variant="h3">{row.label}</AdminText>
              <AdminBadge label={String(row.n)} tone={row.n > 0 ? 'warn' : 'success'} />
            </Pressable>
          ))}
        </View>
      </AdminCard>

      <AdminCard>
        <AdminText variant="h2">File prioritaire</AdminText>
        {data.workQueue.length === 0 ? (
          <AdminText variant="body" color={t.muted}>
            Aucune action critique. La plateforme est calme.
          </AdminText>
        ) : (
          data.workQueue.slice(0, 8).map((item) => (
            <Pressable
              key={item.id}
              onPress={() => onNavigate(item.targetSection, item.entityId)}
              style={[styles.queueItem, { borderColor: t.hairline }]}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <AdminText variant="h3">{item.title}</AdminText>
                <AdminText variant="caption" color={t.muted} numberOfLines={1}>
                  {item.subtitle}
                </AdminText>
              </View>
              <AdminBadge
                label={item.priority}
                tone={
                  item.priority === 'critical'
                    ? 'danger'
                    : item.priority === 'high'
                      ? 'warn'
                      : 'info'
                }
              />
            </Pressable>
          ))
        )}
      </AdminCard>

      <AdminCard>
        <AdminText variant="h2">Répartition des rôles</AdminText>
        <View style={styles.roleWrap}>
          {data.roleBreakdown.slice(0, 6).map((r) => (
            <View key={r.role} style={[styles.roleChip, { backgroundColor: t.surfaceRaised }]}>
              <AdminText variant="caption">{getRoleLabel(r.role)}</AdminText>
              <AdminText variant="h3">{r.count}</AdminText>
            </View>
          ))}
        </View>
      </AdminCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: adminSpace.lg, gap: adminSpace.lg, paddingBottom: 48 },
  heroGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 180 },
  hero: { gap: 6, marginBottom: 4 },
  healthHit: { borderRadius: 16 },
  healthCard: { paddingVertical: adminSpace.xl },
  healthRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpace.md },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpace.sm },
  actionGrid: { gap: adminSpace.sm, marginTop: adminSpace.sm },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  roleWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 88,
    gap: 2,
  },
});
