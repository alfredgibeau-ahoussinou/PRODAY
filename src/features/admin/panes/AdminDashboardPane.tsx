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
  AdminBrandMark,
  AdminButton,
  AdminCard,
  AdminLoading,
  AdminMetric,
  AdminText,
} from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import {
  adminLayout,
  adminRadius,
  adminSpace,
} from '../theme/adminDesignSystem';
import type { AdminNavSectionId } from '../navigation/adminNavConfig';
import { countWorkByKind } from '../../../utils/adminInsights';
import { getRoleLabel } from '../../../screens/signup/signupFlowConfig';

type Props = {
  onNavigate: (section: AdminNavSectionId, focusId?: string) => void;
  onOpenCommand?: () => void;
};

export function AdminDashboardPane({ onNavigate, onOpenCommand }: Props) {
  const { profile } = useAuth();
  const data = useAdminData();
  const t = ADMIN_TOKENS;
  const byKind = useMemo(() => countWorkByKind(data.workQueue), [data.workQueue]);

  if (data.loading) return <AdminLoading label="Préparation du centre de commande…" />;

  const paidUsers = data.users.filter(
    (u) => u.subscription_tier && u.subscription_tier !== 'free',
  ).length;
  const pendingQuotes = data.clubQuoteRequests.filter((q) => q.status === 'pending').length;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={data.refreshing}
          onRefresh={() => void data.refresh()}
          tintColor={t.accent}
        />
      }
    >
      <View style={styles.hero}>
        <LinearGradient
          colors={[
            'rgba(212,184,128,0.28)',
            'rgba(14,21,36,0.55)',
            'rgba(5,7,14,0.92)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroTop}>
          <AdminBrandMark />
          <View style={styles.heroActions}>
            {onOpenCommand ? (
              <AdminButton label="Rechercher" variant="soft" onPress={onOpenCommand} />
            ) : null}
            <AdminBadge label="Directif" tone="accent" />
          </View>
        </View>
        <AdminText variant="label" champagne>
          ProDay · maintenant
        </AdminText>
        <AdminText variant="display" numberOfLines={2}>
          Bonjour{profile?.display_name ? `, ${profile.display_name.split(' ')[0]}` : ''}
        </AdminText>
        <AdminText variant="body" muted style={{ maxWidth: 440 }}>
          Centre de contrôle exécutif. Surveillez, décidez, agissez.
        </AdminText>
      </View>

      <Pressable onPress={() => onNavigate('plateforme')}>
        <AdminCard hero>
          <View style={styles.healthRow}>
            <View style={{ flex: 1, gap: 6 }}>
              <AdminText variant="label" muted>
                ProDay Health
              </AdminText>
              <AdminText
                variant="stat"
                color={
                  data.health.score >= 75
                    ? t.healthGood
                    : data.health.score >= 55
                      ? t.healthMid
                      : t.healthBad
                }
              >
                {data.health.score}%
              </AdminText>
              <AdminText variant="caption" muted>
                {data.health.label} · diagnostic plateforme
              </AdminText>
            </View>
            <AdminBadge
              label={`${data.workQueue.length} actions`}
              tone={
                data.workQueue.length > 8
                  ? 'danger'
                  : data.workQueue.length > 0
                    ? 'warn'
                    : 'success'
              }
            />
          </View>
        </AdminCard>
      </Pressable>

      <View style={styles.metrics}>
        <AdminMetric
          label="Utilisateurs"
          value={data.stats?.users ?? 0}
          hint={`${paidUsers} payants`}
        />
        <AdminMetric
          label="Clubs"
          value={data.stats?.clubs ?? 0}
          hint={`${data.clubs.filter((c) => c.verified).length} vérifiés`}
        />
        <AdminMetric label="Coachs" value={data.stats?.coaches ?? 0} />
        <AdminMetric label="Joueurs" value={data.stats?.players ?? 0} />
      </View>

      <AdminCard>
        <AdminText variant="h2">Action required</AdminText>
        <AdminText variant="caption" muted>
          File actionnable — données live
        </AdminText>
        <View style={styles.actionGrid}>
          {[
            {
              label: 'Devis clubs',
              n: byKind.club_quote || pendingQuotes,
              section: 'commercial' as const,
            },
            { label: 'Vérifications', n: byKind.verification, section: 'utilisateurs' as const },
            { label: 'Paiements', n: byKind.payment, section: 'finances' as const },
            { label: 'Adhésions', n: byKind.membership, section: 'clubs' as const },
            {
              label: 'Demandes abo',
              n: byKind.subscription_request,
              section: 'finances' as const,
            },
            { label: 'Signalements', n: byKind.report, section: 'securite' as const },
          ].map((row) => (
            <Pressable
              key={row.label}
              onPress={() => onNavigate(row.section)}
              style={[styles.actionRow, { borderColor: t.border, backgroundColor: t.surfaceMuted }]}
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
          <AdminText variant="body" muted>
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
                <AdminText variant="caption" muted numberOfLines={1}>
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
            <View
              key={r.role}
              style={[
                styles.roleChip,
                { backgroundColor: t.surfaceRaised, borderColor: t.border },
              ]}
            >
              <AdminText variant="caption" muted>
                {getRoleLabel(r.role)}
              </AdminText>
              <AdminText variant="h3" champagne>
                {r.count}
              </AdminText>
            </View>
          ))}
        </View>
      </AdminCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: adminLayout.pageGutter,
    /** Le shell gère insets.top — ici seulement un léger air interne. */
    paddingTop: adminSpace.sm,
    paddingBottom: adminLayout.dockClearance,
    gap: adminLayout.sectionGap,
  },
  hero: {
    borderRadius: adminRadius.hero,
    overflow: 'hidden',
    paddingHorizontal: adminLayout.heroPad,
    paddingTop: adminSpace.lg,
    paddingBottom: adminLayout.heroPad,
    gap: adminSpace.md,
    borderWidth: 1,
    borderColor: ADMIN_TOKENS.borderLuxury,
    minHeight: 188,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpace.xs,
    gap: adminSpace.sm,
    minHeight: adminLayout.hitTarget,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  healthRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpace.md },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: adminLayout.gridGap },
  actionGrid: { gap: adminSpace.sm, marginTop: adminSpace.sm },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: adminRadius.md,
    minHeight: adminLayout.listRowMinHeight,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: adminLayout.listRowMinHeight,
  },
  roleWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  roleChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: adminRadius.sm,
    minWidth: 92,
    gap: 2,
    borderWidth: 1,
  },
});
