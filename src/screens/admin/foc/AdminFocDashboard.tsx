import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdminData } from '../../../context/AdminDataContext';
import { useAuth } from '../../../context/AuthContext';
import {
  AdminFocKpiCard,
  AdminFocActivityFeed,
  AdminFocMatchCard,
  AdminFocCard,
} from '../../../components/admin/foc';
import type { AdminFocActivityItem } from '../../../components/admin/foc';
import type { MatchStatusTone } from '../../../components/admin/foc';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { adminChrome, adminType } from '../../../theme/adminTheme';
import { spacing } from '../../../theme/designTokens';
import type { FriendlyMatch } from '../../../models/FriendlyMatch';
import {
  resolveAdminPlayerAgeGroup,
} from '../../../utils/adminPlayerUniverse';
import { JOUEUR_UNIVERSE_LABELS } from '../../../utils/joueurBirthAge';

interface AdminFocDashboardProps {
  onNavigateSection: (section: string) => void;
  onOpenDecisions?: () => void;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTimeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return `il y a ${Math.floor(diff / 86400)} j`;
}

function matchStatusTone(match: FriendlyMatch, today: Date): MatchStatusTone {
  if (match.status === 'PLAYED' || match.status === 'CANCELLED' || match.status === 'DECLINED') {
    return 'done';
  }
  if (isSameDay(match.date, today)) return 'live';
  return 'upcoming';
}

function matchStatusLabel(tone: MatchStatusTone, match: FriendlyMatch): string {
  if (tone === 'live') return "Aujourd'hui";
  if (match.status === 'PLAYED') return 'Terminé';
  if (match.status === 'ACCEPTED') return 'Confirmé';
  if (match.status === 'CANCELLED') return 'Annulé';
  return 'À venir';
}

