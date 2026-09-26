import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { teamEventsService } from '../../services/teamEvents.service';
import type { TeamEvent } from '../../models/TeamEvent';
import { countRsvpYes, getPendingInviteeUids, isCoachMatchEvent } from '../../models/TeamEvent';
import { resolveLiveState, formatMatchScoreSourceLabel } from '../../utils/matchLive';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { useCoachTheme, useCoachThemedStyles } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { withAlpha } from '../../utils/coachTeamTheme';
import { proSemantic, PRO_DATA_VIOLET } from '../../theme/professionalDesign';
import { CoachText, CoachKpiRow } from '../../components/coach/coachPortalUi';
import { CoachScreenHeader } from '../../components/coach/CoachScreenHeader';
import { CoachMatchSummaryTab } from '../../components/coach/match/CoachMatchSummaryTab';
import { CoachEventAttendanceList } from '../../components/coach/match/CoachEventAttendanceList';
import { MatchHubLineupTab } from '../../components/matchs/hub/MatchHubLineupTab';
import { MatchHubLiveTab } from '../../components/matchs/hub/MatchHubLiveTab';
import { MatchHubStatsTab } from '../../components/matchs/hub/MatchHubStatsTab';
import { CoachMatchSkinProvider } from '../../components/matchs/matchCenterUi';
import { EventLineupScreen } from '../EventLineupScreen';
import { VeoMatchAssociateModal } from '../../components/video/VeoMatchAssociateModal';
import { PushScreenTransition } from '../../components/motion';
import { ProDayIntegratedVideoPlayer } from '../../components/video/ProDayIntegratedVideoPlayer';
import { clubCamerasService } from '../../services/clubCameras.service';
import type { ClubMatchVideo } from '../../models/ClubCameras';
import { filterCapturesForRole } from '../../utils/matchVideoVisibility';
import { Icon } from '../../components/ui/Icon';
import { spacing } from '../../theme/designTokens';
import {
  PlayerStatsRatingModal,
  type PlayerStatsRatingModalMode,
} from '../../components/coach/PlayerStatsRatingModal';
import { CoachMatchTalkPresentationModal } from '../../components/coach/match/CoachMatchTalkPresentationModal';
import { CoachShareConvocationModal } from '../../components/coach/convocation/CoachShareConvocationModal';
import { CoachQuickNoteModal } from '../../components/coach/notes/CoachQuickNoteModal';
import { CoachOrganizeFriendlyModal } from '../../components/coach/matches/CoachOrganizeFriendlyModal';
import {
  generateVeoAiMatchEvaluations,
  buildDraftStatFromProposal,
} from '../../services/veoAiMatchEvaluation.service';
import { usersService } from '../../services/users.service';
import type { User } from '../../models/User';
import type { PlayerMatchSheetStat } from '../../models/TeamEvent';
import {
  formatCoachRating,
  formatEvaluationSourceLabel,
  formatEvaluationStatusLabel,
} from '../../utils/coachEvaluationRatings';
import { PressableSpring } from '../../components/motion';
import { tabBarScrollInset } from '../../navigation/tabBarLayout';

type MatchFilter = 'all' | 'upcoming' | 'live' | 'completed';
type MatchTab = 'apercu' | 'composition' | 'presences' | 'evenements' | 'stats' | 'video';

const MATCH_TABS: { id: MatchTab; label: string }[] = [
  { id: 'apercu', label: 'Aperçu' },
  { id: 'composition', label: 'Composition' },
  { id: 'presences', label: 'Présences' },
  { id: 'evenements', label: 'Événements' },
  { id: 'stats', label: 'Stats & Notes' },
  { id: 'video', label: 'Vidéo' },
];

