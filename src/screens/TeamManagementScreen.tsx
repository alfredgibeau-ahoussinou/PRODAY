import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon } from '../components/ui/Icon';
import type { User } from '../models/User';
import type { PlayerMatchSheetStat, TeamEvent } from '../models/TeamEvent';
import { countRsvpYes, getPendingInviteeUids } from '../models/TeamEvent';
import type { TeamPaymentRequest } from '../models/TeamFinance';
import { teamEventsService } from '../services/teamEvents.service';
import { teamFinanceService } from '../services/teamFinance.service';
import { usersService } from '../services/users.service';
import { buildMatchSheetHtml } from '../utils/matchSheetHtml';
import { openPrintableHtml } from '../utils/openCvHtml';
import { useAuth } from '../context/AuthContext';
import { TeamEventDetailScreen } from './TeamEventDetailScreen';
import { CreateTeamEventScreen } from './CreateTeamEventScreen';
import { JoinClubScreen } from './JoinClubScreen';
import { ClubAnnouncementsScreen } from './ClubAnnouncementsScreen';
import { EventAttendancePanel } from '../components/team/EventAttendancePanel';
import { CarpoolBalanceTable } from '../components/team/CarpoolBalanceTable';
import { aggregateCarpoolBalance } from '../utils/carpoolBalance';
import { colors, radius, spacing } from '../theme/designTokens';

type TeamTab = 'planning' | 'roster' | 'attendance' | 'stats' | 'payments';
type HubView = 'hub' | 'event' | 'create' | 'join' | 'announcements';

interface TeamManagementScreenProps {
  profile: User;
  onBack: () => void;
}

