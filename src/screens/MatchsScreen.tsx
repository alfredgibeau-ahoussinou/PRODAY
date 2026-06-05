import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { TAB_BAR_CONTENT_INSET } from '../components/navigation/BottomTabBar';
import { spacing, radius } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import type { AppColors } from '../theme/universeTheme';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon } from '../components/ui/Icon';
import { ProposeMatchScreen } from './ProposeMatchScreen';
import { SearchMatchScreen } from './SearchMatchScreen';
import { CreateTeamEventScreen } from './CreateTeamEventScreen';
import { TeamEventDetailScreen } from './TeamEventDetailScreen';
import { useFriendlyMatches, useSeasonCalendar } from '../hooks/useAppData';
import { useAuth } from '../context/AuthContext';
import { useTabNavigation } from '../context/TabNavigationContext';
import { openSeasonCalendarItem } from '../utils/navigationDeepLink';
import { useTabNavigationActions } from '../hooks/useTabNavigationActions';
import { useMatchActions } from '../hooks/useMatchActions';
import {
  formatMatchDateTime,
  formatMatchTeams,
  matchStatusStyle,
} from '../utils/matchDisplay';
import {
  groupByMonth,
  formatCalendarDate,
  type SeasonCalendarItem,
} from '../utils/seasonCalendar';
import { EVENT_TYPE_LABELS } from '../models/TeamEvent';

type MatchView =
  | 'home'
  | 'propose'
  | 'search'
  | 'create_event'
  | 'event_detail';

type HomeTab = 'season' | 'matches';

