import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAdminData } from '../../../context/AdminDataContext';
import { useAuth } from '../../../context/AuthContext';
import { AdminIntelCard, AdminIntelBadge } from '../../../components/admin/AdminIntelCard';
import { AdminTrendChart } from '../../../components/admin/AdminTrendChart';
import { AdminButton } from '../../../components/admin/AdminButton';
import { adminChrome, adminType } from '../../../theme/adminTheme';
import { spacing } from '../../../theme/designTokens';
import {
  answerAdminCopilot,
  weeklyDeltaSentence,
  type AdminCopilotSnapshot,
} from '../../../utils/adminCopilot';
import { buildAdminIntelAlerts } from '../../../utils/adminIntel';
import { resolveAdminWorkItemNavigation } from '../../../utils/adminWorkNavigation';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';

interface Props {
  onNavigateSection: (section: string) => void;
  onNavigateTarget?: (target: {
    section: string;
    hubTab?: string;
    screenTab?: string;
    focusId?: string;
  }) => void;
  onOpenDecisions?: () => void;
}

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

export const AdminIntelligenceHome: React.FC<Props> = ({
  onNavigateSection,
  onNavigateTarget,
  onOpenDecisions,
}) => {
  const { profile } = useAuth();
  const data = useAdminData();
  const {
    refreshing,
    refresh,
    workQueue,
    dailySnapshots,
    trafficDaily,
  } = data;

  const firstName = useMemo(() => {
    if (!profile?.display_name) return '';
    return profile.display_name.split(' ')[0];
  }, [profile]);

  const snapshot = useMemo(() => toSnapshot(data), [data]);
  const alerts = useMemo(() => buildAdminIntelAlerts(snapshot), [snapshot]);
  const detected = useMemo(
    () => answerAdminCopilot('prépare un rapport', snapshot),
    [snapshot],
  );
  const deltaLine = weeklyDeltaSentence(detected.facts.weeklyUsersDeltaPct);

  const go = (target: { section: string; hubTab?: string; screenTab?: string }) => {
    if (onNavigateTarget) onNavigateTarget(target);
    else onNavigateSection(target.section);
  };

  const chartSnapshots = dailySnapshots.slice(-7);
  const hasTraffic = trafficDaily.some((d) => (d.app_opens ?? 0) + (d.site_visits ?? 0) > 0);
  const iaQuestion = chartSnapshots.length >= 2
    ? 'La file et les comptes suivent-ils la même tendance que l’activité 7 j ?'
    : 'Quand les snapshots quotidiens seront là, je pourrai commenter la tendance.';
  const iaPhrase =
    chartSnapshots.length >= 2
      ? `Activité mesurée sur ${chartSnapshots.length} jour(s) de snapshots. ${deltaLine}`
      : 'Pas assez d’historique pour un % cette semaine.';

  return (
    <View style={s.root}>
      <LinearGradient
        colors={[adminChrome.atmosphereTop, adminChrome.band]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <ScrollView
        contentContainerStyle={s.body}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={adminChrome.accent} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.hello}>{firstName ? `Bonjour ${firstName}` : 'Bonjour'}</Text>
        <Text style={s.lede}>Voici ce qui mérite votre attention aujourd’hui.</Text>

        <AdminIntelCard
          kicker="ProDay AI"
          title={`${workQueue.length} élément${workQueue.length === 1 ? '' : 's'} dans la file`}
          body={
            workQueue.length
              ? 'File réelle (vérifs, paiements, signalements, adhésions).'
              : 'File vide — rien à traiter pour le moment.'
          }
          icon="star-four-points"
          tone="accent"
          cta={{
            label: 'Ouvrir la file',
            onPress: () => (onOpenDecisions ? onOpenDecisions() : go({ section: 'ia', screenTab: 'alertes' })),
          }}
        >
          {workQueue.slice(0, 6).map((item) => (
            <PressableSpring
              key={item.id}
              onPress={() => go(resolveAdminWorkItemNavigation(item))}
              scaleTo={0.98}
            >
              <View style={s.queueRow}>
                <Text style={s.queueTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Icon name="chevron-forward" size={14} color={adminChrome.textMuted} />
              </View>
            </PressableSpring>
          ))}
        </AdminIntelCard>

        <AdminIntelCard
          kicker="J’ai également détecté"
          title="Tendance utilisateurs"
          body={deltaLine}
          icon="stats-chart"
        />

        <View style={s.grid}>
          <DomainCard
            title="Activité"
            body={`${data.matches.length} matchs · ${data.events.length} événements`}
            onPress={() => go({ section: 'activite', hubTab: 'matchs' })}
          />
          <DomainCard
            title="Business"
            body={`${detected.facts.proCount} Pro · ${detected.facts.pendingPaymentsCount} paiements pending`}
            onPress={() => go({ section: 'business', screenTab: 'vue' })}
          />
          <DomainCard
            title="Clubs"
            body={`${data.clubs.length} clubs`}
            onPress={() => go({ section: 'clubs' })}
          />
          <DomainCard
            title="Utilisateurs"
            body={`${data.users.length} comptes`}
            onPress={() => go({ section: 'users' })}
          />
          <DomainCard
            title="Sécurité"
            body="Audit réel · connexions inhabituelles non branchées"
            onPress={() => go({ section: 'securite' })}
          />
        </View>

        {chartSnapshots.length > 0 ? (
          <AdminTrendChart
            snapshots={chartSnapshots}
            metric="teamEvents"
            title="Activité 7 j (événements)"
            color={adminChrome.accent}
          />
        ) : (
          <AdminIntelCard
            title="Graphique 7 j"
            body="Pas encore de snapshots platform_stats_daily."
            icon="stats-chart"
          />
        )}

        <AdminIntelCard
          kicker="Question"
          title={iaQuestion}
          body={iaPhrase}
          meta={hasTraffic ? 'Trafic site/app également chargé.' : 'Trafic : pas de volume sur la fenêtre chargée.'}
        />

        {alerts.slice(0, 3).map((a) => (
          <View key={a.id} style={s.alertMini}>
            <AdminIntelBadge
              label={a.level}
              tone={a.level === 'critical' || a.level === 'high' ? 'danger' : 'warn'}
            />
            <Text style={s.alertTitle}>{a.title}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function DomainCard({
  title,
  body,
  onPress,
}: {
  title: string;
  body: string;
  onPress: () => void;
}) {
  return (
    <View style={s.domainWrap}>
      <AdminIntelCard title={title} body={body} onPress={onPress} cta={{ label: 'Ouvrir', onPress }} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminChrome.band },
  body: { padding: spacing.md, gap: spacing.md, paddingBottom: 100 },
  hello: {
    color: adminChrome.text,
    fontFamily: adminType.display,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  lede: {
    color: adminChrome.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: -4,
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: adminChrome.shellBorder,
  },
  queueTitle: { flex: 1, color: adminChrome.text, fontSize: 13, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  domainWrap: { width: '48%', flexGrow: 1, minWidth: 150 },
  alertMini: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertTitle: { flex: 1, color: adminChrome.textSecondary, fontSize: 13 },
});
