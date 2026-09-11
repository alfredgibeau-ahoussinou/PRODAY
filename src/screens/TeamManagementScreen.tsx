import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { PressableSpring, PushScreenTransition } from '../components/motion';
import { Icon } from '../components/ui/Icon';
import { ProDayText } from '../components/ui/ProDayText';
import type { User } from '../models/User';
import type { PlayerMatchSheetStat, TeamEvent } from '../models/TeamEvent';
import { countRsvpYes, getPendingInviteeUids } from '../models/TeamEvent';
import { teamEventsService } from '../services/teamEvents.service';
import { usersService } from '../services/users.service';
import { membershipsService } from '../services/memberships.service';
import type { Membership } from '../models/Membership';
import {
  TEAM_STAFF_ROLE_LABELS,
  type TeamStaffMember,
  type TeamStaffRole,
} from '../models/TeamStaffMember';
import { teamStaffService } from '../services/teamStaff.service';
import { isOrganizerCapable } from '../utils/roleCapabilities';
import { userCanManageConvocations } from '../utils/clubFeatureAccess';
import { useAuth } from '../context/AuthContext';
import { TeamEventDetailScreen } from './TeamEventDetailScreen';
import { CreateTeamEventScreen } from './CreateTeamEventScreen';
import { JoinClubScreen } from './JoinClubScreen';
import { useTabNavigation } from '../context/TabNavigationContext';
import { EventAttendancePanel } from '../components/team/EventAttendancePanel';
import { CarpoolBalanceTable } from '../components/team/CarpoolBalanceTable';
import { aggregateCarpoolBalance } from '../utils/carpoolBalance';
import { radius, spacing } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import { useCoachShellNav } from '../features/coach/shell/CoachShellNavContext';
import { useCoachTheme } from '../features/coach/shell/CoachThemeContext';
import { TAB_BAR_CONTENT_INSET } from '../navigation/tabBarLayout';

type TeamTab = 'roster' | 'planning' | 'attendance' | 'stats';
type HubView = 'hub' | 'event' | 'create' | 'join' | 'announcements' | 'club';

interface TeamManagementScreenProps {
  profile: User;
  onBack: () => void;
}