export const MatchsScreen: React.FC = () => {
  const [view, setView] = useState<MatchView>('home');
  const [homeTab, setHomeTab] = useState<HomeTab>('season');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const { profile } = useAuth();
  const { pendingMatchsLink, clearPendingMatchs } = useTabNavigation();
  const navActions = useTabNavigationActions();
  const clubId = profile?.profile.club_id;
  const { items, loading: loadingCalendar, refresh: refreshCalendar } = useSeasonCalendar(
    profile?.uid,
    clubId
  );
  const { matches, loading: loadingMatches, refresh: refreshMatches } = useFriendlyMatches();
  const { acceptMatch, cancelMatch, markPlayed, canAccept } = useMatchActions(profile);
  const [myClubId, setMyClubId] = useState<string | null>(null);

  const canManageEvents =
    profile &&
    (profile.role === 'coach' ||
      profile.role === 'organizer' ||
      profile.role === 'agent' ||
      profile.role === 'club');

  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);

  useEffect(() => {
    setMyClubId(profile ? profile.profile.club_id ?? profile.uid : null);
  }, [profile]);

  useEffect(() => {
    if (!pendingMatchsLink) return;
    if (pendingMatchsLink.homeTab) setHomeTab(pendingMatchsLink.homeTab);
    if (pendingMatchsLink.eventId) {
      setSelectedEventId(pendingMatchsLink.eventId);
      setView('event_detail');
    }
    clearPendingMatchs();
  }, [pendingMatchsLink, clearPendingMatchs]);

  const monthGroups = useMemo(() => groupByMonth(items), [items]);

  const refreshAll = () => {
    refreshCalendar();
    refreshMatches();
  };

  if (view === 'propose') {
    return (
      <ProposeMatchScreen
        onBack={() => setView('home')}
        onCreated={() => {
          refreshAll();
          setView('home');
        }}
      />
    );
  }
  if (view === 'search') {
    return (
      <SearchMatchScreen
        onBack={() => setView('home')}
        onAccepted={refreshAll}
      />
    );
  }
  if (view === 'create_event' && canManageEvents) {
    return (
      <CreateTeamEventScreen
        onBack={() => setView('home')}
        onCreated={(id) => {
          refreshAll();
          setSelectedEventId(id);
          setView('event_detail');
        }}
      />
    );
  }
  if (view === 'event_detail' && selectedEventId) {
    return (
      <TeamEventDetailScreen
        eventId={selectedEventId}
        onBack={() => {
          setView('home');
          refreshAll();
        }}
      />
    );
  }

  const openCalendarItem = (item: SeasonCalendarItem) => {
    if (item.team_event_id) {
      setSelectedEventId(item.team_event_id);
      setView('event_detail');
      return;
    }
    openSeasonCalendarItem(item, navActions);
  };

  return (
    <ScrollView
      style={[styles.container, rootStyle]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        label="Saison"
        title="Calendrier & matchs"
        subtitle="Convocations, entraînements, détections et amicaux."
        showBrandLogo
      />

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, homeTab === 'season' && styles.tabActive]}
          onPress={() => setHomeTab('season')}
        >
          <Text style={[styles.tabText, homeTab === 'season' && styles.tabTextActive]}>
            Calendrier
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, homeTab === 'matches' && styles.tabActive]}
          onPress={() => setHomeTab('matches')}
        >
          <Text style={[styles.tabText, homeTab === 'matches' && styles.tabTextActive]}>
            Matchs amicaux
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickRow}>
        {canManageEvents && (
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setView('create_event')}
          >
            <View style={styles.actionIconWrap}>
              <Icon name="calendar" size={26} color={c.text} variant="filled" />
            </View>
            <Text style={styles.actionTitle}>Créer événement</Text>
            <Text style={styles.actionSub}>Convocation</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionCard} onPress={() => setView('propose')}>
          <View style={styles.actionIconWrap}>
            <Icon name="football" size={26} color={c.text} />
          </View>
          <Text style={styles.actionTitle}>Proposer match</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => setView('search')}>
          <View style={styles.actionIconWrap}>
            <Icon name="search" size={26} color={c.text} />
          </View>
          <Text style={styles.actionTitle}>Rechercher</Text>
        </TouchableOpacity>
      </View>

      {homeTab === 'season' ? (
        <>
          {loadingCalendar ? (
            <ActivityIndicator color={c.brand} style={styles.loader} />
          ) : items.length === 0 ? (
            <Text style={styles.empty}>
              Aucun événement à venir. Créez une convocation ou proposez un match amical.
            </Text>
          ) : (
            monthGroups.map((group) => (
              <View key={group.key} style={styles.monthBlock}>
                <Text style={styles.monthTitle}>{group.label}</Text>
                {group.items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.calCard}
                    onPress={() => openCalendarItem(item)}
                  >
                    <View style={styles.calCardTop}>
                      <Text style={styles.calKind}>
                        {item.kind === 'team_event' && item.event_type
                          ? EVENT_TYPE_LABELS[item.event_type]
                          : item.kind === 'friendly_match'
                            ? 'Match amical'
                            : 'Tournoi'}
                      </Text>
                      <Text style={styles.calDate}>{formatCalendarDate(item.starts_at)}</Text>
                    </View>
                    <Text style={styles.calTitle}>{item.title}</Text>
                    <Text style={styles.calSub}>
                      {item.subtitle} · {item.city}
                    </Text>
                    <Text style={styles.calLink}>
                      {item.team_event_id
                        ? 'Voir convocation →'
                        : item.friendly_match_id
                          ? 'Voir matchs amicaux →'
                          : item.tournament_id
                            ? 'Voir Arena →'
                            : 'Ouvrir →'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          )}
        </>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Matchs à venir</Text>
          {loadingMatches ? (
            <ActivityIndicator color={c.brand} style={styles.loader} />
          ) : matches.length === 0 ? (
            <Text style={styles.empty}>
              Aucun match. Proposez ou recherchez un match amical.
            </Text>
          ) : (
            matches.map((m) => {
              const st = matchStatusStyle(m.status, c);
              const isMine = myClubId != null && m.requester_club_id === myClubId;
              const showAccept = canAccept(m) && !isMine && profile;
              return (
                <View key={m.id} style={styles.matchCard}>
                  <Text style={styles.matchDate}>
                    {formatMatchDateTime(m.date, m.time_label)}
                  </Text>
                  <Text style={styles.matchTeams}>{formatMatchTeams(m)}</Text>
                  <Text style={styles.matchPlace}>
                    {m.city}
                    {m.level ? ` · ${m.level}` : ''}
                  </Text>
                  <View style={[styles.badge, { backgroundColor: st.bg }]}>
                    <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
                  </View>
                  <View style={styles.actions}>
                    {showAccept && (
                      <TouchableOpacity
                        style={styles.btnAccept}
                        onPress={() => acceptMatch(m, refreshMatches)}
                      >
                        <Text style={styles.btnAcceptText}>Accepter</Text>
                      </TouchableOpacity>
                    )}
                    {isMine && m.status === 'OPEN' && (
                      <TouchableOpacity
                        style={styles.btnCancel}
                        onPress={() => cancelMatch(m, refreshMatches)}
                      >
                        <Text style={styles.btnCancelText}>Annuler</Text>
                      </TouchableOpacity>
                    )}
                    {isMine && m.status === 'ACCEPTED' && (
                      <TouchableOpacity
                        style={styles.btnPlayed}
                        onPress={() => markPlayed(m, refreshMatches)}
                      >
                        <Text style={styles.btnPlayedText}>Marquer joué</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </>
      )}
    </ScrollView>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: TAB_BAR_CONTENT_INSET + spacing.lg },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  tabActive: { backgroundColor: c.ink, borderColor: c.ink },
  tabText: { fontWeight: '800', fontSize: 13, color: c.textSecondary },
  tabTextActive: { color: c.brandInverse },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  actionCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: c.border,
    minHeight: 96,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  actionTitle: { fontSize: 12, fontWeight: '900', color: c.text },
  actionSub: { fontSize: 10, color: c.textMuted, marginTop: 2 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.text,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  monthBlock: { marginBottom: spacing.lg },
  monthTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: c.accent,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    textTransform: 'capitalize',
  },
  calCard: {
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: c.border,
  },
  calCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  calKind: { fontSize: 11, fontWeight: '800', color: c.accent },
  calDate: { fontSize: 11, color: c.textMuted, fontWeight: '700' },
  calTitle: { fontSize: 16, fontWeight: '800', color: c.text },
  calSub: { fontSize: 13, color: c.textMuted, marginTop: 4 },
  calLink: { fontSize: 12, fontWeight: '800', color: c.accent, marginTop: spacing.sm },
  loader: { marginVertical: spacing.lg },
  empty: {
    color: c.textMuted,
    fontSize: 13,
    paddingHorizontal: spacing.lg,
    lineHeight: 20,
  },
  matchCard: {
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: c.border,
  },
  matchDate: { fontSize: 12, color: c.textMuted, fontWeight: '800', letterSpacing: 0.5 },
  matchTeams: { fontSize: 16, fontWeight: '700', color: c.text, marginTop: 4 },
  matchPlace: { fontSize: 13, color: c.textMuted, marginTop: 2 },
  badge: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  btnAccept: {
    backgroundColor: c.brand,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  btnAcceptText: { color: c.brandInverse, fontWeight: '800', fontSize: 13 },
  btnCancel: {
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  btnCancelText: { color: c.text, fontWeight: '800', fontSize: 13 },
  btnPlayed: {
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  btnPlayedText: { color: c.text, fontWeight: '800', fontSize: 13 },
  });
}