export const CoachLiveMatchCenterScreen: React.FC = () => {
  const profile = useSessionProfile();
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);

  const [matches, setMatches] = useState<TeamEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<MatchFilter>('all');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MatchTab>('apercu');

  // Subviews
  const [editingLineup, setEditingLineup] = useState(false);
  const [associateVeoOpen, setAssociateVeoOpen] = useState(false);
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [homeScoreInput, setHomeScoreInput] = useState('0');
  const [awayScoreInput, setAwayScoreInput] = useState('0');
  const [savingScore, setSavingScore] = useState(false);

  // Match video
  const [matchVideos, setMatchVideos] = useState<ClubMatchVideo[]>([]);
  const [videoLoading, setVideoLoading] = useState(false);

  // Members & Player Stats / Rating Modal
  const [members, setMembers] = useState<User[]>([]);
  const [evaluatingAi, setEvaluatingAi] = useState(false);
  const [aiResultNotice, setAiResultNotice] = useState<string | null>(null);
  const [publishingStats, setPublishingStats] = useState(false);
  const [ratingModalPlayer, setRatingModalPlayer] = useState<{
    uid: string;
    name: string;
    stat?: PlayerMatchSheetStat;
    mode: PlayerStatsRatingModalMode;
  } | null>(null);

  const [talkPresentationOpen, setTalkPresentationOpen] = useState(false);
  const [shareConvocationOpen, setShareConvocationOpen] = useState(false);
  const [quickNoteModalOpen, setQuickNoteModalOpen] = useState(false);
  const [organizeFriendlyOpen, setOrganizeFriendlyOpen] = useState(false);

  const loadMatches = useCallback(async () => {
    if (!profile?.uid) return;
    try {
      const clubId = profile.profile.club_id || undefined;
      const rows = await teamEventsService.listForUser(profile.uid, clubId);
      const matchRows = rows
        .filter((e) => isCoachMatchEvent(e))
        .sort((a, b) => b.starts_at.getTime() - a.starts_at.getTime());
      setMatches(matchRows);

      if (matchRows.length > 0) {
        setSelectedMatchId((prev) => {
          if (prev && matchRows.some((m) => m.id === prev)) return prev;
          const now = Date.now();
          const liveMatch = matchRows.find((m) => {
            const live = resolveLiveState(m);
            return live.status === 'live' || live.status === 'halftime';
          });
          if (liveMatch) return liveMatch.id;
          const upcoming = matchRows
            .slice()
            .reverse()
            .find((m) => m.starts_at.getTime() >= now);
          if (upcoming) return upcoming.id;
          return matchRows[0].id;
        });
      }
    } catch {
      // Ignored in offline preview
    } finally {
      setLoading(false);
    }
  }, [profile?.uid, profile?.profile.club_id]);

  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  const selectedMatch = useMemo(() => {
    if (!selectedMatchId) return matches[0] ?? null;
    return matches.find((m) => m.id === selectedMatchId) ?? matches[0] ?? null;
  }, [matches, selectedMatchId]);

  const selectedMatchLineup = useMemo(() => {
    if (!selectedMatch?.lineup?.slots) return { starterUids: [], subUids: [] };
    const starterUids = selectedMatch.lineup.slots
      .filter((s) => s.role === 'starter')
      .map((s) => s.uid);
    const subUids = selectedMatch.lineup.slots
      .filter((s) => s.role === 'sub')
      .map((s) => s.uid);
    return { starterUids, subUids };
  }, [selectedMatch?.lineup?.slots]);

  // Load video for selected match
  useEffect(() => {
    if (!selectedMatch?.club_id || !selectedMatch?.id) {
      setMatchVideos([]);
      return;
    }
    setVideoLoading(true);
    let active = true;
    void clubCamerasService
      .listVideosForEvent(selectedMatch.club_id, selectedMatch.id)
      .then((vids) => {
        if (!active) return;
        setMatchVideos(filterCapturesForRole(vids, profile?.role ?? 'coach'));
      })
      .catch(() => {
        if (active) setMatchVideos([]);
      })
      .finally(() => {
        if (active) setVideoLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedMatch?.club_id, selectedMatch?.id, profile?.role]);

  // Filtered match list for carousel / selector
  const filteredMatches = useMemo(() => {
    const now = Date.now();
    return matches.filter((m) => {
      const live = resolveLiveState(m);
      const isLive = live.status === 'live' || live.status === 'halftime';
      const isCompleted = m.match_report_finalized_at || m.starts_at.getTime() < now - 3 * 3600 * 1000;
      if (filter === 'live') return isLive;
      if (filter === 'upcoming') return !isLive && !isCompleted && m.starts_at.getTime() >= now;
      if (filter === 'completed') return isCompleted && !isLive;
      return true;
    });
  }, [matches, filter]);

  const activeLive = selectedMatch ? resolveLiveState(selectedMatch) : null;
  const isMatchLive = activeLive?.status === 'live' || activeLive?.status === 'halftime';
  const isMatchCompleted = Boolean(
    selectedMatch?.match_report_finalized_at ||
      (selectedMatch && selectedMatch.starts_at.getTime() < Date.now() - 3 * 3600 * 1000),
  );

  const openScoreModal = () => {
    if (!selectedMatch) return;
    setHomeScoreInput(String(selectedMatch.live_state?.home_score ?? 0));
    setAwayScoreInput(String(selectedMatch.live_state?.away_score ?? 0));
    setScoreModalOpen(true);
  };

  const handleSaveScore = async () => {
    if (!selectedMatch || !profile?.uid) return;
    const h = parseInt(homeScoreInput, 10);
    const a = parseInt(awayScoreInput, 10);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return;
    setSavingScore(true);
    try {
      await teamEventsService.updateMatchLiveState(
        selectedMatch.id,
        {
          home_score: h,
          away_score: a,
          status: isMatchCompleted ? 'finished' : isMatchLive ? 'live' : 'scheduled',
        },
        {
          user: profile,
          isAdmin: profile.role === 'coach',
        },
      );
      await loadMatches();
      setScoreModalOpen(false);
    } catch {
      // Offline fallback
    } finally {
      setSavingScore(false);
    }
  };

  // Load club members for roster names & positions
  useEffect(() => {
    const clubId = profile?.profile.club_id;
    if (!clubId) return;
    void usersService.listMembersByClubId(clubId).then(setMembers).catch(() => {});
  }, [profile?.profile.club_id]);

  // Derive all players involved in the selected match
  const matchRoster = useMemo(() => {
    if (!selectedMatch) return [];
    const map = new Map<string, { uid: string; name: string; role?: string; position?: string }>();

    selectedMatch.lineup?.slots?.forEach((s) => {
      map.set(s.uid, {
        uid: s.uid,
        name: s.display_name,
        role: s.role === 'starter' ? 'Titulaire' : 'Remplaçant',
        position: s.position_label,
      });
    });

    if (selectedMatch.player_match_stats) {
      Object.entries(selectedMatch.player_match_stats).forEach(([uid, stat]) => {
        if (!map.has(uid)) {
          map.set(uid, {
            uid,
            name: stat.player_name || 'Joueur',
            role: 'Effectif',
          });
        }
      });
    }

    if (selectedMatch.invitee_uids) {
      selectedMatch.invitee_uids.forEach((uid) => {
        if (!map.has(uid)) {
          const member = members.find((m) => m.uid === uid);
          map.set(uid, {
            uid,
            name: member?.display_name || 'Joueur',
            role: 'Convoqué',
            position: member?.profile?.position,
          });
        }
      });
    }

    return Array.from(map.values());
  }, [selectedMatch, members]);

  // Handle running Veo AI evaluation
  const handleRunVeoAiEvaluation = async () => {
    if (!selectedMatch || !profile?.uid) return;
    const video = matchVideos[0];
    setEvaluatingAi(true);
    setAiResultNotice(null);
    try {
      const result = generateVeoAiMatchEvaluations(selectedMatch, video, members);
      const existing = selectedMatch.player_match_stats ?? {};
      const newStatsMap: Record<string, PlayerMatchSheetStat> = {};

      Object.entries(result.proposals).forEach(([uid, proposal]) => {
        newStatsMap[uid] = buildDraftStatFromProposal(
          proposal,
          profile.uid,
          profile.display_name || 'Coach',
          existing[uid],
        );
      });

      await teamEventsService.batchUpdatePlayerMatchStats(selectedMatch.id, newStatsMap, {
        user: profile,
        isAdmin: profile.role === 'coach',
      });

      const totalCount = Object.keys(result.proposals).length;
      const protectedCount = result.manual_protected_count;
      setAiResultNotice(
        `Évaluation IA terminée : ${totalCount} propositions en brouillon staff. ${
          protectedCount > 0 ? `${protectedCount} saisie(s) manuelle(s) protégée(s) conservée(s).` : ''
        }`,
      );
      await loadMatches();
    } catch (err) {
      console.error('[CoachLiveMatchCenter] Veo AI evaluation error:', err);
    } finally {
      setEvaluatingAi(false);
    }
  };

  // Handle publishing all match stats
  const handlePublishAllStats = async () => {
    if (!selectedMatch || !profile?.uid) return;
    setPublishingStats(true);
    try {
      await teamEventsService.publishMatchStatsAndRatings(selectedMatch.id, {
        user: profile,
        isAdmin: profile.role === 'coach',
      });
      await loadMatches();
    } catch (err) {
      console.error('[CoachLiveMatchCenter] Publish stats error:', err);
    } finally {
      setPublishingStats(false);
    }
  };

  // Handle saving an individual player's stat / rating
  const handleSavePlayerStat = async (patch: Partial<PlayerMatchSheetStat>) => {
    if (!selectedMatch || !profile?.uid || !ratingModalPlayer) return;
    await teamEventsService.updatePlayerMatchStat(
      selectedMatch.id,
      ratingModalPlayer.uid,
      patch,
      {
        user: profile,
        isAdmin: profile.role === 'coach',
      },
    );
    await loadMatches();
  };

  if (loading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator color={tokens.accent} size="large" />
      </View>
    );
  }

  if (matches.length === 0) {
    return (
      <View style={styles.root}>
        <CoachScreenHeader title="Match Center" fallbackNavId="today" />
        <ScrollView
          style={styles.root}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.accent} />}
        >
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="soccer" size={40} color={tokens.muted} />
            <CoachText variant="section" style={{ marginTop: spacing.sm }}>
              Aucun match programmé
            </CoachText>
            <CoachText variant="body" muted style={styles.emptyBody}>
              Le Match Center centralise le score, la composition, les convocations, les événements de jeu et les vidéos Veo de vos rencontres.
            </CoachText>
            <PressableSpring
              onPress={() => setOrganizeFriendlyOpen(true)}
              style={[styles.primaryActionBtn, { marginTop: spacing.md, alignSelf: 'center' }]}
            >
              <MaterialCommunityIcons name="soccer" size={16} color={tokens.onAccent} />
              <CoachText variant="caption" style={[styles.actionBtnLabel, { color: tokens.onAccent, fontWeight: '800' }]}>
                Organiser un amical
              </CoachText>
            </PressableSpring>
          </View>
        </ScrollView>
        <CoachOrganizeFriendlyModal
          visible={organizeFriendlyOpen}
          onClose={() => setOrganizeFriendlyOpen(false)}
          onSuccess={() => void loadMatches()}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CoachScreenHeader title="Match Center" fallbackNavId="today" />
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.accent} />}
      >
        {/* Match Filter & Actions Row */}
        <View style={styles.topActionsRow}>
          <View style={styles.filterRow}>
            {(
              [
                { id: 'all', label: 'Tous' },
                { id: 'upcoming', label: 'À venir' },
                { id: 'live', label: 'En direct' },
                { id: 'completed', label: 'Terminés' },
              ] as { id: MatchFilter; label: string }[]
            ).map((item) => {
              const on = filter === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setFilter(item.id)}
                  style={[styles.filterChip, on && styles.filterChipActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                >
                  <CoachText variant="caption" style={[styles.filterLabel, on && styles.filterLabelActive]}>
                    {item.label}
                  </CoachText>
                </Pressable>
              );
            })}
          </View>
          <PressableSpring
            onPress={() => setOrganizeFriendlyOpen(true)}
            style={[
              styles.organizeHeaderBtn,
              { borderColor: tokens.accent, backgroundColor: withAlpha(tokens.accent, 0.1) },
            ]}
          >
            <MaterialCommunityIcons name="soccer" size={15} color={tokens.accent} />
            <CoachText variant="caption" style={{ fontWeight: '800', color: tokens.accent, marginLeft: 4 }}>
              Organiser un amical
            </CoachText>
          </PressableSpring>
        </View>

        {/* Horizontal Match Carousel */}
        {filteredMatches.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContainer}
          >
            {filteredMatches.map((m) => {
              const on = m.id === selectedMatchId;
              const live = resolveLiveState(m);
              const isL = live.status === 'live' || live.status === 'halftime';
              return (
                <Pressable
                  key={m.id}
                  onPress={() => setSelectedMatchId(m.id)}
                  style={[styles.carouselCard, on && styles.carouselCardActive]}
                  accessibilityRole="button"
                >
                  <View style={styles.carouselCardHeader}>
                    <CoachText variant="caption" muted style={{ fontSize: 10 }}>
                      {m.starts_at.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </CoachText>
                    {isL ? (
                      <View style={styles.liveDot} />
                    ) : null}
                  </View>
                  <CoachText variant="caption" numberOfLines={1} style={[styles.carouselTitle, on && { color: tokens.accent }]}>
                    {m.live_state?.opponent_name || m.title || 'Match'}
                  </CoachText>
                  <CoachText variant="caption" muted style={{ fontSize: 11 }}>
                    {m.live_state?.home_score != null && m.live_state?.away_score != null
                      ? `${m.live_state.home_score} - ${m.live_state.away_score}`
                      : m.starts_at.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </CoachText>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {/* Selected Match Hero Card */}
        {selectedMatch ? (
          <View style={styles.heroCard}>
            {/* Header / Competition */}
            <View style={styles.heroMetaRow}>
              <View style={styles.competitionBadge}>
                <Ionicons name="trophy-outline" size={12} color={tokens.accent} />
                <CoachText variant="caption" accent style={{ fontWeight: '700', fontSize: 11 }}>
                  {selectedMatch.competition_fixture_id ? 'Compétition officielle' : selectedMatch.event_type === 'competition' ? 'Compétition' : 'Match'}
                </CoachText>
              </View>
              {isMatchLive ? (
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <CoachText variant="caption" style={styles.liveBadgeText}>
                    EN DIRECT
                  </CoachText>
                </View>
              ) : isMatchCompleted ? (
                <View style={styles.completedBadge}>
                  <CoachText variant="caption" muted style={{ fontSize: 10, fontWeight: '700' }}>
                    TERMINÉ
                  </CoachText>
                </View>
              ) : (
                <View style={styles.upcomingBadge}>
                  <Feather name="clock" size={11} color={tokens.muted} />
                  <CoachText variant="caption" muted style={{ fontSize: 10 }}>
                    {selectedMatch.starts_at.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </CoachText>
                </View>
              )}
            </View>

            {/* Score & Matchup */}
            <View style={styles.scoreRow}>
              <View style={styles.teamCol}>
                <View style={styles.teamAvatar}>
                  <MaterialCommunityIcons name="shield" size={20} color={tokens.accent} />
                </View>
                <CoachText variant="body" numberOfLines={1} style={styles.teamName}>
                  {tokens.teamLabel || 'Mon Équipe'}
                </CoachText>
              </View>

              <View style={styles.scoreCenter}>
                {selectedMatch.live_state?.home_score != null && selectedMatch.live_state?.away_score != null ? (
                  <Pressable onPress={openScoreModal} accessibilityRole="button">
                    <CoachText variant="title" style={styles.scoreBig}>
                      {selectedMatch.live_state.home_score} - {selectedMatch.live_state.away_score}
                    </CoachText>
                  </Pressable>
                ) : (
                  <View style={styles.vsBox}>
                    <CoachText variant="body" style={styles.vsText}>
                      VS
                    </CoachText>
                  </View>
                )}
                <CoachText variant="caption" muted style={{ fontSize: 11 }}>
                  {formatCalendarDate(selectedMatch.starts_at)}
                </CoachText>
                {activeLive ? (
                  <CoachText variant="caption" muted style={{ fontSize: 10, marginTop: 2, textAlign: 'center' }}>
                    {formatMatchScoreSourceLabel(activeLive)}{activeLive.minute != null ? ` · ${activeLive.minute}'` : ''}
                  </CoachText>
                ) : null}
              </View>

              <View style={styles.teamCol}>
                <View style={[styles.teamAvatar, { backgroundColor: tokens.elevated }]}>
                  <MaterialCommunityIcons name="shield-outline" size={20} color={tokens.muted} />
                </View>
                <CoachText variant="body" numberOfLines={1} style={styles.teamName}>
                  {selectedMatch.live_state?.opponent_name || selectedMatch.title || 'Adversaire'}
                </CoachText>
              </View>
            </View>

            {/* Location & Venue */}
            {(selectedMatch.location_label || selectedMatch.city || selectedMatch.location) ? (
              <View style={styles.venueRow}>
                <Ionicons name="location-outline" size={13} color={tokens.muted} />
                <CoachText variant="caption" muted numberOfLines={1} style={{ flex: 1 }}>
                  {[selectedMatch.location_label, selectedMatch.city, selectedMatch.location].filter(Boolean).join(' · ')}
                </CoachText>
              </View>
            ) : null}

            {/* Contextual Action Bar */}
            <View style={styles.actionBar}>
              {!isMatchCompleted ? (
                <Pressable
                  onPress={() => setEditingLineup(true)}
                  style={styles.primaryActionBtn}
                  accessibilityRole="button"
                >
                  <Icon name="shirt" size={14} color={tokens.onAccent} />
                  <CoachText variant="caption" style={[styles.actionBtnLabel, { color: tokens.onAccent }]}>
                    Préparer la compo
                  </CoachText>
                </Pressable>
              ) : null}

              <Pressable
                onPress={openScoreModal}
                style={styles.secondaryActionBtn}
                accessibilityRole="button"
              >
                <Feather name="edit-2" size={14} color={tokens.foreground} />
                <CoachText variant="caption" style={styles.actionBtnLabel}>
                  {selectedMatch.live_state?.home_score != null ? 'Modifier score' : 'Saisir score'}
                </CoachText>
              </Pressable>

              <Pressable
                onPress={() => setAssociateVeoOpen(true)}
                style={styles.secondaryActionBtn}
                accessibilityRole="button"
              >
                <Icon name="videocam" size={14} color={tokens.foreground} />
                <CoachText variant="caption" style={styles.actionBtnLabel}>
                  Vidéo Veo
                </CoachText>
              </Pressable>

              <Pressable
                onPress={() => setTalkPresentationOpen(true)}
                style={styles.secondaryActionBtn}
                accessibilityRole="button"
                accessibilityLabel="Causerie Vestiaire"
              >
                <MaterialCommunityIcons name="presentation-play" size={14} color={tokens.accent} />
                <CoachText variant="caption" style={[styles.actionBtnLabel, { color: tokens.accent, fontWeight: '700' }]}>
                  Causerie
                </CoachText>
              </Pressable>

              <Pressable
                onPress={() => setQuickNoteModalOpen(true)}
                style={styles.secondaryActionBtn}
                accessibilityRole="button"
                accessibilityLabel="Note rapide"
              >
                <Feather name="file-text" size={14} color={tokens.foreground} />
                <CoachText variant="caption" style={styles.actionBtnLabel}>
                  Note
                </CoachText>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          {MATCH_TABS.map((tab) => {
            const on = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[styles.tabItem, on && styles.tabItemActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <CoachText
                  variant="caption"
                  style={[styles.tabLabel, on && styles.tabLabelActive]}
                >
                  {tab.label}
                </CoachText>
              </Pressable>
            );
          })}
        </View>

        {/* Tab Content */}
        {selectedMatch && profile ? (
          <CoachMatchSkinProvider enabled>
            {activeTab === 'apercu' && (
              <CoachMatchSummaryTab
                event={selectedMatch}
                profile={profile}
                onOpenChapter={(ch) => {
                  if (ch === 'composition') setActiveTab('composition');
                  else if (ch === 'effectif') setActiveTab('presences');
                  else if (ch === 'live') setActiveTab('evenements');
                }}
                onOpenVeoAssociate={() => setAssociateVeoOpen(true)}
              />
            )}

            {activeTab === 'composition' && (
              <View style={styles.tabContentCard}>
                <View style={styles.lineupHeaderRow}>
                  <CoachText variant="section">Composition & Remplaçants</CoachText>
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    <Pressable
                      onPress={() => setTalkPresentationOpen(true)}
                      style={[styles.editLineupBtn, { backgroundColor: withAlpha(tokens.accent, 0.14) }]}
                      accessibilityRole="button"
                      accessibilityLabel="Causerie Vestiaire"
                    >
                      <MaterialCommunityIcons name="presentation-play" size={13} color={tokens.accent} />
                      <CoachText variant="caption" accent style={{ fontWeight: '700' }}>
                        Causerie
                      </CoachText>
                    </Pressable>
                    <Pressable
                      onPress={() => setShareConvocationOpen(true)}
                      style={[styles.editLineupBtn, { backgroundColor: withAlpha(tokens.accent, 0.08) }]}
                      accessibilityRole="button"
                      accessibilityLabel="Partager la convocation"
                    >
                      <Ionicons name="share-social-outline" size={13} color={tokens.accent} />
                      <CoachText variant="caption" accent style={{ fontWeight: '700' }}>
                        Partager
                      </CoachText>
                    </Pressable>
                    <Pressable
                      onPress={() => setEditingLineup(true)}
                      style={styles.editLineupBtn}
                      accessibilityRole="button"
                    >
                      <Feather name="edit-2" size={13} color={tokens.accent} />
                      <CoachText variant="caption" accent style={{ fontWeight: '700' }}>
                        Modifier
                      </CoachText>
                    </Pressable>
                  </View>
                </View>
                <MatchHubLineupTab
                  event={selectedMatch}
                  canEdit={true}
                  onEditLineup={() => setEditingLineup(true)}
                />
              </View>
            )}

            {activeTab === 'presences' && (
              <View style={styles.tabContentCard}>
                <View style={styles.kpiWrap}>
                  <CoachKpiRow
                    items={[
                      { label: 'Confirmés', value: String(countRsvpYes(selectedMatch)) },
                      { label: 'En attente', value: String(getPendingInviteeUids(selectedMatch).length) },
                      { label: 'Pointés', value: String(Object.keys(selectedMatch.attendance_marks ?? {}).length) },
                    ]}
                  />
                </View>
                <CoachEventAttendanceList
                  event={selectedMatch}
                  profile={profile}
                  onUpdated={loadMatches}
                />
              </View>
            )}

            {activeTab === 'evenements' && (
              <View style={styles.tabContentCard}>
                <MatchHubLiveTab
                  event={selectedMatch}
                  profile={profile}
                  canManage={true}
                  reportLocked={false}
                  onUpdated={loadMatches}
                />
              </View>
            )}

            {activeTab === 'stats' && (
              <View style={styles.tabContentCard}>
                {/* Header with Actions */}
                <View style={styles.lineupHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <CoachText variant="section">Statistiques & Notations</CoachText>
                    <CoachText variant="caption" muted>
                      Saisie manuelle ou proposition IA depuis la captation Veo
                    </CoachText>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    {matchVideos.length > 0 ? (
                      <PressableSpring
                        onPress={handleRunVeoAiEvaluation}
                        style={[styles.aiEvalBtn, { backgroundColor: withAlpha(PRO_DATA_VIOLET, 0.15), borderColor: PRO_DATA_VIOLET }]}
                        disabled={evaluatingAi}
                        accessibilityRole="button"
                      >
                        {evaluatingAi ? (
                          <ActivityIndicator size="small" color={PRO_DATA_VIOLET} />
                        ) : (
                          <>
                            <Ionicons name="sparkles" size={13} color={PRO_DATA_VIOLET} />
                            <CoachText variant="caption" style={{ color: PRO_DATA_VIOLET, fontWeight: '700' }}>
                              Évaluation IA Veo
                            </CoachText>
                          </>
                        )}
                      </PressableSpring>
                    ) : null}

                    <PressableSpring
                      onPress={handlePublishAllStats}
                      style={[styles.publishBtn, { backgroundColor: tokens.accent }]}
                      disabled={publishingStats}
                      accessibilityRole="button"
                    >
                      {publishingStats ? (
                        <ActivityIndicator size="small" color={tokens.onAccent} />
                      ) : (
                        <>
                          <Ionicons name="eye-outline" size={13} color={tokens.onAccent} />
                          <CoachText variant="caption" style={{ color: tokens.onAccent, fontWeight: '700' }}>
                            Publier les notes
                          </CoachText>
                        </>
                      )}
                    </PressableSpring>
                  </View>
                </View>

                {/* AI Result Notice Banner */}
                {aiResultNotice ? (
                  <View style={styles.aiNoticeCard}>
                    <Ionicons name="checkmark-circle" size={16} color={proSemantic.success} />
                    <CoachText variant="caption" style={{ flex: 1, color: tokens.foreground }}>
                      {aiResultNotice}
                    </CoachText>
                    <Pressable onPress={() => setAiResultNotice(null)}
                      accessibilityRole="button"
                      accessibilityLabel="Fermer">
                      <Ionicons name="close" size={16} color={tokens.muted} />
                    </Pressable>
                  </View>
                ) : null}

                {/* KPI Summary */}
                {(() => {
                  const statsObj = selectedMatch.player_match_stats ?? {};
                  const statsList = Object.values(statsObj);
                  const evaluated = statsList.filter((s) => s.rating !== undefined || s.minutes_played !== undefined);
                  const rated = statsList.filter((s) => s.rating !== undefined);
                  const avg = rated.length > 0
                    ? rated.reduce((acc, s) => acc + (s.rating ?? 0), 0) / rated.length
                    : null;
                  const totalGoals = statsList.reduce((acc, s) => acc + (s.goals ?? 0), 0);
                  const totalAssists = statsList.reduce((acc, s) => acc + (s.assists ?? 0), 0);

                  return (
                    <View style={styles.kpiWrap}>
                      <CoachKpiRow
                        items={[
                          { label: 'Évalués', value: `${evaluated.length} / ${matchRoster.length}` },
                          { label: 'Note moyenne', value: avg !== null ? formatCoachRating(avg) : '—' },
                          { label: 'Buts', value: String(totalGoals) },
                          { label: 'Passes', value: String(totalAssists) },
                        ]}
                      />
                    </View>
                  );
                })()}

                {/* Player List */}
                <View style={styles.playerStatsList}>
                  {matchRoster.length === 0 ? (
                    <View style={styles.emptyStatsBox}>
                      <CoachText variant="caption" muted style={{ textAlign: 'center' }}>
                        Aucun joueur dans la composition ou convocation de ce match.
                      </CoachText>
                    </View>
                  ) : (
                    matchRoster.map((player) => {
                      const stat = selectedMatch.player_match_stats?.[player.uid];
                      const src = stat?.source ?? 'manual';
                      const st = stat?.status ?? 'published';
                      const isDraft = st === 'draft';
                      const srcColor =
                        src === 'ai_generated' ? PRO_DATA_VIOLET : src === 'coach_reviewed' ? proSemantic.success : tokens.accent;

                      return (
                        <View
                          key={player.uid}
                          style={[
                            styles.playerStatCard,
                            { backgroundColor: tokens.surface, borderColor: isDraft ? tokens.accent : tokens.border },
                          ]}
                        >
                          {/* Player Header */}
                          <View style={styles.playerCardHead}>
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <CoachText variant="body" style={{ fontWeight: '800', fontSize: 15 }}>
                                  {player.name}
                                </CoachText>
                                {player.role ? (
                                  <View style={styles.roleTag}>
                                    <CoachText variant="caption" muted style={{ fontSize: 10 }}>
                                      {player.role}
                                    </CoachText>
                                  </View>
                                ) : null}
                              </View>
                              {player.position ? (
                                <CoachText variant="caption" muted style={{ fontSize: 11 }}>
                                  {player.position}
                                </CoachText>
                              ) : null}
                            </View>

                            {/* Rating Display */}
                            <View style={styles.ratingBadge}>
                              <CoachText
                                variant="caption"
                                style={[
                                  styles.ratingBadgeVal,
                                  { color: stat?.rating !== undefined ? tokens.accent : tokens.muted },
                                ]}
                              >
                                {formatCoachRating(stat?.rating)}
                              </CoachText>
                            </View>
                          </View>

                          {/* Stats Metrics Line */}
                          <View style={styles.statsMetricsRow}>
                            <View style={styles.statPill}>
                              <CoachText variant="caption" muted style={styles.statPillLbl}>Temps</CoachText>
                              <CoachText variant="caption" style={styles.statPillVal}>
                                {stat?.minutes_played !== undefined ? `${stat.minutes_played}'` : '—'}
                              </CoachText>
                            </View>

                            <View style={styles.statPill}>
                              <CoachText variant="caption" muted style={styles.statPillLbl}>Buts</CoachText>
                              <CoachText variant="caption" style={styles.statPillVal}>
                                {stat?.goals ?? 0}
                              </CoachText>
                            </View>

                            <View style={styles.statPill}>
                              <CoachText variant="caption" muted style={styles.statPillLbl}>Passes</CoachText>
                              <CoachText variant="caption" style={styles.statPillVal}>
                                {stat?.assists ?? 0}
                              </CoachText>
                            </View>

                            <View style={styles.statPill}>
                              <CoachText variant="caption" muted style={styles.statPillLbl}>Cartons</CoachText>
                              <CoachText variant="caption" style={styles.statPillVal}>
                                {stat?.yellow_cards ? `${stat.yellow_cards}J ` : ''}
                                {stat?.red_cards ? '1R' : ''}
                                {!stat?.yellow_cards && !stat?.red_cards ? '0' : ''}
                              </CoachText>
                            </View>

                            {stat?.clean_sheet ? (
                              <View style={[styles.statPill, { backgroundColor: withAlpha(proSemantic.success, 0.15) }]}>
                                <CoachText variant="caption" style={{ color: proSemantic.success, fontWeight: '700', fontSize: 10 }}>
                                  Clean sheet
                                </CoachText>
                              </View>
                            ) : null}
                          </View>

                          {/* Provenance & Status Tags */}
                          <View style={styles.tagRow}>
                            <View style={[styles.sourceTag, { borderColor: srcColor, backgroundColor: withAlpha(srcColor, 0.1) }]}>
                              <CoachText variant="caption" style={{ color: srcColor, fontWeight: '700', fontSize: 10 }}>
                                {formatEvaluationSourceLabel(src)}
                              </CoachText>
                            </View>

                            <View style={[styles.statusTag, { borderColor: isDraft ? tokens.muted : proSemantic.success }]}>
                              <CoachText variant="caption" muted style={{ fontSize: 10, fontWeight: '700' }}>
                                {formatEvaluationStatusLabel(st)}
                              </CoachText>
                            </View>
                          </View>

                          {/* Coach observation / AI note */}
                          {stat?.rating_explanation ? (
                            <View style={styles.observationBox}>
                              <Ionicons name="chatbubble-ellipses-outline" size={12} color={tokens.muted} />
                              <CoachText variant="caption" muted numberOfLines={2} style={{ flex: 1, fontSize: 11 }}>
                                {stat.rating_explanation}
                              </CoachText>
                            </View>
                          ) : null}

                          {/* Actions: Modifier les statistiques & Ajouter ou modifier la note */}
                          <View style={styles.cardActionsRow}>
                            <PressableSpring
                              onPress={() =>
                                setRatingModalPlayer({
                                  uid: player.uid,
                                  name: player.name,
                                  stat,
                                  mode: 'stats',
                                })
                              }
                              style={styles.cardActionBtn}
                              accessibilityRole="button"
                            >
                              <Ionicons name="stats-chart-outline" size={13} color={tokens.foreground} />
                              <CoachText variant="caption" style={styles.cardActionBtnText}>
                                Modifier les statistiques
                              </CoachText>
                            </PressableSpring>

                            <PressableSpring
                              onPress={() =>
                                setRatingModalPlayer({
                                  uid: player.uid,
                                  name: player.name,
                                  stat,
                                  mode: 'rating',
                                })
                              }
                              style={[styles.cardActionBtn, { borderColor: tokens.accent }]}
                              accessibilityRole="button"
                            >
                              <Ionicons name="star-outline" size={13} color={tokens.accent} />
                              <CoachText variant="caption" accent style={{ fontWeight: '700' }}>
                                Ajouter ou modifier la note
                              </CoachText>
                            </PressableSpring>
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              </View>
            )}

            {activeTab === 'video' && (
              <View style={styles.tabContentCard}>
                <View style={styles.lineupHeaderRow}>
                  <CoachText variant="section">Captation & Vidéo Veo</CoachText>
                  <Pressable
                    onPress={() => setAssociateVeoOpen(true)}
                    style={styles.editLineupBtn}
                    accessibilityRole="button"
                  >
                    <Ionicons name="link-outline" size={13} color={tokens.accent} />
                    <CoachText variant="caption" accent style={{ fontWeight: '700' }}>
                      Associer une vidéo
                    </CoachText>
                  </Pressable>
                </View>

                {videoLoading ? (
                  <ActivityIndicator color={tokens.accent} style={{ padding: spacing.lg }} />
                ) : matchVideos.length > 0 && matchVideos[0].storage_url ? (
                  <View style={{ gap: spacing.md }}>
                    <ProDayIntegratedVideoPlayer
                      sourceUrl={matchVideos[0].storage_url}
                      title={matchVideos[0].title || selectedMatch.title}
                      userRole="coach"
                    />
                    <CoachText variant="caption" muted>
                      {matchVideos[0].title} · Synchronisé depuis la captation club.
                    </CoachText>
                  </View>
                ) : selectedMatch.public_watch_url ? (
                  <View style={{ gap: spacing.md }}>
                    <ProDayIntegratedVideoPlayer
                      sourceUrl={selectedMatch.public_watch_url}
                      title={selectedMatch.title}
                      userRole="coach"
                    />
                    <CoachText variant="caption" muted>
                      Lien vidéo associé : {selectedMatch.public_watch_url}
                    </CoachText>
                  </View>
                ) : (
                  <View style={styles.noVideoCard}>
                    <Icon name="videocam" size={28} color={tokens.muted} />
                    <CoachText variant="body" style={{ fontWeight: '600', marginTop: 6 }}>
                      Aucune vidéo associée à ce match
                    </CoachText>
                    <CoachText variant="caption" muted style={{ textAlign: 'center', lineHeight: 18 }}>
                      Associez une captation Veo Cam ou un flux vidéo pour accéder au visionnage et à l’analyse directement dans ProDay.
                    </CoachText>
                    <Pressable
                      onPress={() => setAssociateVeoOpen(true)}
                      style={[styles.primaryActionBtn, { marginTop: spacing.sm }]}
                      accessibilityRole="button"
                    >
                      <Ionicons name="add-circle-outline" size={14} color={tokens.onAccent} />
                      <CoachText variant="caption" style={[styles.actionBtnLabel, { color: tokens.onAccent }]}>
                        Associer une captation Veo
                      </CoachText>
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          </CoachMatchSkinProvider>
        ) : null}
      </ScrollView>

      {/* Lineup Editor Push Screen */}
      <PushScreenTransition active={editingLineup} backgroundColor={tokens.bg}>
        {editingLineup && selectedMatch ? (
          <EventLineupScreen
            eventId={selectedMatch.id}
            onBack={() => {
              setEditingLineup(false);
              void loadMatches();
            }}
          />
        ) : null}
      </PushScreenTransition>

      {/* Veo Associate Modal */}
      {selectedMatch?.club_id && profile ? (
        <VeoMatchAssociateModal
          visible={associateVeoOpen}
          clubId={selectedMatch.club_id}
          createdByUid={profile.uid}
          eventId={selectedMatch.id}
          eventTitle={selectedMatch.title}
          scheduledAt={selectedMatch.starts_at}
          onClose={() => setAssociateVeoOpen(false)}
          onSuccess={() => {
            setAssociateVeoOpen(false);
            void loadMatches();
          }}
        />
      ) : null}

      {/* Quick Score Modal */}
      <Modal visible={scoreModalOpen} transparent animationType="fade" onRequestClose={() => setScoreModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <CoachText variant="section">Saisie du score</CoachText>
              <Pressable onPress={() => setScoreModalOpen(false)}>
                <Icon name="close" size={18} color={tokens.muted} />
              </Pressable>
            </View>

            <View style={styles.modalScoreRow}>
              <View style={styles.modalScoreInputWrap}>
                <CoachText variant="caption" muted style={{ textAlign: 'center', marginBottom: 4 }}>
                  {tokens.teamLabel || 'Mon Équipe'}
                </CoachText>
                <TextInput
                  value={homeScoreInput}
                  onChangeText={setHomeScoreInput}
                  keyboardType="number-pad"
                  style={styles.modalScoreInput}
                />
              </View>

              <CoachText variant="title" style={{ marginTop: 20 }}>-</CoachText>

              <View style={styles.modalScoreInputWrap}>
                <CoachText variant="caption" muted style={{ textAlign: 'center', marginBottom: 4 }}>
                  {selectedMatch?.live_state?.opponent_name || selectedMatch?.title || 'Adversaire'}
                </CoachText>
                <TextInput
                  value={awayScoreInput}
                  onChangeText={setAwayScoreInput}
                  keyboardType="number-pad"
                  style={styles.modalScoreInput}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable onPress={() => setScoreModalOpen(false)} style={styles.modalCancelBtn}>
                <CoachText variant="caption" muted>Annuler</CoachText>
              </Pressable>
              <Pressable
                onPress={handleSaveScore}
                disabled={savingScore}
                style={[styles.modalSaveBtn, savingScore && { opacity: 0.6 }]}
              >
                {savingScore ? (
                  <ActivityIndicator size="small" color={tokens.onAccent} />
                ) : (
                  <CoachText variant="caption" style={{ color: tokens.onAccent, fontWeight: '700' }}>
                    Enregistrer le score
                  </CoachText>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Player Stats & Rating Modal */}
      {selectedMatch && ratingModalPlayer ? (
        <PlayerStatsRatingModal
          visible={ratingModalPlayer !== null}
          onClose={() => setRatingModalPlayer(null)}
          playerUid={ratingModalPlayer.uid}
          playerName={ratingModalPlayer.name}
          matchTitle={selectedMatch.title}
          matchDateLabel={formatCalendarDate(selectedMatch.starts_at)}
          initialStat={ratingModalPlayer.stat}
          initialMode={ratingModalPlayer.mode}
          onSave={handleSavePlayerStat}
        />
      ) : null}

      {/* Causerie Vestiaire Modal */}
      {selectedMatch && talkPresentationOpen ? (
        <CoachMatchTalkPresentationModal
          visible={talkPresentationOpen}
          onClose={() => setTalkPresentationOpen(false)}
          event={selectedMatch}
          lineup={selectedMatchLineup}
          members={members}
          coachProfile={profile ?? undefined}
        />
      ) : null}

      {/* Partage Convocation Modal */}
      {selectedMatch && shareConvocationOpen ? (
        <CoachShareConvocationModal
          visible={shareConvocationOpen}
          onClose={() => setShareConvocationOpen(false)}
          event={selectedMatch}
          members={members}
        />
      ) : null}

      {/* Note Rapide Staff Modal */}
      {selectedMatch && quickNoteModalOpen && profile ? (
        <CoachQuickNoteModal
          visible={quickNoteModalOpen}
          onClose={() => setQuickNoteModalOpen(false)}
          coachUid={profile.uid}
          clubId={profile.profile.club_id || 'proday_club'}
          teamId={selectedMatch.team_id || undefined}
          eventId={selectedMatch.id}
          sessionTitle={selectedMatch.title}
          players={members.map((m) => ({ uid: m.uid, name: m.display_name }))}
        />
      ) : null}

      <CoachOrganizeFriendlyModal
        visible={organizeFriendlyOpen}
        onClose={() => setOrganizeFriendlyOpen(false)}
        onSuccess={() => void loadMatches()}
      />
    </View>
  );
};

const createStyles = (tokens: CoachThemeTokens) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: tokens.bg,
    },
    centered: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      padding: 16,
      paddingBottom: tabBarScrollInset({ extra: spacing.xl }),
      gap: 14,
    },
    topActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 8,
    },
    organizeHeaderBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      borderWidth: 1,
    },
    emptyCard: {
      backgroundColor: tokens.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: tokens.border,
      padding: 32,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    emptyBody: {
      textAlign: 'center',
      maxWidth: 280,
      marginTop: 4,
    },
    filterRow: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 2,
    },
    filterChip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    filterChipActive: {
      backgroundColor: tokens.accent,
      borderColor: tokens.accent,
    },
    filterLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: tokens.muted,
    },
    filterLabelActive: {
      color: tokens.onAccent,
      fontWeight: '700',
    },
    carouselContainer: {
      gap: 10,
      paddingVertical: 4,
    },
    carouselCard: {
      width: 140,
      padding: 10,
      borderRadius: 12,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      gap: 4,
    },
    carouselCardActive: {
      borderColor: tokens.accent,
      backgroundColor: tokens.elevated,
    },
    carouselCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: proSemantic.danger,
    },
    carouselTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: tokens.foreground,
    },
    heroCard: {
      backgroundColor: tokens.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: tokens.border,
      padding: 16,
      gap: 14,
    },
    heroMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    competitionBadge: {
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 6,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    liveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 6,
      backgroundColor: withAlpha(proSemantic.danger, 0.15),
      borderWidth: 1,
      borderColor: proSemantic.danger,
    },
    liveBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: proSemantic.danger,
      letterSpacing: 0.5,
    },
    completedBadge: {
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 6,
      backgroundColor: withAlpha(proSemantic.success, 0.15),
      borderWidth: 1,
      borderColor: proSemantic.success,
    },
    upcomingBadge: {
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 6,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    teamCol: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
    },
    teamAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: withAlpha(tokens.accent, 0.2),
      alignItems: 'center',
      justifyContent: 'center',
    },
    teamName: {
      fontWeight: '700',
      textAlign: 'center',
    },
    scoreCenter: {
      alignItems: 'center',
      minWidth: 80,
    },
    scoreBig: {
      fontSize: 32,
      fontWeight: '900',
      letterSpacing: 2,
      color: tokens.foreground,
    },
    vsBox: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: tokens.surface,
    },
    vsText: {
      fontWeight: '800',
      color: tokens.muted,
    },
    venueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    actionBar: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: tokens.border,
    },
    primaryActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: tokens.accent,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 10,
    },
    actionBtnLabel: {
      fontWeight: '700',
    },
    secondaryActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
    },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: tokens.surface,
      borderRadius: 12,
      padding: 3,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    tabItem: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 9,
    },
    tabItemActive: {
      backgroundColor: tokens.elevated,
    },
    tabLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: tokens.muted,
    },
    tabLabelActive: {
      color: tokens.foreground,
      fontWeight: '700',
    },
    tabContentCard: {
      backgroundColor: tokens.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: tokens.border,
      padding: 14,
      gap: 12,
    },
    lineupHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    editLineupBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 8,
      backgroundColor: withAlpha(tokens.accent, 0.12),
      borderWidth: 1,
      borderColor: withAlpha(tokens.accent, 0.3),
    },
    kpiWrap: {
      paddingVertical: 4,
    },
    noVideoCard: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      gap: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: withAlpha(tokens.bg, 0.85),
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    modalCard: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: tokens.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: tokens.border,
      padding: 20,
      gap: 16,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalScoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
    },
    modalScoreInputWrap: {
      alignItems: 'center',
      width: 90,
    },
    modalScoreInput: {
      width: 70,
      height: 50,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.surface,
      textAlign: 'center',
      fontSize: 24,
      fontWeight: '800',
      color: tokens.foreground,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 10,
    },
    modalCancelBtn: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 8,
      backgroundColor: tokens.surface,
    },
    modalSaveBtn: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 8,
      backgroundColor: tokens.accent,
    },
    aiEvalBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
    },
    publishBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
    },
    aiNoticeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 10,
      borderRadius: 10,
      backgroundColor: withAlpha(proSemantic.success, 0.12),
      borderWidth: 1,
      borderColor: withAlpha(proSemantic.success, 0.3),
    },
    playerStatsList: {
      gap: 10,
      marginTop: 6,
    },
    emptyStatsBox: {
      padding: 20,
      alignItems: 'center',
    },
    playerStatCard: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 12,
      gap: 8,
    },
    playerCardHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    roleTag: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: tokens.elevated,
    },
    ratingBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: tokens.elevated,
    },
    ratingBadgeVal: {
      fontWeight: '900',
      fontSize: 14,
    },
    statsMetricsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
    },
    statPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: tokens.elevated,
    },
    statPillLbl: {
      fontSize: 10,
    },
    statPillVal: {
      fontSize: 11,
      fontWeight: '700',
    },
    tagRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    sourceTag: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      borderWidth: 1,
    },
    statusTag: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      borderWidth: 1,
      backgroundColor: tokens.elevated,
    },
    observationBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      padding: 8,
      borderRadius: 6,
      backgroundColor: tokens.elevated,
    },
    cardActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 2,
    },
    cardActionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingVertical: 7,
      paddingHorizontal: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.elevated,
    },
    cardActionBtnText: {
      fontSize: 11,
      fontWeight: '600',
    },
  });