export const TeamManagementScreen: React.FC<TeamManagementScreenProps> = ({
  profile,
  onBack,
}) => {
  const { isAdmin } = useAuth();
  const { openChat, setActiveTab } = useTabNavigation();
  const { isWoman } = useThemedScreen();
  const shellNav = useCoachShellNav();
  const { tokens } = useCoachTheme();

  const [hubView, setHubView] = useState<HubView>(profile.profile.club_id ? 'hub' : 'join');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [attendanceEventId, setAttendanceEventId] = useState<string | null>(null);
  const [tab, setTab] = useState<TeamTab>('roster');
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [membersCount, setMembersCount] = useState(0);
  const [members, setMembers] = useState<User[]>([]);
  const [pendingMemberships, setPendingMemberships] = useState<Membership[]>([]);
  const [seasonEvents, setSeasonEvents] = useState<TeamEvent[]>([]);
  const [selectedStatUid, setSelectedStatUid] = useState<string | null>(null);
  const [playerSearch, setPlayerSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [invitingUid, setInvitingUid] = useState<string | null>(null);
  const [staff, setStaff] = useState<TeamStaffMember[]>([]);
  const [staffUid, setStaffUid] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState<TeamStaffRole>('assistant');

  const clubId = profile.profile.club_id;
  const canManageRoster = isOrganizerCapable(profile.role) || isAdmin;
  const canCreateConvocations = userCanManageConvocations(profile) || Boolean(isAdmin);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listEvents, membersList, clubSeasonEvents, pending, staffRows] = await Promise.all([
        teamEventsService.listForUser(profile.uid, clubId),
        clubId ? usersService.listMembersByClubId(clubId) : Promise.resolve([]),
        clubId ? teamEventsService.listForClub(clubId, 120) : Promise.resolve([]),
        clubId && canManageRoster
          ? membershipsService.listByClub(clubId, 'pending')
          : Promise.resolve([]),
        clubId ? teamStaffService.listForClub(clubId) : Promise.resolve([]),
      ]);
      setEvents(listEvents);
      setMembersCount(membersList.length);
      setMembers(membersList);
      setPendingMemberships(pending);
      setStaff(staffRows);
      setSeasonEvents(clubSeasonEvents);
      if (!selectedStatUid && membersList[0]) setSelectedStatUid(membersList[0].uid);
    } finally {
      setLoading(false);
    }
  }, [profile.uid, clubId, selectedStatUid, canManageRoster]);

  useEffect(() => {
    void load();
  }, [load]);

  const eventStats = useMemo(() => {
    const convocation = events.filter((e) => e.event_type === 'friendly').length;
    const training = events.filter((e) => e.event_type === 'training').length;
    const yes = events.reduce(
      (acc, e) => acc + Object.values(e.rsvps).filter((s) => s === 'yes').length,
      0,
    );
    const pending = events.reduce(
      (acc, e) => acc + Object.values(e.rsvps).filter((s) => s === 'pending').length,
      0,
    );
    return { convocation, training, yes, pending };
  }, [events]);

  const carpoolBalance = useMemo(
    () => aggregateCarpoolBalance(seasonEvents),
    [seasonEvents],
  );

  const topStats = useMemo(() => {
    const goals = new Map<string, number>();
    const assists = new Map<string, number>();
    for (const e of events) {
      for (const a of e.live_actions ?? []) {
        if (a.type === 'goal') goals.set(a.player_name, (goals.get(a.player_name) ?? 0) + 1);
        if (a.type === 'assist') assists.set(a.player_name, (assists.get(a.player_name) ?? 0) + 1);
      }
    }
    const topGoals = [...goals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    const topAssists = [...assists.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    return { topGoals, topAssists };
  }, [events]);

  const attendanceEvent =
    events.find((e) => e.id === attendanceEventId) ??
    events.find((e) => e.invitee_uids.length > 0);
  const editableAttendanceEvent = attendanceEvent;
  const statsEvent = events.find((e) => e.event_type === 'friendly' || e.event_type === 'training');

  const statPlayers = useMemo(() => {
    if (!statsEvent) return [];
    return statsEvent.invitee_uids
      .map((uid) => members.find((m) => m.uid === uid))
      .filter((u): u is User => Boolean(u));
  }, [statsEvent, members]);
  const selectedStatPlayer = statPlayers.find((p) => p.uid === selectedStatUid) ?? statPlayers[0];

  const handleMembershipDecision = async (membershipId: string, approve: boolean) => {
    try {
      if (approve) {
        await membershipsService.approve(membershipId, profile.uid);
      } else {
        await membershipsService.reject(membershipId, profile.uid);
      }
      await load();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Action impossible.');
    }
  };

  const searchPlayers = async () => {
    if (!playerSearch.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const players = await usersService.listPlayers(playerSearch.trim());
      const memberUids = new Set(members.map((m) => m.uid));
      const pendingUids = new Set(pendingMemberships.map((m) => m.player_uid));
      setSearchResults(
        players.filter((p) => !memberUids.has(p.uid) && !pendingUids.has(p.uid)).slice(0, 8),
      );
    } finally {
      setSearchLoading(false);
    }
  };

  const handleInvitePlayer = async (player: User) => {
    if (!clubId) return;
    setInvitingUid(player.uid);
    try {
      await membershipsService.invitePlayer({
        club_id: clubId,
        player_uid: player.uid,
        player_name: player.display_name,
        invited_by_uid: profile.uid,
      });
      Alert.alert('Invitation envoyée', `${player.display_name} doit accepter l'affiliation.`);
      setPlayerSearch('');
      setSearchResults([]);
      await load();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Invitation impossible.');
    } finally {
      setInvitingUid(null);
    }
  };

  const handleAddStaff = async () => {
    if (!clubId || !staffUid.trim()) return;
    try {
      await teamStaffService.add({
        club_id: clubId,
        uid: staffUid.trim(),
        display_name: staffName.trim() || staffUid.trim(),
        staff_role: staffRole,
      });
      setStaffUid('');
      setStaffName('');
      setStaff(await teamStaffService.listForClub(clubId));
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible d’ajouter le staff.');
    }
  };

  const updateSelectedStat = async (patch: Partial<PlayerMatchSheetStat>) => {
    if (statsEvent?.match_report_finalized_at) {
      Alert.alert('Rapport verrouillé', 'Le rapport validé est en lecture seule.');
      return;
    }
    if (!statsEvent || !selectedStatPlayer) return;
    const current = statsEvent.player_match_stats?.[selectedStatPlayer.uid];
    await teamEventsService.updatePlayerMatchStat(
      statsEvent.id,
      selectedStatPlayer.uid,
      {
        player_name: selectedStatPlayer.display_name,
        minutes_played: current?.minutes_played ?? 0,
        rating: current?.rating ?? 6,
        goals: current?.goals ?? 0,
        assists: current?.assists ?? 0,
        yellow_cards: current?.yellow_cards ?? 0,
        red_cards: current?.red_cards ?? 0,
        ...patch,
      },
      { user: profile, isAdmin },
    );
    await load();
  };

  const finalizeReport = async () => {
    if (!statsEvent) return;
    await teamEventsService.setMatchReportFinalized(statsEvent.id, true, {
      user: profile,
      isAdmin,
    });
    await load();
    Alert.alert('Rapport validé', 'Le rapport d’après-match est figé et partageable.');
  };

  const formatCalendarDate = (date: Date) => date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  let subView: React.ReactNode = null;
  if (hubView === 'create' && canCreateConvocations) {
    subView = (
      <CreateTeamEventScreen
        onBack={() => setHubView('hub')}
        onCreated={(id) => {
          setSelectedEventId(id);
          setHubView('event');
        }}
      />
    );
  } else if (hubView === 'event' && selectedEventId) {
    subView = (
      <TeamEventDetailScreen
        eventId={selectedEventId}
        onBack={() => {
          setHubView('hub');
          void load();
        }}
      />
    );
  }

  const joinAsRoot = hubView === 'join' && !clubId;

  return (
    <>
      {joinAsRoot ? (
        <JoinClubScreen
          profile={profile}
          onBack={onBack}
          onJoined={() => {
            setHubView('hub');
            void load();
          }}
        />
      ) : (
        <View style={styles.root}>
          <View style={styles.headerRow}>
            <PressableSpring
              style={styles.backBtn}
              onPress={onBack}
              scaleTo={0.92}
              haptic
            >
              <Icon name="arrow-back" size={20} color="#FFFFFF" />
            </PressableSpring>
            <View style={styles.headerTitles}>
              <ProDayText variant="title" style={styles.headerMainTitle}>
                Gestion de l'équipe
              </ProDayText>
              <ProDayText variant="caption" style={styles.headerSub}>
                {profile.profile.club_id ? `Club rattaché · ${membersCount} joueurs` : 'Configuration équipe'}
              </ProDayText>
            </View>
          </View>

          <View style={styles.tabsRow}>
            <PressableSpring
              style={[styles.tabPill, tab === 'roster' && styles.tabPillActive]}
              onPress={() => setTab('roster')}
              scaleTo={0.95}
            >
              <Icon name="people" size={13} color={tab === 'roster' ? '#000000' : '#8B8B9A'} />
              <ProDayText
                variant="caption"
                style={[styles.tabPillText, tab === 'roster' && styles.tabPillTextActive]}
              >
                Effectif ({membersCount})
              </ProDayText>
            </PressableSpring>

            <PressableSpring
              style={[styles.tabPill, tab === 'planning' && styles.tabPillActive]}
              onPress={() => setTab('planning')}
              scaleTo={0.95}
            >
              <Icon name="calendar" size={13} color={tab === 'planning' ? '#000000' : '#8B8B9A'} />
              <ProDayText
                variant="caption"
                style={[styles.tabPillText, tab === 'planning' && styles.tabPillTextActive]}
              >
                Convocations
              </ProDayText>
            </PressableSpring>

            <PressableSpring
              style={[styles.tabPill, tab === 'attendance' && styles.tabPillActive]}
              onPress={() => setTab('attendance')}
              scaleTo={0.95}
            >
              <Icon name="checkmark-circle" size={13} color={tab === 'attendance' ? '#000000' : '#8B8B9A'} />
              <ProDayText
                variant="caption"
                style={[styles.tabPillText, tab === 'attendance' && styles.tabPillTextActive]}
              >
                Présences
              </ProDayText>
            </PressableSpring>

            <PressableSpring
              style={[styles.tabPill, tab === 'stats' && styles.tabPillActive]}
              onPress={() => setTab('stats')}
              scaleTo={0.95}
            >
              <Icon name="stats-chart" size={13} color={tab === 'stats' ? '#000000' : '#8B8B9A'} />
              <ProDayText
                variant="caption"
                style={[styles.tabPillText, tab === 'stats' && styles.tabPillTextActive]}
              >
                Stats & Bilan
              </ProDayText>
            </PressableSpring>
          </View>

          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xxl }]}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={tokens.accent} />
              </View>
            ) : null}

            {!loading && tab === 'roster' ? (
              <>
                {canManageRoster && pendingMemberships.length > 0 ? (
                  <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                      <Icon name="alert-circle" size={16} color="#F59E0B" />
                      <ProDayText variant="section" style={styles.cardSectionTitle}>
                        Demandes d'affiliation ({pendingMemberships.length})
                      </ProDayText>
                    </View>

                    {pendingMemberships.map((m) => (
                      <View key={m.id} style={styles.pendingRow}>
                        <View style={{ flex: 1 }}>
                          <ProDayText variant="section" style={styles.rowPlayerName}>
                            {m.player_name}
                          </ProDayText>
                          <ProDayText variant="caption" style={styles.rowSubText}>
                            Demandé le {m.requested_at.toLocaleDateString('fr-FR')}
                          </ProDayText>
                        </View>
                        <View style={styles.pendingActionBtns}>
                          <PressableSpring
                            style={[styles.actionBtnApprove, { backgroundColor: tokens.accent }]}
                            onPress={() => void handleMembershipDecision(m.id, true)}
                            scaleTo={0.95}
                            haptic
                          >
                            <ProDayText variant="caption" style={styles.actionBtnApproveText}>
                              Valider
                            </ProDayText>
                          </PressableSpring>
                          <PressableSpring
                            style={styles.actionBtnReject}
                            onPress={() => void handleMembershipDecision(m.id, false)}
                            scaleTo={0.95}
                            haptic
                          >
                            <ProDayText variant="caption" style={styles.actionBtnRejectText}>
                              Refuser
                            </ProDayText>
                          </PressableSpring>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}

                {canManageRoster && clubId ? (
                  <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                      <Icon name="people" size={16} color={tokens.accent} />
                      <ProDayText variant="section" style={styles.cardSectionTitle}>
                        Inviter un joueur au club
                      </ProDayText>
                    </View>
                    <ProDayText variant="caption" style={styles.cardBodyText}>
                      Recherchez un joueur sur la plateforme ProDay pour lui proposer une affiliation.
                    </ProDayText>

                    <View style={styles.searchRow}>
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Nom ou prénom du joueur..."
                        placeholderTextColor="#6B6B7F"
                        value={playerSearch}
                        onChangeText={setPlayerSearch}
                        onSubmitEditing={() => void searchPlayers()}
                        returnKeyType="search"
                      />
                      <PressableSpring
                        style={[styles.searchBtn, { backgroundColor: tokens.accent }]}
                        onPress={() => void searchPlayers()}
                        disabled={searchLoading}
                        scaleTo={0.95}
                        haptic
                      >
                        {searchLoading ? (
                          <ActivityIndicator size="small" color="#000000" />
                        ) : (
                          <ProDayText variant="caption" style={styles.searchBtnText}>
                            Rechercher
                          </ProDayText>
                        )}
                      </PressableSpring>
                    </View>

                    {searchResults.map((player) => (
                      <View key={player.uid} style={styles.searchResultItem}>
                        <View style={{ flex: 1 }}>
                          <ProDayText variant="section" style={styles.rowPlayerName}>
                            {player.display_name}
                          </ProDayText>
                          <ProDayText variant="caption" style={styles.rowSubText}>
                            {[player.profile.position, player.city].filter(Boolean).join(' · ')}
                          </ProDayText>
                        </View>
                        <PressableSpring
                          style={[styles.inviteBtn, { backgroundColor: tokens.accent }]}
                          onPress={() => void handleInvitePlayer(player)}
                          disabled={invitingUid === player.uid}
                          scaleTo={0.95}
                          haptic
                        >
                          <ProDayText variant="caption" style={styles.inviteBtnText}>
                            Inviter
                          </ProDayText>
                        </PressableSpring>
                      </View>
                    ))}
                  </View>
                ) : null}

                <View style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <Icon name="shield" size={16} color="#8B5CF6" />
                    <ProDayText variant="section" style={styles.cardSectionTitle}>
                      Staff technique & Encadrement
                    </ProDayText>
                  </View>

                  {staff.map((s) => (
                    <View key={s.id} style={styles.staffItem}>
                      <View style={{ flex: 1 }}>
                        <ProDayText variant="section" style={styles.rowPlayerName}>
                          {s.display_name}
                        </ProDayText>
                        <ProDayText variant="caption" style={styles.rowSubText}>
                          {TEAM_STAFF_ROLE_LABELS[s.staff_role]}
                        </ProDayText>
                      </View>
                    </View>
                  ))}

                  {staff.length === 0 ? (
                    <ProDayText variant="caption" style={styles.emptyText}>
                      Aucun membre de staff assigné.
                    </ProDayText>
                  ) : null}

                  {canManageRoster ? (
                    <View style={styles.addStaffBox}>
                      <TextInput
                        style={styles.addStaffInput}
                        placeholder="Nom du membre staff"
                        placeholderTextColor="#6B6B7F"
                        value={staffName}
                        onChangeText={setStaffName}
                      />
                      <TextInput
                        style={styles.addStaffInput}
                        placeholder="Identifiant UID ProDay"
                        placeholderTextColor="#6B6B7F"
                        value={staffUid}
                        onChangeText={setStaffUid}
                      />
                      <View style={styles.rolesGrid}>
                        {(['assistant', 'analyst', 'physio', 'coach'] as TeamStaffRole[]).map((r) => (
                          <PressableSpring
                            key={r}
                            onPress={() => setStaffRole(r)}
                            scaleTo={0.96}
                            style={[
                              styles.roleChip,
                              staffRole === r && { backgroundColor: `${tokens.accent}25`, borderColor: tokens.accent },
                            ]}
                          >
                            <ProDayText
                              variant="caption"
                              style={[
                                styles.roleChipText,
                                staffRole === r && { color: tokens.accent, fontWeight: '800' },
                              ]}
                            >
                              {TEAM_STAFF_ROLE_LABELS[r]}
                            </ProDayText>
                          </PressableSpring>
                        ))}
                      </View>
                      <PressableSpring
                        style={[styles.addStaffBtn, { backgroundColor: tokens.accent }]}
                        onPress={() => void handleAddStaff()}
                        scaleTo={0.96}
                        haptic
                      >
                        <ProDayText variant="caption" style={styles.addStaffBtnText}>
                          Ajouter au staff
                        </ProDayText>
                      </PressableSpring>
                    </View>
                  ) : null}
                </View>

                <View style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <Icon name="people" size={16} color={tokens.accent} />
                    <ProDayText variant="section" style={styles.cardSectionTitle}>
                      Effectif licencié ({membersCount})
                    </ProDayText>
                  </View>

                  {members.map((m) => (
                    <View key={m.uid} style={styles.playerItemRow}>
                      <View style={styles.playerAvatar}>
                        <Icon name="person" size={16} color={tokens.accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ProDayText variant="section" style={styles.rowPlayerName}>
                          {m.display_name}
                        </ProDayText>
                        <ProDayText variant="caption" style={styles.rowSubText}>
                          {[m.profile?.position, m.profile?.category].filter(Boolean).join(' · ') || 'Joueur'}
                        </ProDayText>
                      </View>
                      {m.uid === profile.uid ? (
                        <View style={styles.youBadge}>
                          <ProDayText variant="caption" style={styles.youBadgeText}>
                            Vous
                          </ProDayText>
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            {!loading && tab === 'planning' ? (
              <>
                <View style={styles.kpiCardsRow}>
                  <View style={styles.kpiCard}>
                    <ProDayText variant="title" style={styles.kpiVal}>
                      {eventStats.convocation}
                    </ProDayText>
                    <ProDayText variant="caption" style={styles.kpiLbl}>
                      Matchs
                    </ProDayText>
                  </View>
                  <View style={styles.kpiCard}>
                    <ProDayText variant="title" style={[styles.kpiVal, { color: '#10B981' }]}>
                      {eventStats.yes}
                    </ProDayText>
                    <ProDayText variant="caption" style={styles.kpiLbl}>
                      Confirmés
                    </ProDayText>
                  </View>
                  <View style={styles.kpiCard}>
                    <ProDayText variant="title" style={[styles.kpiVal, { color: '#F59E0B' }]}>
                      {eventStats.pending}
                    </ProDayText>
                    <ProDayText variant="caption" style={styles.kpiLbl}>
                      En attente
                    </ProDayText>
                  </View>
                </View>

                {canCreateConvocations ? (
                  <PressableSpring
                    style={[styles.primaryCreateBtn, { backgroundColor: tokens.accent }]}
                    onPress={() => setHubView('create')}
                    scaleTo={0.97}
                    haptic
                  >
                    <Icon name="add" size={18} color="#000000" />
                    <ProDayText variant="section" style={styles.primaryCreateBtnText}>
                      Créer une nouvelle convocation
                    </ProDayText>
                  </PressableSpring>
                ) : null}

                <View style={styles.card}>
                  <ProDayText variant="section" style={styles.cardSectionTitle}>
                    Historique des convocations
                  </ProDayText>

                  {events.slice(0, 10).map((e) => {
                    const yes = countRsvpYes(e);
                    const pending = getPendingInviteeUids(e).length;
                    return (
                      <PressableSpring
                        key={e.id}
                        style={styles.eventRow}
                        onPress={() => {
                          setSelectedEventId(e.id);
                          setHubView('event');
                        }}
                        scaleTo={0.98}
                        haptic
                      >
                        <View style={{ flex: 1 }}>
                          <ProDayText variant="section" style={styles.rowPlayerName}>
                            {e.title}
                          </ProDayText>
                          <ProDayText variant="caption" style={styles.rowSubText}>
                            {formatCalendarDate(e.starts_at)} {e.city ? `· ${e.city}` : ''}
                          </ProDayText>
                        </View>
                        <View style={styles.eventRsvpBadge}>
                          <ProDayText variant="caption" style={styles.eventRsvpBadgeText}>
                            {yes} confirmés · {pending} en attente
                          </ProDayText>
                          <Icon name="chevron-forward" size={14} color="#8B8B9A" />
                        </View>
                      </PressableSpring>
                    );
                  })}

                  {events.length === 0 ? (
                    <ProDayText variant="caption" style={styles.emptyText}>
                      Aucun événement convoqué.
                    </ProDayText>
                  ) : null}
                </View>
              </>
            ) : null}

            {!loading && tab === 'attendance' ? (
              <View style={styles.card}>
                <ProDayText variant="section" style={styles.cardSectionTitle}>
                  Pointage des présences
                </ProDayText>

                {editableAttendanceEvent ? (
                  <View style={styles.attendanceWrap}>
                    <ProDayText variant="caption" style={styles.attendanceEventTitle}>
                      {editableAttendanceEvent.title} · {formatCalendarDate(editableAttendanceEvent.starts_at)}
                    </ProDayText>
                    {isOrganizerCapable(profile.role) ? (
                      <EventAttendancePanel
                        event={editableAttendanceEvent}
                        profile={profile}
                        isStaff
                        onUpdated={load}
                      />
                    ) : null}
                  </View>
                ) : null}

                <View style={styles.carpoolSection}>
                  <ProDayText variant="section" style={styles.cardSectionTitle}>
                    Bilan déplacements & Covoiturage
                  </ProDayText>
                  <CarpoolBalanceTable rows={carpoolBalance} />
                </View>
              </View>
            ) : null}

            {!loading && tab === 'stats' ? (
              <View style={styles.card}>
                <ProDayText variant="section" style={styles.cardSectionTitle}>
                  Feuille de match & Statistiques
                </ProDayText>
                <ProDayText variant="caption" style={styles.cardBodyText}>
                  Les performances live sont enregistrées et synchronisées automatiquement.
                </ProDayText>

                {selectedStatPlayer && statsEvent ? (
                  <View style={styles.statEditorBox}>
                    <ProDayText variant="section" style={styles.statEditorPlayer}>
                      {isWoman ? 'Joueuse sélectionnée' : 'Joueur sélectionné'} : {selectedStatPlayer.display_name}
                    </ProDayText>
                    <View style={styles.statActionsRow}>
                      <PressableSpring
                        style={styles.statActionBtn}
                        onPress={() => void updateSelectedStat({ minutes_played: Math.min(120, (statsEvent.player_match_stats?.[selectedStatPlayer.uid]?.minutes_played ?? 0) + 15) })}
                      >
                        <ProDayText variant="caption" style={styles.statActionBtnText}>+15 min</ProDayText>
                      </PressableSpring>
                      <PressableSpring
                        style={styles.statActionBtn}
                        onPress={() => void updateSelectedStat({ goals: (statsEvent.player_match_stats?.[selectedStatPlayer.uid]?.goals ?? 0) + 1 })}
                      >
                        <ProDayText variant="caption" style={styles.statActionBtnText}>+1 But</ProDayText>
                      </PressableSpring>
                      <PressableSpring
                        style={styles.statActionBtn}
                        onPress={() => void updateSelectedStat({ assists: (statsEvent.player_match_stats?.[selectedStatPlayer.uid]?.assists ?? 0) + 1 })}
                      >
                        <ProDayText variant="caption" style={styles.statActionBtnText}>+1 Passe</ProDayText>
                      </PressableSpring>
                    </View>
                  </View>
                ) : null}

                {statsEvent ? (
                  <PressableSpring
                    style={[styles.primaryCreateBtn, { backgroundColor: tokens.accent, marginTop: 12 }]}
                    onPress={() => void finalizeReport()}
                    disabled={Boolean(statsEvent.match_report_finalized_at)}
                    scaleTo={0.97}
                    haptic
                  >
                    <ProDayText variant="section" style={styles.primaryCreateBtnText}>
                      {statsEvent.match_report_finalized_at ? 'Rapport validé' : 'Valider le rapport d’après-match'}
                    </ProDayText>
                  </PressableSpring>
                ) : null}

                <View style={styles.topStatsList}>
                  <ProDayText variant="section" style={styles.cardSectionTitle}>
                    Top Buteurs
                  </ProDayText>
                  {topStats.topGoals.map(([name, n]) => (
                    <View key={`g-${name}`} style={styles.topStatItem}>
                      <ProDayText variant="section" style={styles.rowPlayerName}>{name}</ProDayText>
                      <ProDayText variant="section" style={[styles.rowPlayerName, { color: tokens.accent }]}>{n} buts</ProDayText>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </ScrollView>
        </View>
      )}

      {!joinAsRoot ? (
        <PushScreenTransition active={hubView !== 'hub'}>{subView}</PushScreenTransition>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#14141A',
    borderWidth: 1,
    borderColor: '#22222E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
  },
  headerMainTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerSub: {
    color: '#8B8B9A',
    fontSize: 11.5,
    marginTop: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#14141A',
    borderWidth: 1,
    borderColor: '#22222E',
  },
  tabPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  tabPillText: {
    color: '#8B8B9A',
    fontSize: 11.5,
    fontWeight: '700',
  },
  tabPillTextActive: {
    color: '#000000',
    fontWeight: '800',
  },
  content: {
    padding: 16,
    gap: 14,
  },
  loadingWrap: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#14141A',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#22222E',
    padding: 16,
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 2,
  },
  cardSectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  cardBodyText: {
    color: '#8B8B9A',
    fontSize: 12,
    lineHeight: 16,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1C1C24',
    paddingTop: 10,
    marginTop: 4,
    gap: 8,
  },
  rowPlayerName: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  rowSubText: {
    color: '#8B8B9A',
    fontSize: 11,
    marginTop: 1,
  },
  pendingActionBtns: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtnApprove: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  actionBtnApproveText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 11,
  },
  actionBtnReject: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#1C1C26',
    borderWidth: 1,
    borderColor: '#2A2A38',
  },
  actionBtnRejectText: {
    color: '#8B8B9A',
    fontWeight: '700',
    fontSize: 11,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1C1C26',
    borderWidth: 1,
    borderColor: '#2A2A38',
    borderRadius: 12,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12.5,
  },
  searchBtn: {
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 12,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181822',
    padding: 10,
    borderRadius: 10,
    marginTop: 4,
    gap: 8,
  },
  inviteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  inviteBtnText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 11,
  },
  staffItem: {
    borderTopWidth: 1,
    borderTopColor: '#1C1C24',
    paddingTop: 8,
  },
  addStaffBox: {
    gap: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1C1C24',
    paddingTop: 10,
  },
  addStaffInput: {
    backgroundColor: '#1C1C26',
    borderWidth: 1,
    borderColor: '#2A2A38',
    borderRadius: 10,
    color: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: '#1C1C26',
    borderWidth: 1,
    borderColor: '#2A2A38',
  },
  roleChipText: {
    color: '#8B8B9A',
    fontSize: 10.5,
    fontWeight: '600',
  },
  addStaffBtn: {
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  addStaffBtnText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 12,
  },
  playerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#1C1C24',
    paddingTop: 8,
  },
  playerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  youBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  youBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyText: {
    color: '#8B8B9A',
    fontSize: 12,
  },
  kpiCardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#14141A',
    borderWidth: 1,
    borderColor: '#22222E',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  kpiVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  kpiLbl: {
    color: '#8B8B9A',
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
  },
  primaryCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  primaryCreateBtnText: {
    color: '#000000',
    fontSize: 13.5,
    fontWeight: '900',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1C1C24',
    paddingTop: 8,
  },
  eventRsvpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventRsvpBadgeText: {
    color: '#8B8B9A',
    fontSize: 11,
    fontWeight: '600',
  },
  attendanceWrap: {
    gap: 8,
  },
  attendanceEventTitle: {
    color: '#8B8B9A',
    fontSize: 12,
  },
  carpoolSection: {
    borderTopWidth: 1,
    borderTopColor: '#1C1C24',
    paddingTop: 12,
    marginTop: 6,
  },
  statEditorBox: {
    backgroundColor: '#181822',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
  },
  statEditorPlayer: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  statActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statActionBtn: {
    backgroundColor: '#222230',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  topStatsList: {
    borderTopWidth: 1,
    borderTopColor: '#1C1C24',
    paddingTop: 12,
    marginTop: 6,
    gap: 8,
  },
  topStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
});