export const AdminFocDashboard: React.FC<AdminFocDashboardProps> = ({
  onNavigateSection,
  onOpenDecisions,
}) => {
  const onNavigateLeaf = onNavigateSection;
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const {
    refreshing,
    refresh,
    users,
    matches,
    events,
    clubs,
    posts,
    workQueue,
    roleBreakdown,
  } = useAdminData();

  const firstName = useMemo(() => {
    if (!profile?.display_name) return '';
    return profile.display_name.split(' ')[0];
  }, [profile]);

  const today = useMemo(() => new Date(), []);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpiAdherents = users.length;

  const kpiMatchsToday = useMemo(
    () => matches.filter((m) => isSameDay(m.date, today)).length,
    [matches, today],
  );

  const kpiClubs = clubs.length;

  const kpiCoachs = useMemo(
    () => roleBreakdown.find((r) => r.role === 'coach')?.count ?? 0,
    [roleBreakdown],
  );

  const playerUniverseCounts = useMemo(() => {
    const players = users.filter((u) => u.role === 'player');
    const counts = { youth: 0, teen: 0, adult: 0, unset: 0 };
    for (const u of players) {
      const g = resolveAdminPlayerAgeGroup(u);
      if (g) counts[g] += 1;
      else counts.unset += 1;
    }
    return { total: players.length, ...counts };
  }, [users]);

  const kpiPendingPosts = useMemo(
    () => (posts as Array<{ status?: string }>).filter((p) => p.status === 'pending').length,
    [posts],
  );

  const kpiEventsAVenir = useMemo(
    () => events.filter((e) => e.starts_at > today).length,
    [events, today],
  );

  // ── Upcoming matches (next 7 days, non-terminal) ─────────────────────────
  const upcomingMatches = useMemo(() => {
    const sevenDays = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return matches
      .filter(
        (m) =>
          !['PLAYED', 'CANCELLED', 'DECLINED'].includes(m.status) &&
          m.date >= today &&
          m.date <= sevenDays,
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);
  }, [matches, today]);

  // ── Activity feed ─────────────────────────────────────────────────────────
  const activityItems = useMemo((): AdminFocActivityItem[] => {
    const items: AdminFocActivityItem[] = [];

    workQueue.slice(0, 3).forEach((w) => {
      items.push({
        id: `wq-${w.id}`,
        title: w.title,
        subtitle: w.subtitle,
        timeLabel: w.meta ?? '',
        kind: w.kind,
      });
    });

    [...matches]
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, 2)
      .forEach((m) => {
        items.push({
          id: `match-${m.id}`,
          title: `${m.requester_club_name} — ${m.opponent_club_name ?? 'Adversaire ouvert'}`,
          subtitle: `Match ${m.category} · ${m.city}`,
          timeLabel: formatTimeAgo(m.created_at),
          kind: 'match',
        });
      });

    [...users].slice(0, 2).forEach((u) => {
      items.push({
        id: `user-${u.uid}`,
        title: u.display_name,
        subtitle: `Nouveau compte · ${u.role}`,
        timeLabel: '',
        kind: 'user',
      });
    });

    return items.slice(0, 8);
  }, [workQueue, matches, users]);

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const styles = useMemo(() => createStyles(), []);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={adminChrome.accent}
        />
      }
    >
      {/* Greeting */}
      <View style={styles.greetingBlock}>
        <LinearGradient
          colors={[adminChrome.overlayStrong, adminChrome.soft, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.greetingGlow}
          pointerEvents="none"
        />
        <Text style={styles.greetingKicker}>Centre d’ops · Aujourd’hui</Text>
        <Text style={styles.greeting}>
          {firstName ? `Bonjour ${firstName}` : 'Bonjour'}
        </Text>
        <Text style={styles.greetingSub}>
          Pilotage ProDay — adhérents, matchs, clubs et décisions en un regard.
        </Text>
      </View>

      {/* KPI Grid */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCell}>
          <AdminFocKpiCard
            label="Adhérents actifs"
            value={kpiAdherents}
            icon="people"
            onPress={() => onNavigateLeaf('adherents')}
          />
        </View>
        <View style={styles.kpiCell}>
          <AdminFocKpiCard
            label="Matchs aujourd'hui"
            value={kpiMatchsToday}
            icon="football"
            hot={kpiMatchsToday > 0}
            onPress={() => onNavigateLeaf('matchs')}
          />
        </View>
        <View style={styles.kpiCell}>
          <AdminFocKpiCard
            label="Clubs actifs"
            value={kpiClubs}
            icon="business"
            onPress={() => onNavigateLeaf('clubs')}
          />
        </View>
        <View style={styles.kpiCell}>
          <AdminFocKpiCard
            label="Coachs actifs"
            value={kpiCoachs}
            icon="person"
            onPress={() => onNavigateLeaf('coaches')}
          />
        </View>
        <View style={styles.kpiCell}>
          <AdminFocKpiCard
            label="Publications en attente"
            value={kpiPendingPosts}
            icon="document"
            hot={kpiPendingPosts > 0}
            onPress={() => onNavigateLeaf('publications')}
          />
        </View>
        <View style={styles.kpiCell}>
          <AdminFocKpiCard
            label="Événements à venir"
            value={kpiEventsAVenir}
            icon="calendar"
            onPress={() => onNavigateLeaf('competitions')}
          />
        </View>
      </View>

      {/* Univers joueurs */}
      <AdminFocCard
        title="Univers joueurs"
        action={{ label: 'Gérer', onPress: () => onNavigateLeaf('adherents') }}
      >
        <View style={styles.universeRow}>
          {(
            [
              ['youth', playerUniverseCounts.youth],
              ['teen', playerUniverseCounts.teen],
              ['adult', playerUniverseCounts.adult],
            ] as const
          ).map(([id, count]) => (
            <PressableSpring
              key={id}
              onPress={() => onNavigateLeaf('adherents')}
              style={styles.universeCell}
            >
              <Text style={styles.universeCount}>{count}</Text>
              <Text style={styles.universeLabel}>{JOUEUR_UNIVERSE_LABELS[id].title}</Text>
              <Text style={styles.universeRange}>{JOUEUR_UNIVERSE_LABELS[id].range}</Text>
            </PressableSpring>
          ))}
        </View>
        {playerUniverseCounts.unset > 0 ? (
          <Text style={styles.universeHint}>
            {playerUniverseCounts.unset} joueur
            {playerUniverseCounts.unset > 1 ? 's' : ''} sans date de naissance — à compléter
            dans Adhérents → Univers.
          </Text>
        ) : (
          <Text style={styles.universeHint}>
            {playerUniverseCounts.total} joueur
            {playerUniverseCounts.total !== 1 ? 's' : ''} · personnalisation âge × genre active.
          </Text>
        )}
      </AdminFocCard>

      {/* Activity feed */}
      {activityItems.length > 0 ? (
        <AdminFocCard>
          <AdminFocActivityFeed
            items={activityItems}
            onPressItem={(id) => {
              if (id.startsWith('wq-')) onNavigateLeaf('publications');
              else if (id.startsWith('match-')) onNavigateLeaf('matchs');
              else if (id.startsWith('user-')) onNavigateLeaf('adherents');
            }}
          />
        </AdminFocCard>
      ) : null}

      {/* Upcoming matches */}
      {upcomingMatches.length > 0 ? (
        <AdminFocCard
          title="Matchs à venir"
          action={{ label: 'Tout voir', onPress: () => onNavigateLeaf('matchs') }}
        >
          <View style={styles.matchList}>
            {upcomingMatches.map((m) => {
              const tone = matchStatusTone(m, today);
              return (
                <AdminFocMatchCard
                  key={m.id}
                  homeName={m.requester_club_name}
                  awayName={m.opponent_club_name ?? 'Adversaire ouvert'}
                  dateLabel={m.date.toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                  timeLabel={m.time_label}
                  city={m.city}
                  statusLabel={matchStatusLabel(tone, m)}
                  statusTone={tone}
                  competition={m.category}
                  onPress={() => onNavigateLeaf('matchs')}
                />
              );
            })}
          </View>
        </AdminFocCard>
      ) : null}

      {/* Decisions teaser */}
      <PressableSpring
        onPress={() => {
          if (onOpenDecisions) onOpenDecisions();
          else onNavigateLeaf('publications');
        }}
        style={styles.decisionsBanner}
        scaleTo={0.97}
        haptic
      >
        <View style={styles.decisionsInner}>
          <View style={styles.decisionsIconWrap}>
            <Icon name="alert-circle" size={20} color={adminChrome.accent} />
          </View>
          <View style={styles.decisionsCopy}>
            <Text style={styles.decisionsTitle}>Décisions en attente</Text>
            <Text style={styles.decisionsSub}>
              {workQueue.length > 0
                ? `${workQueue.length} action${workQueue.length > 1 ? 's' : ''} à traiter`
                : 'Aucune action urgente pour le moment.'}
            </Text>
          </View>
          <Icon name="chevron-forward" size={16} color={adminChrome.textMuted} />
        </View>
      </PressableSpring>
    </ScrollView>
  );
};

