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
import { Icon } from '../../../components/ui/Icon';
import type { IconName } from '../../../components/ui/iconNames';
import { AdminPressable } from '../motion';

type Props = {
  onNavigate: (section: AdminNavSectionId, focusId?: string) => void;
  onOpenCommand?: () => void;
};

const QUICK_TOOLS: {
  section: AdminNavSectionId;
  icon: IconName;
  title: string;
  hint: (ctx: { pendingQuotes: number }) => string;
  hintTone?: 'signal' | 'success' | 'muted' | 'accent';
}[] = [
  {
    section: 'ia',
    icon: 'star-four-points',
    title: 'Moteur IA',
    hint: () => 'Config & ops agents',
    hintTone: 'signal',
  },
  {
    section: 'systeme',
    icon: 'shield',
    title: 'Sécurité & système',
    hint: () => 'Auth · flags · santé',
    hintTone: 'success',
  },
  {
    section: 'commercial',
    icon: 'briefcase',
    title: 'Devis & sponsoring',
    hint: ({ pendingQuotes }) =>
      pendingQuotes > 0 ? `${pendingQuotes} devis en attente` : 'Pipeline commercial',
    hintTone: 'accent',
  },
  {
    section: 'produit',
    icon: 'sparkles',
    title: 'Univers & produit',
    hint: () => 'Pôles · features · bêta',
    hintTone: 'muted',
  },
];

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
  const firstName = profile?.display_name?.split(' ')[0];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={data.refreshing}
          onRefresh={() => void data.refresh()}
          tintColor={t.signal}
        />
      }
    >
      <View style={[styles.hero, { borderColor: t.borderLuxury }]}>
        <LinearGradient
          colors={[
            'rgba(139,168,196,0.22)',
            'rgba(11,17,26,0.72)',
            'rgba(2,4,10,0.96)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroTop}>
          <AdminBrandMark />
          <View style={styles.heroActions}>
            {onOpenCommand ? (
              <AdminButton label="Rechercher" variant="soft" onPress={onOpenCommand} />
            ) : null}
            <AdminBadge label="Fondateur" tone="accent" />
          </View>
        </View>
        <AdminText variant="label" color={t.signal}>
          Control Center · live
        </AdminText>
        <AdminText variant="display" numberOfLines={2}>
          {firstName ? `Bonjour, ${firstName}` : 'Bonjour'}
        </AdminText>
        <AdminText variant="body" muted style={{ maxWidth: 420 }}>
          Surveillez la plateforme, tranchez les files, pilotez l’écosystème.
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
        <View style={styles.sectionHead}>
          <View style={{ flex: 1, gap: 2 }}>
            <AdminText variant="h2">Accès rapides</AdminText>
            <AdminText variant="caption" muted>
              Domaines opérationnels
            </AdminText>
          </View>
          <AdminBadge label="Live" tone="info" />
        </View>

        <View style={styles.quickToolsGrid}>
          {QUICK_TOOLS.map((tool) => {
            const hint = tool.hint({ pendingQuotes });
            const hintColor =
              tool.hintTone === 'success'
                ? t.success
                : tool.hintTone === 'signal'
                  ? t.signal
                  : tool.hintTone === 'accent'
                    ? t.accentHot
                    : t.muted;
            return (
              <AdminPressable
                key={tool.section}
                onPress={() => onNavigate(tool.section)}
                style={[
                  styles.quickToolBtn,
                  { borderColor: t.border, backgroundColor: t.surfaceMuted },
                ]}
              >
                <View
                  style={[
                    styles.quickIcon,
                    { backgroundColor: t.signalSoft, borderColor: t.border },
                  ]}
                >
                  <Icon name={tool.icon} size={16} color={t.signal} />
                </View>
                <AdminText variant="h3">{tool.title}</AdminText>
                <AdminText variant="caption" color={hintColor}>
                  {hint}
                </AdminText>
              </AdminPressable>
            );
          })}
        </View>
      </AdminCard>

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
              <AdminText variant="h3" color={t.accentHot}>
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
    minHeight: 176,
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
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: adminSpace.md,
  },
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
  quickToolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  quickToolBtn: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 14,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    gap: 8,
  },
  quickIcon: {
    width: 32,
    height: 32,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