export const TeamManagementScreen: React.FC<TeamManagementScreenProps> = ({
  profile,
  onBack,
}) => {
  const { isAdmin } = useAuth();
  const [hubView, setHubView] = useState<HubView>(profile.profile.club_id ? 'hub' : 'join');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [attendanceEventId, setAttendanceEventId] = useState<string | null>(null);
  const [tab, setTab] = useState<TeamTab>('planning');
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [payments, setPayments] = useState<TeamPaymentRequest[]>([]);
  const [membersCount, setMembersCount] = useState(0);
  const [members, setMembers] = useState<User[]>([]);
  const [seasonEvents, setSeasonEvents] = useState<TeamEvent[]>([]);
  const [selectedStatUid, setSelectedStatUid] = useState<string | null>(null);

  const clubId = profile.profile.club_id;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listEvents, listPayments, members, clubSeasonEvents] = await Promise.all([
        teamEventsService.listForUser(profile.uid, clubId),
        clubId ? teamFinanceService.listByClub(clubId, 80) : Promise.resolve([]),
        clubId ? usersService.listMembersByClubId(clubId) : Promise.resolve([]),
        clubId ? teamEventsService.listForClub(clubId, 120) : Promise.resolve([]),
      ]);
      setEvents(listEvents);
      setPayments(listPayments);
      setMembersCount(members.length);
      setMembers(members);
      setSeasonEvents(clubSeasonEvents);
      if (!selectedStatUid && members[0]) setSelectedStatUid(members[0].uid);
    } finally {
      setLoading(false);
    }
  }, [profile.uid, clubId, selectedStatUid]);

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

  const paymentStats = useMemo(() => {
    const expected = payments.reduce((acc, p) => acc + p.amount_eur, 0);
    const received = payments
      .filter((p) => p.status === 'paid')
      .reduce((acc, p) => acc + p.amount_eur, 0);
    const late = payments.filter((p) => p.status === 'late').length;
    return { expected, received, late };
  }, [payments]);

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

  const createBulkPayments = async () => {
    if (!clubId) {
      Alert.alert('Club requis', 'Associez un club avant de gérer les cotisations.');
      return;
    }
    const players = members.filter((m) => m.role === 'player');
    const targets = players.length > 0 ? players : members;
    if (targets.length === 0) {
      Alert.alert('Effectif vide', 'Aucun membre dans le club.');
      return;
    }
    Alert.alert(
      'Cotisation équipe',
      `Créer une demande de 25 € pour ${targets.length} membre(s) ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Créer',
          onPress: async () => {
            const n = await teamFinanceService.createBulkForClub(
              clubId,
              targets.map((m) => ({ uid: m.uid, name: m.display_name })),
              {
                label: 'Cotisation mensuelle',
                amount_eur: 25,
                due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                created_by_uid: profile.uid,
              }
            );
            await load();
            Alert.alert('Cotisations créées', `${n} demande(s) envoyée(s).`);
          },
        },
      ]
    );
  };

  const createQuickPayment = async () => {
    if (!clubId) {
      Alert.alert('Club requis', 'Associez un club avant de gérer les cotisations.');
      return;
    }
    const members = await usersService.listMembersByClubId(clubId);
    const first = members.find((m) => m.role === 'player') ?? members[0];
    if (!first) {
      Alert.alert('Membres manquants', 'Aucun membre trouvé pour ce club.');
      return;
    }
    await teamFinanceService.create({
      club_id: clubId,
      label: 'Cotisation mensuelle',
      amount_eur: 25,
      due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      member_uid: first.uid,
      member_name: first.display_name,
      created_by_uid: profile.uid,
    });
    await load();
    Alert.alert('Cotisation créée', `Demande envoyée à ${first.display_name}.`);
  };

  const markPaid = async (payment: TeamPaymentRequest) => {
    await teamFinanceService.setStatus(payment.id, 'paid', new Date());
    await load();
  };

  const markOverdue = async () => {
    if (!clubId) return;
    const n = await teamFinanceService.markOverdueByClub(clubId);
    await load();
    Alert.alert('Relance retards', n > 0 ? `${n} cotisation(s) marquée(s) en retard.` : 'Aucun retard détecté.');
  };

  const exportFinanceCsv = async () => {
    const csv = teamFinanceService.toCsv(payments);
    try {
      await Share.share({
        message: csv,
        title: 'Cotisations ProDay',
      });
    } catch {
      Alert.alert(
        'Export CSV',
        `Export prêt (${payments.length} lignes). Copiez depuis la console développeur si besoin.`
      );
      console.log('[TeamManagementScreen] payments.csv\n' + csv);
    }
  };

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

  if (hubView === 'join') {
    return (
      <JoinClubScreen
        profile={profile}
        onBack={onBack}
        onJoined={() => {
          setHubView('hub');
          void load();
        }}
      />
    );
  }

  if (hubView === 'create') {
    return (
      <CreateTeamEventScreen
        onBack={() => setHubView('hub')}
        onCreated={(id) => {
          setSelectedEventId(id);
          setHubView('event');
        }}
      />
    );
  }

  if (hubView === 'announcements') {
    return (
      <ClubAnnouncementsScreen
        profile={profile}
        canManage={isStaff}
        onBack={() => setHubView('hub')}
      />
    );
  }

  if (hubView === 'event' && selectedEventId) {
    return (
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
      Alert.alert('Aucun match', 'Créez un événement training/friendly avec joueurs.');
      return;
    }
    const uid = statsEvent.invitee_uids[0];
    if (!uid) {
      Alert.alert('Aucun convoqué', 'Ajoutez des joueurs convoqués.');
      return;
    }
    const user = await usersService.getById(uid);
    if (!user) return;
    const current = statsEvent.player_match_stats?.[uid];
    await teamEventsService.updatePlayerMatchStat(statsEvent.id, uid, {
      player_name: user.display_name,
      minutes_played: Math.min(90, (current?.minutes_played ?? 0) + 15),
      rating: Math.min(10, Number((current?.rating ?? 6) + 0.5)),
      goals: (current?.goals ?? 0) + 1,
      assists: current?.assists ?? 0,
      yellow_cards: current?.yellow_cards ?? 0,
      red_cards: current?.red_cards ?? 0,
    });
    await load();
  };

  const exportMatchReport = () => {
    if (!statsEvent) {
      Alert.alert('Rapport indisponible', 'Aucun événement match/entraînement à exporter.');
      return;
    }
    const html = buildMatchSheetHtml(statsEvent);
    openPrintableHtml(html, `Rapport match — ${statsEvent.title}`);
  };

  const shareMatchReport = async () => {
    if (!statsEvent) return;
    const summary = Object.values(statsEvent.player_match_stats ?? {})
      .slice(0, 4)
      .map((s) => `${s.player_name}: ${s.goals ?? 0}b/${s.assists ?? 0}p, note ${s.rating ?? '-'}`)
      .join('\n');
    await Share.share({
      message: `Rapport d'après-match — ${statsEvent.title}\n${statsEvent.city} · ${statsEvent.starts_at.toLocaleDateString('fr-FR')}\n\n${summary || 'Aucune stat individuelle.'}`,
    });
  };

  const updateSelectedStat = async (patch: Partial<PlayerMatchSheetStat>) => {
    if (reportLocked) {
      Alert.alert('Rapport verrouillé', 'Le rapport validé est en lecture seule.');
      return;
    }
    if (!statsEvent || !selectedStatPlayer) return;
    const current = statsEvent.player_match_stats?.[selectedStatPlayer.uid];
    await teamEventsService.updatePlayerMatchStat(statsEvent.id, selectedStatPlayer.uid, {
      player_name: selectedStatPlayer.display_name,
      minutes_played: current?.minutes_played ?? 0,
      rating: current?.rating ?? 6,
      goals: current?.goals ?? 0,
      assists: current?.assists ?? 0,
      yellow_cards: current?.yellow_cards ?? 0,
      red_cards: current?.red_cards ?? 0,
      ...patch,
    });
    await load();
  };

  const finalizeReport = async () => {
    if (!statsEvent) return;
    await teamEventsService.setMatchReportFinalized(statsEvent.id, true);
    await load();
    Alert.alert('Rapport validé', 'Le rapport d’après-match est figé et partageable.');
  };

  const unlockReport = async () => {
    if (!statsEvent) return;
    if (!canManageFinalizedReport) {
      Alert.alert('Accès refusé', 'Seul le staff peut déverrouiller un rapport validé.');
      return;
    }
    await teamEventsService.setMatchReportFinalized(statsEvent.id, false);
    await load();
    Alert.alert('Rapport déverrouillé', 'Le rapport est à nouveau modifiable.');
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Gestion équipe" onBack={onBack} centered />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>MVP SportEasy — Club Hub</Text>
          <Text style={styles.heroSub}>
            Planning, présences, stats et paiements dans un seul espace.
          </Text>
          <View style={styles.kpiRow}>
            <Kpi label="Membres" value={String(membersCount)} />
            <Kpi label="Événements" value={String(events.length)} />
            <Kpi label="Paiements" value={String(payments.length)} />
          </View>
        </View>

        <View style={styles.tabs}>
          <TabBtn id="planning" label="Planning" tab={tab} setTab={setTab} />
          <TabBtn id="roster" label="Effectif" tab={tab} setTab={setTab} />
          <TabBtn id="attendance" label="Présences" tab={tab} setTab={setTab} />
          <TabBtn id="stats" label="Stats" tab={tab} setTab={setTab} />
          <TabBtn id="payments" label="Paiements" tab={tab} setTab={setTab} />
        </View>

        {clubId ? (
          <>
            <TouchableOpacity style={styles.createEventBtn} onPress={() => setHubView('create')}>
              <Text style={styles.createEventBtnText}>+ Nouvelle convocation</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryHubBtn}
              onPress={() => setHubView('announcements')}
            >
              <Text style={styles.secondaryHubBtnText}>Annonces club</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.createEventBtn} onPress={() => setHubView('join')}>
            <Text style={styles.createEventBtnText}>Rejoindre un club</Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <ActivityIndicator color={colors.accent} style={styles.loader} />
        ) : null}

        {!loading && tab === 'planning' ? (
          <>
            <View style={styles.planningKpiRow}>
              <Kpi label="Convocations" value={String(eventStats.convocation)} />
              <Kpi label="Présents" value={String(eventStats.yes)} />
              <Kpi label="En attente" value={String(eventStats.pending)} />
            </View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Prochains événements</Text>
              {events.slice(0, 8).map((e) => {
                const yes = countRsvpYes(e);
                const pending = getPendingInviteeUids(e).length;
                const no = Object.values(e.rsvps).filter((s) => s === 'no').length;
                const rsvpSummary = `${yes} présents · ${no} absents · ${pending} en attente`;
                return (
                  <TouchableOpacity
                    key={e.id}
                    style={styles.rowTouchable}
                    onPress={() => {
                      setSelectedEventId(e.id);
                      setHubView('event');
                    }}
                  >
                    <Row
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
                  </TouchableOpacity>
                );
              })}
              {events.length === 0 ? (
                <Text style={styles.empty}>
                  Aucun événement. Créez une convocation ci-dessus.
                </Text>
              ) : null}
            </View>
          </>
        ) : null}

        {!loading && tab === 'roster' ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Effectif club</Text>
            <Text style={styles.body}>
              {membersCount} membre(s) liés à votre structure.
            </Text>
            {members.map((m) => (
              <Row
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
        ) : null}

        {!loading && tab === 'attendance' ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Présences & réponses</Text>
            <Row title="Confirmés" subtitle="Réponses YES" right={String(eventStats.yes)} />
            <Row title="En attente" subtitle="Réponses PENDING" right={String(eventStats.pending)} />
            <Row title="Convocations" subtitle="Matchs / feuilles" right={String(eventStats.convocation)} />
            <Row title="Entraînements" subtitle="Séances" right={String(eventStats.training)} />
            {events.filter((e) => e.invitee_uids.length > 0).length > 0 ? (
              <>
                <Text style={styles.inlineTitle}>Événement</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.inlineBtns}>
                    {events
                      .filter((e) => e.invitee_uids.length > 0)
                      .map((e) => (
                        <MiniBtn
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
                    <MiniBtn label="Présent" onPress={() => void updateMyAttendance(editableAttendanceEvent, 'yes')} />
                    <MiniBtn
                      label="Absent"
                      onPress={() =>
                        void updateMyAttendance(
                          editableAttendanceEvent,
                          'no',
                          'Empêchement personnel'
                        )
                      }
                    />
                    <MiniBtn label="Peut-être" onPress={() => void updateMyAttendance(editableAttendanceEvent, 'maybe')} />
                  </View>
                ) : null}
                {isStaff ? (
                  <EventAttendancePanel
                    event={editableAttendanceEvent}
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
              Les actions live de match peuvent être appliquées aux stats joueurs depuis
              les écrans Matchs (but, passe, cartons, remplacements).
            </Text>
            <View style={styles.infoBox}>
              <Icon name="document" size={18} color={colors.accent} />
              <Text style={styles.infoText}>
                Base prête: lineup, live actions et agrégation automatique vers les stats saison.
              </Text>
            </View>
            <View style={styles.inlineBtns}>
              <MiniBtn
                label={reportLocked ? 'Rapport verrouillé' : 'Ajouter stat joueur #1'}
                onPress={() => void addQuickPlayerStat()}
              />
              <MiniBtn label="Exporter rapport match" onPress={exportMatchReport} />
              <MiniBtn label="Partager rapport" onPress={() => void shareMatchReport()} />
            </View>
            {selectedStatPlayer && statsEvent ? (
              <View style={styles.inlineBlock}>
                <Text style={styles.inlineTitle}>Édition feuille joueur</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.inlineBtns}>
                    {statPlayers.slice(0, 8).map((p) => (
                      <MiniBtn
                        key={p.uid}
                        label={p.display_name}
                        onPress={() => setSelectedStatUid(p.uid)}
                      />
                    ))}
                  </View>
                </ScrollView>
                <Text style={styles.rowSub}>Joueur sélectionné: {selectedStatPlayer.display_name}</Text>
                <View style={styles.inlineBtns}>
                  <MiniBtn label={reportLocked ? 'Locked' : '+15 min'} onPress={() => void updateSelectedStat({ minutes_played: Math.min(120, (statsEvent.player_match_stats?.[selectedStatPlayer.uid]?.minutes_played ?? 0) + 15) })} />
                  <MiniBtn label={reportLocked ? 'Locked' : '+1 but'} onPress={() => void updateSelectedStat({ goals: (statsEvent.player_match_stats?.[selectedStatPlayer.uid]?.goals ?? 0) + 1 })} />
                  <MiniBtn label={reportLocked ? 'Locked' : '+1 passe'} onPress={() => void updateSelectedStat({ assists: (statsEvent.player_match_stats?.[selectedStatPlayer.uid]?.assists ?? 0) + 1 })} />
                </View>
                <View style={styles.inlineBtns}>
                  <MiniBtn label={reportLocked ? 'Locked' : '+0.5 note'} onPress={() => void updateSelectedStat({ rating: Math.min(10, Number(((statsEvent.player_match_stats?.[selectedStatPlayer.uid]?.rating ?? 6) + 0.5).toFixed(1))) })} />
                  <MiniBtn label={reportLocked ? 'Locked' : '+1 jaune'} onPress={() => void updateSelectedStat({ yellow_cards: (statsEvent.player_match_stats?.[selectedStatPlayer.uid]?.yellow_cards ?? 0) + 1 })} />
                  <MiniBtn label={reportLocked ? 'Locked' : '+1 rouge'} onPress={() => void updateSelectedStat({ red_cards: (statsEvent.player_match_stats?.[selectedStatPlayer.uid]?.red_cards ?? 0) + 1 })} />
                </View>
              </View>
            ) : null}
            {statsEvent ? (
              <>
                <TouchableOpacity
                  style={[styles.primaryBtn, statsEvent.match_report_finalized_at && styles.primaryBtnDone]}
                  onPress={() => void finalizeReport()}
                  disabled={Boolean(statsEvent.match_report_finalized_at)}
                >
                  <Text style={styles.primaryBtnText}>
                    {statsEvent.match_report_finalized_at ? 'Rapport validé' : 'Valider le rapport d’après-match'}
                  </Text>
                </TouchableOpacity>
                {statsEvent.match_report_finalized_at ? (
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => void unlockReport()}
                    disabled={!canManageFinalizedReport}
                  >
                    <Text style={styles.secondaryBtnText}>
                      {canManageFinalizedReport
                        ? 'Déverrouiller le rapport'
                        : 'Rapport verrouillé (staff uniquement)'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </>
            ) : null}
            <View style={styles.inlineBlock}>
              <Text style={styles.inlineTitle}>Top buteurs (live)</Text>
              {topStats.topGoals.length ? (
                topStats.topGoals.map(([name, n]) => (
                  <Row key={`g-${name}`} title={name} subtitle="Buts" right={String(n)} />
                ))
              ) : (
                <Text style={styles.empty}>Aucun but live enregistré pour le moment.</Text>
              )}
            </View>
            <View style={styles.inlineBlock}>
              <Text style={styles.inlineTitle}>Top passeurs (live)</Text>
              {topStats.topAssists.length ? (
                topStats.topAssists.map(([name, n]) => (
                  <Row key={`a-${name}`} title={name} subtitle="Passes décisives" right={String(n)} />
                ))
              ) : (
                <Text style={styles.empty}>Aucune passe live enregistrée pour le moment.</Text>
              )}
            </View>
          </View>
        ) : null}

        {!loading && tab === 'payments' ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Cotisations / trésorerie</Text>
            <Row title="Attendu" subtitle="Total des demandes" right={`${paymentStats.expected} EUR`} />
            <Row title="Reçu" subtitle="Paiements validés" right={`${paymentStats.received} EUR`} />
            <Row title="En retard" subtitle="Demandes late" right={String(paymentStats.late)} />
            <TouchableOpacity style={styles.primaryBtn} onPress={() => void createBulkPayments()}>
              <Text style={styles.primaryBtnText}>Cotisation pour tout l&apos;effectif</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => void createQuickPayment()}>
              <Text style={styles.secondaryBtnText}>Cotisation rapide (1 membre)</Text>
            </TouchableOpacity>
            <View style={styles.inlineBtns}>
              <MiniBtn label="Marquer retards" onPress={() => void markOverdue()} />
              <MiniBtn label="Exporter CSV" onPress={() => void exportFinanceCsv()} />
            </View>
            {payments.slice(0, 4).map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.paymentRow}
                onPress={() => void (p.status !== 'paid' ? markPaid(p) : Promise.resolve())}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{p.member_name}</Text>
                  <Text style={styles.rowSub}>{p.label}</Text>
                </View>
                <Text style={styles.rowRight}>
                  {p.amount_eur} EUR · {p.status}
                  {p.payment_method === 'stripe' ? ' · Stripe' : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

const TabBtn: React.FC<{
  id: TeamTab;
  label: string;
  tab: TeamTab;
  setTab: (t: TeamTab) => void;
}> = ({ id, label, tab, setTab }) => (
  <TouchableOpacity
    style={[styles.tabBtn, tab === id && styles.tabBtnOn]}
    onPress={() => setTab(id)}
  >
    <Text style={[styles.tabText, tab === id && styles.tabTextOn]}>{label}</Text>
  </TouchableOpacity>
);

const Kpi: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.kpi}>
    <Text style={styles.kpiValue}>{value}</Text>
    <Text style={styles.kpiLabel}>{label}</Text>
  </View>
);

const Row: React.FC<{ title: string; subtitle: string; right: string }> = ({
  title,
  subtitle,
  right,
}) => (
  <View style={styles.row}>
    <View style={{ flex: 1 }}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowSub}>{subtitle}</Text>
    </View>
    <Text style={styles.rowRight}>{right}</Text>
  </View>
);

const MiniBtn: React.FC<{ label: string; onPress: () => void }> = ({ label, onPress }) => (
  <TouchableOpacity style={styles.miniBtn} onPress={onPress}>
    <Text style={styles.miniBtnText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  hero: {
    backgroundColor: colors.surfaceInverse,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  heroTitle: { color: colors.brandInverse, fontSize: 18, fontWeight: '900' },
  heroSub: { color: colors.heroMuted, fontSize: 12, marginTop: spacing.xs, lineHeight: 18 },
  kpiRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  planningKpiRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  kpi: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.md, padding: spacing.sm },
  kpiValue: { color: colors.brandInverse, fontSize: 17, fontWeight: '900' },
  kpiLabel: { color: colors.heroMuted, fontSize: 10, marginTop: 2 },
  tabs: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md, flexWrap: 'wrap' },
  tabBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabBtnOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  tabText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  tabTextOn: { color: colors.brandInverse },
  createEventBtn: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  createEventBtnText: { color: colors.brandInverse, fontWeight: '800', fontSize: 13 },
  secondaryHubBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryHubBtnText: { color: colors.text, fontWeight: '800', fontSize: 13 },
  rowTouchable: { marginHorizontal: -spacing.xs },
  loader: { marginVertical: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: spacing.xs },
  empty: { color: colors.textMuted, fontSize: 12, marginTop: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  rowTitle: { color: colors.text, fontWeight: '700', fontSize: 13 },
  rowSub: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  rowRight: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  body: { color: colors.textSecondary, fontSize: 12, lineHeight: 19, marginBottom: spacing.sm },
  infoBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'flex-start',
  },
  infoText: { flex: 1, color: colors.textSecondary, fontSize: 11, lineHeight: 17 },
  primaryBtn: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginVertical: spacing.sm,
  },
  primaryBtnText: { color: colors.brandInverse, fontSize: 13, fontWeight: '800' },
  primaryBtnDone: { opacity: 0.7 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  secondaryBtnText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  inlineBlock: {
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  inlineTitle: { color: colors.text, fontSize: 12, fontWeight: '800', marginBottom: spacing.xs },
  inlineBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  miniBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  miniBtnText: { fontSize: 10, fontWeight: '700', color: colors.textSecondary },
});