function createStyles() {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: adminChrome.band,
    },
    content: {
      padding: spacing.md,
      gap: spacing.md,
    },
    greetingBlock: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      gap: 4,
      borderRadius: adminChrome.radiusLg,
      overflow: 'hidden',
      backgroundColor: adminChrome.shell,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorderStrong,
    },
    greetingGlow: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.9,
    },
    greetingKicker: {
      fontFamily: adminType.bodyExtra,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.3,
      textTransform: 'uppercase',
      color: adminChrome.accent,
      marginBottom: 2,
    },
    greeting: {
      fontFamily: adminType.display,
      fontSize: 28,
      fontWeight: '800',
      color: adminChrome.text,
      letterSpacing: -0.7,
    },
    greetingSub: {
      fontFamily: adminType.body,
      fontSize: 14,
      color: adminChrome.textMuted,
      lineHeight: 20,
      marginTop: 2,
      maxWidth: 420,
    },
    kpiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    kpiCell: {
      width: '47%',
      flexGrow: 1,
    },
    universeRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    universeCell: {
      flex: 1,
      padding: spacing.sm,
      borderRadius: adminChrome.radius,
      backgroundColor: adminChrome.shellElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
      gap: 2,
    },
    universeCount: {
      fontFamily: adminType.display,
      fontSize: 22,
      fontWeight: '800',
      color: adminChrome.text,
    },
    universeLabel: {
      fontFamily: adminType.bodyExtra,
      fontSize: 12,
      fontWeight: '800',
      color: adminChrome.accent,
    },
    universeRange: {
      fontFamily: adminType.bodySemi,
      fontSize: 10,
      fontWeight: '600',
      color: adminChrome.textMuted,
    },
    universeHint: {
      marginTop: spacing.sm,
      fontFamily: adminType.body,
      fontSize: 12,
      lineHeight: 17,
      color: adminChrome.textMuted,
    },
    matchList: {
      gap: spacing.sm,
    },
    decisionsBanner: {
      borderRadius: adminChrome.radiusLg,
      backgroundColor: adminChrome.shell,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.accentMuted,
      overflow: 'hidden',
    },
    decisionsInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
    },
    decisionsIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: adminChrome.soft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    decisionsCopy: { flex: 1, gap: 2 },
    decisionsTitle: {
      fontFamily: adminType.display,
      fontSize: 15,
      fontWeight: '800',
      color: adminChrome.text,
    },
    decisionsSub: {
      fontFamily: adminType.body,
      fontSize: 12,
      color: adminChrome.textMuted,
    },
  });
}
