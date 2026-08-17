import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PressableSpring, PushScreenTransition } from '../components/motion';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon } from '../components/ui/Icon';
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
import { ClubAnnouncementsScreen } from './ClubAnnouncementsScreen';
import { ClubHubScreen } from './ClubHubScreen';
import { useTabNavigation } from '../context/TabNavigationContext';
import { EventAttendancePanel } from '../components/team/EventAttendancePanel';
import { CarpoolBalanceTable } from '../components/team/CarpoolBalanceTable';
import { aggregateCarpoolBalance } from '../utils/carpoolBalance';
import { radius, spacing } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import type { AppColors } from '../theme/universeTheme';
import { useCoachShellNav } from '../features/coach/shell/CoachShellNavContext';
import { CoachScreenHeader } from '../components/coach/CoachScreenHeader';
import { getCoachPageIdentity } from '../content/coachPageIdentity';
import { coachTokensAsAppColors, useCoachTheme } from '../features/coach/shell/CoachThemeContext';

type TeamTab = 'planning' | 'roster' | 'attendance' | 'stats';
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
  const { colors: c, productLine, isWoman, rootStyle } = useThemedScreen();
  const inCoachShell = Boolean(useCoachShellNav());
  const shellNav = useCoachShellNav();
  const { tokens: coachTokens } = useCoachTheme();
  const screenColors = useMemo(
    () => (inCoachShell ? coachTokensAsAppColors(coachTokens) : c),
    [inCoachShell, coachTokens, c],
  );
  const styles = useMemo(() => createStyles(screenColors), [screenColors]);
  
  const [hubView, setHubView] = useState<HubView>(profile.profile.club_id ? 'hub' : 'join');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [attendanceEventId, setAttendanceEventId] = useState<string | null>(null);
  const [tab, setTab] = useState<TeamTab>('planning');
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
      const [listEvents, members, clubSeasonEvents, pending, staffRows] = await Promise.all([
        teamEventsService.listForUser(profile.uid, clubId),
        clubId ? usersService.listMembersByClubId(clubId) : Promise.resolve([]),
        clubId ? teamEventsService.listForClub(clubId, 120) : Promise.resolve([]),
        clubId && canManageRoster
          ? membershipsService.listByClub(clubId, 'pending')
          : Promise.resolve([]),
        clubId ? teamStaffService.listForClub(clubId) : Promise.resolve([]),
      ]);
      setEvents(listEvents);
      setMembersCount(members.length);
      setMembers(members);
      setPendingMemberships(pending);
      setStaff(staffRows);
      setSeasonEvents(clubSeasonEvents);
      if (!selectedStatUid && members[0]) setSelectedStatUid(members[0].uid);
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
      0
    );
    const pending = events.reduce(
      (acc, e) => acc + Object.values(e.rsvps).filter((s) => s === 'pending').length,
      0
    );
    return { convocation, training, yes, pending };
  }, [events]);

  const carpoolBalance = useMemo(
    () => aggregateCarpoolBalance(seasonEvents),
    [seasonEvents]
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

  const updateMyAttendance = async (
    event: TeamEvent,
    status: 'yes' | 'no' | 'maybe',
    reason?: string
  ) => {
    await teamEventsService.updateRsvpWithReason(event.id, profile.uid, status, reason);
    await load();
  };

  const attendanceEvent =
    events.find((e) => e.id === attendanceEventId) ??
    events.find((e) => e.invitee_uids.length > 0);
  const editableAttendanceEvent = attendanceEvent;
  const statsEvent = events.find((e) => e.event_type === 'friendly' || e.event_type === 'training');
  const isStaff =
    Boolean(isAdmin) ||
    profile.role === 'coach' ||
    profile.role === 'organizer' ||
    profile.role === 'agent' ||
    profile.role === 'club';

  const joinAsRoot = hubView === 'join' && !clubId;

  let subView: React.ReactNode = null;
  if (hubView === 'join' && clubId) {
    subView = (
      <JoinClubScreen
        profile={profile}
        onBack={() => setHubView('hub')}
        onJoined={() => {
          setHubView('hub');
          void load();
        }}
      />
    );
  } else if (hubView === 'create' && canCreateConvocations) {
    subView = (
      <CreateTeamEventScreen
        onBack={() => setHubView('hub')}
        onCreated={(id) => {
          setSelectedEventId(id);
          setHubView('event');
        }}
      />
    );
  } else if (hubView === 'announcements') {
    subView = (
      <ClubAnnouncementsScreen
        profile={profile}
        canManage={isStaff}
        onBack={() => setHubView('hub')}
      />
    );
  } else if (hubView === 'club') {
    subView = (
      <ClubHubScreen
        profile={profile}
        events={events}
        onBack={() => setHubView('hub')}
        onChannel={(channel) => {
          if (channel === 'general') {
            setHubView('announcements');
          } else if (channel === 'mercato') {
            setActiveTab('recrutement');
          } else if (channel === 'covoit') {
            setActiveTab('covoiturage');
          } else if (channel === 'convocations') {
            setHubView('hub');
            setTab('planning');
          }
        }}
        onOpenEvent={(eventId) => {
          setSelectedEventId(eventId);
          setHubView('event');
        }}
        onOpenTeamChat={(threadId) => openChat(threadId)}
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

  const canManageFinalizedReport =
    Boolean(isAdmin) ||
    profile.role === 'coach' ||
    profile.role === 'organizer' ||
    profile.role === 'agent' ||
    profile.role === 'club';
  const reportLocked = Boolean(statsEvent?.match_report_finalized_at) && !canManageFinalizedReport;
  const statPlayers = useMemo(() => {
    if (!statsEvent) return [];
    return statsEvent.invitee_uids
      .map((uid) => members.find((m) => m.uid === uid))
      .filter((u): u is User => Boolean(u));
  }, [statsEvent, members]);
  const selectedStatPlayer = statPlayers.find((p) => p.uid === selectedStatUid) ?? statPlayers[0];

  const addQuickPlayerStat = async () => {
    if (reportLocked) {
      Alert.alert('Rapport verrouillé', 'Le rapport validé est en lecture seule.');
      return;
    }
    if (!statsEvent) {
      Alert.alert(
        'Aucun match',
        isWoman
          ? 'Créez un événement training/friendly avec des joueuses.'
          : 'Créez un événement training/friendly avec joueurs.'
      );
      return;
    }
    const uid = statsEvent.invitee_uids[0];
    if (!uid) {
      Alert.alert(
        'Aucun convoqué',
        isWoman ? 'Ajoutez des joueuses convoquées.' : 'Ajoutez des joueurs convoqués.'
      );
      return;
    }
    const user = await usersService.getPublicById(uid);
    if (!user) return;
    const current = statsEvent.player_match_stats?.[uid];
    await teamEventsService.updatePlayerMatchStat(
      statsEvent.id,
      uid,
      {
        player_name: user.display_name,
        minutes_played: Math.min(90, (current?.minutes_played ?? 0) + 15),
        rating: Math.min(10, Number((current?.rating ?? 6) + 0.5)),
        goals: (current?.goals ?? 0) + 1,
        assists: current?.assists ?? 0,
        yellow_cards: current?.yellow_cards ?? 0,
        red_cards: current?.red_cards ?? 0,
      },
      { user: profile, isAdmin },
    );
    await load();
  };

  const shareMatchReport = async () => {
    if (!statsEvent) return;
    const summary = Object.values(statsEvent.player_match_stats ?? {})
      .slice(0, 4)
      .map((s) => `${s.player_name}: ${s.goals ?? 0}b/${s.assists ?? 0}p, note ${s.rating ?? '-'}`)
      .join('\n');
    await Share.share({
      message: `Rapport d'après-match. ${statsEvent.title}\n${statsEvent.city} · ${statsEvent.starts_at.toLocaleDateString('fr-FR')}\n\n${summary || 'Aucune stat individuelle.'}`,
    });
  };

  const updateSelectedStat = async (patch: Partial<PlayerMatchSheetStat>) => {
    if (reportLocked) {
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

  const unlockReport = async () => {
    if (!statsEvent) return;
    if (!canManageFinalizedReport) {
      Alert.alert('Accès refusé', 'Seul le staff peut déverrouiller un rapport validé.');
      return;
    }
    await teamEventsService.setMatchReportFinalized(statsEvent.id, false, {
      user: profile,
      isAdmin,
    });
    await load();
    Alert.alert('Rapport déverrouillé', 'Le rapport est à nouveau modifiable.');
  };

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
        <View style={[styles.root, rootStyle, inCoachShell && { backgroundColor: coachTokens.bg }]}>
      {inCoachShell ? (
        <CoachScreenHeader title={getCoachPageIdentity('gestion').title} />
      ) : (
        <ScreenHeader title="Gestion équipe" onBack={onBack} centered />
      )}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.tabs}>
          <TabBtn styles={styles} id="planning" label="Planning" tab={tab} setTab={setTab} />
          <TabBtn styles={styles} id="roster" label="Effectif" tab={tab} setTab={setTab} />
          <TabBtn styles={styles} id="attendance" label="Présences" tab={tab} setTab={setTab} />
          <TabBtn styles={styles} id="stats" label="Stats" tab={tab} setTab={setTab} />
        </View>

        {clubId ? (
          <>
            {canCreateConvocations ? (
              <PressableSpring style={styles.createEventBtn} onPress={() => setHubView('create')}>
                <Text style={styles.createEventBtnText}>+ Nouvelle convocation</Text>
              </PressableSpring>
            ) : null}
            <PressableSpring
              style={styles.secondaryHubBtn}
              onPress={() => setHubView('announcements')}
            >
              <Text style={styles.secondaryHubBtnText}>Annonces club</Text>
            </PressableSpring>
            <PressableSpring
              style={styles.secondaryHubBtn}
              onPress={() => {
                if (inCoachShell && shellNav) {
                  shellNav.requestNav('com_staff');
                } else {
                  setHubView('club');
                }
              }}
            >
              <Text style={styles.secondaryHubBtnText}>Communauté club</Text>
            </PressableSpring>
          </>
        ) : (
          <PressableSpring style={styles.createEventBtn} onPress={() => setHubView('join')}>
            <Text style={styles.createEventBtnText}>Rejoindre un club</Text>
          </PressableSpring>
        )}

        {loading ? (
          <ActivityIndicator color={screenColors.accent} style={styles.loader} />
        ) : null}

        {!loading && tab === 'planning' ? (
          <>
            <View style={styles.planningKpiRow}>
              <Kpi styles={styles} label="Convocations" value={String(eventStats.convocation)} />
              <Kpi styles={styles} label="Présents" value={String(eventStats.yes)} />
              <Kpi styles={styles} label="En attente" value={String(eventStats.pending)} />
            </View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Prochains événements</Text>
              {events.slice(0, 8).map((e) => {
                const yes = countRsvpYes(e);
                const pending = getPendingInviteeUids(e).length;
                const no = Object.values(e.rsvps).filter((s) => s === 'no').length;
                const rsvpSummary = `${yes} présents · ${no} absents · ${pending} en attente`;
                return (
                  <PressableSpring
                    key={e.id}
                    style={styles.rowTouchable}
                    onPress={() => {
                      setSelectedEventId(e.id);
                      setHubView('event');
                    }}
                  >
                    <Row
                      styles={styles}
                      title={e.title}
                      subtitle={`${e.starts_at.toLocaleDateString('fr-FR', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })} · ${e.city}${e.categories?.length ? ` · ${e.categories.join(', ')}` : ''}`}
                      right={rsvpSummary}
                    />
                  </PressableSpring>
                );
              })}
              {events.length === 0 ? (
                <View style={styles.emptyBlock}>
                  <Text style={styles.empty}>
                    {canCreateConvocations
                      ? 'Aucun événement planifié pour le moment.'
                      : 'Aucun événement. Les convocations sont gérées par le coach Premium (ou Tout inclus).'}
                  </Text>
                  {canCreateConvocations ? (
                    <PressableSpring style={styles.createEventBtn} onPress={() => setHubView('create')} scaleTo={0.97} haptic>
                      <Text style={styles.createEventBtnText}>Créer une convocation</Text>
                    </PressableSpring>
                  ) : null}
                </View>
              ) : null}
            </View>
          </>
        ) : null}

        {!loading && tab === 'roster' ? (
          <>
            {canManageRoster && pendingMemberships.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Demandes d&apos;affiliation</Text>
                {pendingMemberships.map((m) => (
                  <View key={m.id} style={styles.pendingRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{m.player_name}</Text>
                      <Text style={styles.body}>
                        Demandé le {m.requested_at.toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                    <PressableSpring
                      style={[styles.pendingBtn, { backgroundColor: screenColors.brand }]}
                      onPress={() => void handleMembershipDecision(m.id, true)}
                      scaleTo={0.97}
                    >
                      <Text style={styles.pendingBtnText}>Valider</Text>
                    </PressableSpring>
                    <PressableSpring
                      style={[styles.pendingBtn, styles.pendingBtnGhost]}
                      onPress={() => void handleMembershipDecision(m.id, false)}
                      scaleTo={0.97}
                    >
                      <Text style={styles.pendingBtnGhostText}>Refuser</Text>
                    </PressableSpring>
                  </View>
                ))}
              </View>
            ) : null}
            {canManageRoster && clubId ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Inviter un joueur</Text>
                <Text style={styles.body}>
                  Recherchez un joueur ProDay pour lui proposer une affiliation au club.
                </Text>
                <View style={styles.inviteRow}>
                  <TextInput
                    style={[styles.inviteInput, { borderColor: screenColors.border, color: screenColors.text }]}
                    placeholder="Nom du joueur…"
                    placeholderTextColor={screenColors.textMuted}
                    value={playerSearch}
                    onChangeText={setPlayerSearch}
                    onSubmitEditing={() => void searchPlayers()}
                    returnKeyType="search"
                  />
                  <PressableSpring
                    style={[styles.pendingBtn, { backgroundColor: screenColors.brand }]}
                    onPress={() => void searchPlayers()}
                    disabled={searchLoading}
                    scaleTo={0.97}
                  >
                    <Text style={styles.pendingBtnText}>
                      {searchLoading ? '…' : 'Chercher'}
                    </Text>
                  </PressableSpring>
                </View>
                {searchResults.map((player) => (
                  <View key={player.uid} style={styles.pendingRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{player.display_name}</Text>
                      <Text style={styles.body}>
                        {[player.profile.position, player.city].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                    <PressableSpring
                      style={[styles.pendingBtn, { backgroundColor: screenColors.brand }]}
                      onPress={() => void handleInvitePlayer(player)}
                      disabled={invitingUid === player.uid}
                      scaleTo={0.97}
                    >
                      <Text style={styles.pendingBtnText}>Inviter</Text>
                    </PressableSpring>
                  </View>
                ))}
              </View>
            ) : null}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Staff</Text>
              {staff.map((s) => (
                <Row
                  styles={styles}
                  key={s.id}
                  title={s.display_name}
                  subtitle={TEAM_STAFF_ROLE_LABELS[s.staff_role]}
                  right=""
                />
              ))}
              {staff.length === 0 ? (
                <Text style={styles.empty}>Aucun membre staff pour le moment.</Text>
              ) : null}
              {canManageRoster ? (
                <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
                  <TextInput
                    style={[styles.inviteInput, { flexGrow: 0, borderColor: screenColors.border, color: screenColors.text }]}
                    placeholder="Nom affiché"
                    placeholderTextColor={screenColors.textMuted}
                    value={staffName}
                    onChangeText={setStaffName}
                  />
                  <TextInput
                    style={[styles.inviteInput, { flexGrow: 0, borderColor: screenColors.border, color: screenColors.text }]}
                    placeholder="UID ProDay"
                    placeholderTextColor={screenColors.textMuted}
                    value={staffUid}
                    onChangeText={setStaffUid}
                  />
                  <View style={styles.roleRow}>
                    {(['assistant', 'analyst', 'physio', 'coach'] as TeamStaffRole[]).map((r) => (
                      <PressableSpring
                        key={r}
                        onPress={() => setStaffRole(r)}
                        scaleTo={0.97}
                        style={[
                          styles.roleChip,
                          staffRole === r ? { borderColor: screenColors.brand, backgroundColor: screenColors.surfaceMuted } : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.miniBtnText,
                            staffRole === r ? { color: screenColors.brand, fontWeight: '800' } : null,
                          ]}
                        >
                          {TEAM_STAFF_ROLE_LABELS[r]}
                        </Text>
                      </PressableSpring>
                    ))}
                  </View>
                  <PressableSpring
                    style={[styles.pendingBtn, { backgroundColor: screenColors.brand, alignSelf: 'flex-start' }]}
                    onPress={() => void handleAddStaff()}
                    scaleTo={0.97}
                  >
                    <Text style={styles.pendingBtnText}>Ajouter au staff</Text>
                  </PressableSpring>
                </View>
              ) : null}
            </View>
            <View style={styles.card}>
            <Text style={styles.sectionTitle}>Effectif club</Text>
            <Text style={styles.body}>
              {membersCount} membre(s) liés à votre structure.
            </Text>
            {members.map((m) => (
              <Row
                styles={styles}
                key={m.uid}
                title={m.display_name}
                subtitle={`${m.role}${m.profile?.position ? ` · ${m.profile.position}` : ''}${m.profile?.category ? ` · ${m.profile.category}` : ''}`}
                right={m.uid === profile.uid ? 'Vous' : ''}
              />
            ))}
            {members.length === 0 ? (
              <Text style={styles.empty}>
                Aucun membre. Invitez les joueurs à rejoindre le club depuis leur profil.
              </Text>
            ) : null}
          </View>
          </>
        ) : null}

        {!loading && tab === 'attendance' ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Présences & réponses</Text>
            <Row styles={styles} title="Confirmés" subtitle="Présents" right={String(eventStats.yes)} />
            <Row styles={styles} title="En attente" subtitle="Sans réponse" right={String(eventStats.pending)} />
            <Row styles={styles} title="Convocations" subtitle="Matchs / feuilles" right={String(eventStats.convocation)} />
            <Row styles={styles} title="Entraînements" subtitle="Séances" right={String(eventStats.training)} />
            {events.filter((e) => e.invitee_uids.length > 0).length > 0 ? (
              <>
                <Text style={styles.inlineTitle}>Événement</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.inlineBtns}>
                    {events
                      .filter((e) => e.invitee_uids.length > 0)
                      .map((e) => (
                        <MiniBtn
                          styles={styles}
                          key={e.id}
                          label={e.title.slice(0, 18)}
                          onPress={() => setAttendanceEventId(e.id)}
                        />
                      ))}
                  </View>
                </ScrollView>
              </>
            ) : null}
            {editableAttendanceEvent ? (
              <View style={styles.inlineBlock}>
                <Text style={styles.inlineTitle}>
                  {editableAttendanceEvent.title} · {editableAttendanceEvent.starts_at.toLocaleDateString('fr-FR')}
                </Text>
                {profile.role === 'player' ? (
                  <View style={styles.inlineBtns}>
                    <MiniBtn styles={styles} label="Présent" onPress={() => void updateMyAttendance(editableAttendanceEvent, 'yes')} />
                    <MiniBtn
                      styles={styles}
                      label="Absent"
                      onPress={() =>
                        void updateMyAttendance(
                          editableAttendanceEvent,
                          'no',
                          'Empêchement personnel'
                        )
                      }
                    />
                    <MiniBtn styles={styles} label="Peut-être" onPress={() => void updateMyAttendance(editableAttendanceEvent, 'maybe')} />
                  </View>
                ) : null}
                {isStaff ? (
                  <EventAttendancePanel
                    event={editableAttendanceEvent}
                    profile={profile}
                    isStaff
                    onUpdated={load}
                  />
                ) : null}
              </View>
            ) : null}
            <View style={styles.inlineBlock}>
              <Text style={styles.inlineTitle}>Bilan covoiturage</Text>
              <CarpoolBalanceTable rows={carpoolBalance} />
            </View>
          </View>
        ) : null}

        {!loading && tab === 'stats' ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Stats équipe</Text>
            <Text style={styles.body}>
              {isWoman
                ? 'Les actions live de match peuvent être appliquées aux stats joueuses depuis les écrans Matchs (but, passe, cartons, remplacements).'
                : 'Les actions live de match peuvent être appliquées aux stats joueurs depuis les écrans Matchs (but, passe, cartons, remplacements).'}
            </Text>
            <View style={styles.infoBox}>
              <Icon name="document" size={18} color={screenColors.accent} />
              <Text style={styles.infoText}>
                Base prête: lineup, live actions et agrégation automatique vers les stats saison.
              </Text>
            </View>
            <View style={styles.inlineBtns}>
              <MiniBtn
                styles={styles}
                label={
                  reportLocked
                    ? 'Rapport verrouillé'
                    : isWoman
                      ? 'Ajouter stat joueuse #1'
                      : 'Ajouter stat joueur #1'
                }
                onPress={() => void addQuickPlayerStat()}
              />
              <MiniBtn styles={styles} label="Partager rapport" onPress={() => void shareMatchReport()} />
            </View>
            {selectedStatPlayer && statsEvent ? (
              <View style={styles.inlineBlock}>
                <Text style={styles.inlineTitle}>
                  {isWoman ? 'Édition feuille joueuse' : 'Édition feuille joueur'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.inlineBtns}>
                    {statPlayers.slice(0, 8).map((p) => (
                      <MiniBtn
                        styles={styles}
                        key={p.uid}
                        label={p.display_name}
                        onPress={() => setSelectedStatUid(p.uid)}
                      />
                    ))}
                  </View>
                </ScrollView>
                <Text style={styles.rowSub}>
                  {isWoman ? 'Joueuse sélectionnée' : 'Joueur sélectionné'}:{' '}
                  {selectedStatPlayer.display_name}
                </Text>
                <View style={styles.inlineBtns}>
                  <MiniBtn styles={styles} label={reportLocked ? 'Locked' : '+15 min'} onPress={() => void updateSelectedStat({ minutes_played: Math.min(120, (statsEvent.player_match_stats?.[selectedStatPlayer.uid]?.minutes_played ?? 0) + 15) })} />
                  <MiniBtn styles={styles} label={reportLocked ? 'Locked' : '+1 but'} onPress={() => void updateSelectedStat({ goals: (statsEvent.player_match_stats?.[selectedStatPlayer.uid]?.goals ?? 0) + 1 })} />
                  <MiniBtn styles={styles} label={reportLocked ? 'Locked' : '+1 passe'} onPress={() => void updateSelectedStat({ assists: (statsEvent.player_match_stats?.[selectedStatPlayer.uid]?.assists ?? 0) + 1 })} />
                </View>
                <View style={styles.inlineBtns}>
                  <MiniBtn styles={styles} label={reportLocked ? 'Locked' : '+0.5 note'} onPress={() => void updateSelectedStat({ rating: Math.min(10, Number(((statsEvent.player_match_stats?.[selectedStatPlayer.uid]?.rating ?? 6) + 0.5).toFixed(1))) })} />
                  <MiniBtn styles={styles} label={reportLocked ? 'Locked' : '+1 jaune'} onPress={() => void updateSelectedStat({ yellow_cards: (statsEvent.player_match_stats?.[selectedStatPlayer.uid]?.yellow_cards ?? 0) + 1 })} />
                  <MiniBtn styles={styles} label={reportLocked ? 'Locked' : '+1 rouge'} onPress={() => void updateSelectedStat({ red_cards: (statsEvent.player_match_stats?.[selectedStatPlayer.uid]?.red_cards ?? 0) + 1 })} />
                </View>
              </View>
            ) : null}
            {statsEvent ? (
              <>
                <PressableSpring
                  style={[styles.primaryBtn, statsEvent.match_report_finalized_at && styles.primaryBtnDone]}
                  onPress={() => void finalizeReport()}
                  disabled={Boolean(statsEvent.match_report_finalized_at)}
                >
                  <Text style={styles.primaryBtnText}>
                    {statsEvent.match_report_finalized_at ? 'Rapport validé' : 'Valider le rapport d’après-match'}
                  </Text>
                </PressableSpring>
                {statsEvent.match_report_finalized_at ? (
                  <PressableSpring
                    style={styles.secondaryBtn}
                    onPress={() => void unlockReport()}
                    disabled={!canManageFinalizedReport}
                  >
                    <Text style={styles.secondaryBtnText}>
                      {canManageFinalizedReport
                        ? 'Déverrouiller le rapport'
                        : 'Rapport verrouillé (staff uniquement)'}
                    </Text>
                  </PressableSpring>
                ) : null}
              </>
            ) : null}
            <View style={styles.inlineBlock}>
              <Text style={styles.inlineTitle}>Top buteurs (live)</Text>
              {topStats.topGoals.length ? (
                topStats.topGoals.map(([name, n]) => (
                  <Row styles={styles} key={`g-${name}`} title={name} subtitle="Buts" right={String(n)} />
                ))
              ) : (
                <Text style={styles.empty}>Aucun but live enregistré pour le moment.</Text>
              )}
            </View>
            <View style={styles.inlineBlock}>
              <Text style={styles.inlineTitle}>Top passeurs (live)</Text>
              {topStats.topAssists.length ? (
                topStats.topAssists.map(([name, n]) => (
                  <Row styles={styles} key={`a-${name}`} title={name} subtitle="Passes décisives" right={String(n)} />
                ))
              ) : (
                <Text style={styles.empty}>Aucune passe live enregistrée pour le moment.</Text>
              )}
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

const TabBtn: React.FC<{
  styles: ReturnType<typeof createStyles>;
  id: TeamTab;
  label: string;
  tab: TeamTab;
  setTab: (t: TeamTab) => void;
}> = ({ styles, id, label, tab, setTab }) => (
  <PressableSpring
    style={[styles.tabBtn, tab === id && styles.tabBtnOn]}
    onPress={() => setTab(id)}
  >
    <Text style={[styles.tabText, tab === id && styles.tabTextOn]}>{label}</Text>
  </PressableSpring>
);

const Kpi: React.FC<{
  styles: ReturnType<typeof createStyles>;
  label: string;
  value: string;
}> = ({ styles, label, value }) => (
  <View style={styles.kpi}>
    <Text style={styles.kpiValue}>{value}</Text>
    <Text style={styles.kpiLabel}>{label}</Text>
  </View>
);

const Row: React.FC<{
  styles: ReturnType<typeof createStyles>;
  title: string;
  subtitle: string;
  right: string;
}> = ({ styles, title, subtitle, right }) => (
  <View style={styles.row}>
    <View style={{ flex: 1 }}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowSub}>{subtitle}</Text>
    </View>
    <Text style={styles.rowRight}>{right}</Text>
  </View>
);

const MiniBtn: React.FC<{
  styles: ReturnType<typeof createStyles>;
  label: string;
  onPress: () => void;
}> = ({ styles, label, onPress }) => (
  <PressableSpring style={styles.miniBtn} onPress={onPress}>
    <Text style={styles.miniBtnText}>{label}</Text>
  </PressableSpring>
);

function createStyles(c: AppColors) {
  return StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  planningKpiRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  kpi: { flex: 1, backgroundColor: c.surfaceMuted, borderRadius: radius.md, padding: spacing.sm },
  kpiValue: { color: c.text, fontSize: 17, fontWeight: '900' },
  kpiLabel: { color: c.textSecondary, fontSize: 10, marginTop: 2 },
  tabs: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md, flexWrap: 'wrap' },
  tabBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  tabBtnOn: { backgroundColor: c.accent, borderColor: c.accent },
  tabText: { color: c.textSecondary, fontSize: 12, fontWeight: '700' },
  tabTextOn: { color: c.brandInverse },
  createEventBtn: {
    backgroundColor: c.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  createEventBtnText: { color: c.brandInverse, fontWeight: '800', fontSize: 13 },
  secondaryHubBtn: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: c.border,
  },
  secondaryHubBtnText: { color: c.text, fontWeight: '800', fontSize: 13 },
  rowTouchable: { marginHorizontal: -spacing.xs },
  loader: { marginVertical: spacing.md },
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: c.text, marginBottom: spacing.xs },
  empty: { color: c.textMuted, fontSize: 12, marginTop: spacing.sm },
  emptyBlock: { gap: spacing.sm, marginTop: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    paddingVertical: spacing.sm,
  },
  rowTitle: { color: c.text, fontWeight: '700', fontSize: 13 },
  rowSub: { color: c.textMuted, fontSize: 11, marginTop: 1 },
  rowRight: { color: c.textSecondary, fontSize: 11, fontWeight: '700' },
  body: { color: c.textSecondary, fontSize: 12, lineHeight: 19, marginBottom: spacing.sm },
  infoBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: c.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'flex-start',
  },
  infoText: { flex: 1, color: c.textSecondary, fontSize: 11, lineHeight: 17 },
  primaryBtn: {
    backgroundColor: c.accent,
    borderRadius: radius.md,
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginVertical: spacing.sm,
  },
  primaryBtnText: { color: c.brandInverse, fontSize: 13, fontWeight: '800' },
  primaryBtnDone: { opacity: 0.7 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  secondaryBtnText: { color: c.textSecondary, fontSize: 12, fontWeight: '700' },
  inlineBlock: {
    marginTop: spacing.sm,
    backgroundColor: c.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  inlineTitle: { color: c.text, fontSize: 12, fontWeight: '800', marginBottom: spacing.xs },
  inlineBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  miniBtn: {
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  miniBtnText: { fontSize: 10, fontWeight: '700', color: c.textSecondary },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  pendingBtn: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  pendingBtnText: { color: c.brandInverse, fontSize: 11, fontWeight: '800' },
  pendingBtnGhost: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  pendingBtnGhostText: { color: c.textSecondary, fontSize: 11, fontWeight: '700' },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  inviteInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 14,
  },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  roleChip: {
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  });
}
