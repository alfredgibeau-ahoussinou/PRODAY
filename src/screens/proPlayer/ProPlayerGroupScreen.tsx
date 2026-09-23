import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { usePlayerTheme, usePlayerThemeColors } from '../../context/PlayerThemeContext';
import { TabScreenShell } from '../../components/app/TabScreenShell';
import { ProDayText } from '../../components/ui/ProDayText';
import { PressableSpring } from '../../components/motion';
import { MatchNextUpCard } from '../../components/matchs/MatchNextUpCard';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { CrestWatermark } from '../joueur/PlayerSaisonIcons';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { usersService } from '../../services/users.service';
import { clubsService } from '../../services/clubs.service';
import { teamEventsService } from '../../services/teamEvents.service';
import type { User } from '../../models/User';
import {
  EVENT_TYPE_LABELS,
  isCoachMatchEvent,
  userRsvp,
  type RsvpStatus,
  type TeamEvent,
} from '../../models/TeamEvent';
import { colors } from '../../theme/designTokens';

type PositionFilter = 'all' | 'gk' | 'def' | 'mid' | 'att';

/** Statut affiché : RSVP réel de l'événement, ou null si le membre n'est pas convoqué. */
type SquadStatus = 'yes' | 'maybe' | 'no' | 'pending' | null;

interface SquadMember {
  uid: string;
  name: string;
  posLabel: string | null;
  group: Exclude<PositionFilter, 'all'>;
  ovr: number | null;
}

const STAFF_ROLES: ReadonlySet<string> = new Set(['coach', 'physio', 'club', 'agent']);

const STAFF_ROLE_LABELS: Record<string, string> = {
  coach: 'Coach',
  physio: 'Kinésithérapeute',
  club: 'Dirigeant',
  agent: 'Agent',
};

/** Classe la position déclarée dans un groupe de filtre (affichage : libellé brut, jamais réinventé). */
function positionGroup(position: string | undefined): Exclude<PositionFilter, 'all'> {
  const p = (position ?? '').toLowerCase();
  if (!p) return 'mid';
  if (/gb|gardien|goal/.test(p)) return 'gk';
  if (/dc|dg|dd|déf|def|lat[ée]ral|central|axe/.test(p)) return 'def';
  if (/m(dc|c|oc)?|milieu/.test(p)) return 'mid';
  if (/bu|attaquant|ailier|avant|ag|ad/.test(p)) return 'att';
  return 'mid';
}

/** Statut de convocation réel => pill d'affichage. Les retards annoncés comptent comme présents. */
function toSquadStatus(status: RsvpStatus): Exclude<SquadStatus, null> {
  if (status === 'yes' || status === 'late_under_10' || status === 'late_over_10' || status === 'late_unknown') {
    return 'yes';
  }
  if (status === 'no') return 'no';
  if (status === 'maybe') return 'maybe';
  return 'pending';
}

const STATUS_PILL: Record<
  Exclude<SquadStatus, null>,
  { label: string; color: string; icon: 'checkmark-circle' | 'time' | 'close-circle' | 'help-circle' }
> = {
  yes: { label: 'Présent', color: '#22C55E', icon: 'checkmark-circle' },
  maybe: { label: 'Incertain', color: '#F59E0B', icon: 'time' },
  no: { label: 'Absent', color: '#EF4444', icon: 'close-circle' },
  pending: { label: 'En attente', color: '#9CA3AF', icon: 'help-circle' },
};

/**
 * Onglet Groupe / Équipe Pro — cockpit construit exclusivement sur les données
 * persistées : convocations & scores réels (`TeamEvent`), effectif réel
 * (membres actifs du club), club vérifié (`clubs/{id}`), staff réel (rôles
 * coach/physio/dirigeant/agent). Champs absents => état vide ou « — », jamais
 * de donnée inventée.
 */
export const ProPlayerGroupScreen: React.FC = () => {
  const profile = useSessionProfile();
  const playerThemeCtx = usePlayerTheme();
  const themeColors = usePlayerThemeColors();
  const nav = useTabNavigationActions();
  const { data, refresh } = useDashboardData(profile);

  const [refreshing, setRefreshing] = useState(false);
  const [posFilter, setPosFilter] = useState<PositionFilter>('all');
  const [rsvpBusy, setRsvpBusy] = useState(false);
  /** null = chargement, [] = aucun membre, erreur = service injoignable. */
  const [members, setMembers] = useState<User[] | null>(null);
  const [rosterError, setRosterError] = useState(false);
  const [clubVerified, setClubVerified] = useState<boolean | null>(null);

  const accent = themeColors.accent;
  const clubId = profile?.profile.club_id ?? '';
  const teamName = playerThemeCtx.clubName || profile?.profile.club_id || 'Mon équipe';

  // --- Effectif réel du club (membres actifs) + blason vérifié -----------------
  useEffect(() => {
    let alive = true;
    if (!clubId) {
      setMembers([]);
      setClubVerified(null);
      return;
    }
    setMembers(null);
    setRosterError(false);
    usersService
      .listMembersByClubId(clubId)
      .then(async (rows) => {
        if (!alive) return;
        setMembers(rows);
        try {
          const club = await clubsService.getById(clubId);
          if (alive) setClubVerified(Boolean(club?.verified));
        } catch {
          if (alive) setClubVerified(null);
        }
      })
      .catch(() => {
        if (!alive) return;
        setMembers([]);
        setRosterError(true);
      });
    return () => {
      alive = false;
    };
  }, [clubId]);

  // --- Matchs réels : à venir / terminés avec score enregistré -----------------
  const matchEvents = useMemo(
    () =>
      data.teamEvents
        .filter((e) => isCoachMatchEvent(e))
        .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime()),
    [data.teamEvents],
  );

  const nextMatchEvent = useMemo(
    () => matchEvents.find((e) => e.starts_at.getTime() >= Date.now() - 2 * 3600 * 1000) ?? null,
    [matchEvents],
  );

  const recentFinished = useMemo(
    () =>
      matchEvents
        .filter((e) => e.starts_at.getTime() < Date.now() && e.live_state)
        .reverse()
        .slice(0, 5),
    [matchEvents],
  );

  const seasonStats = useMemo(() => {
    let played = 0;
    let w = 0;
    let d = 0;
    let l = 0;
    for (const e of matchEvents) {
      if (e.starts_at.getTime() >= Date.now()) continue;
      const ls = e.live_state;
      if (!ls) continue; // pas de score enregistré : pas de bilan inventé
      played += 1;
      if (ls.home_score > ls.away_score) w += 1;
      else if (ls.home_score === ls.away_score) d += 1;
      else l += 1;
    }
    return { played, w, d, l, pts: w * 3 + d };
  }, [matchEvents]);

  const nextMatchItem = useMemo(() => {
    if (!nextMatchEvent) return null;
    return {
      id: nextMatchEvent.id,
      team_event_id: nextMatchEvent.id,
      kind: 'team_event' as const,
      title: nextMatchEvent.title || EVENT_TYPE_LABELS[nextMatchEvent.event_type],
      subtitle: EVENT_TYPE_LABELS[nextMatchEvent.event_type],
      starts_at: nextMatchEvent.starts_at,
      city: nextMatchEvent.city || nextMatchEvent.location_label || '',
    };
  }, [nextMatchEvent]);

  const myRsvp: RsvpStatus | null = useMemo(
    () => (nextMatchEvent && profile ? userRsvp(nextMatchEvent, profile.uid) : null),
    [nextMatchEvent, profile],
  );

  const handleRsvp = async (status: RsvpStatus) => {
    if (!nextMatchEvent || !profile?.uid) return;
    setRsvpBusy(true);
    try {
      await teamEventsService.updateRsvp(nextMatchEvent.id, profile.uid, status);
      await refresh();
    } catch (e) {
      Alert.alert(
        'Erreur',
        e instanceof Error && e.message.trim() ? e.message : 'Réponse non enregistrée. Réessaie.',
      );
      await refresh(); // resynchronise sur la vérité du service
    } finally {
      setRsvpBusy(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  // --- Roster réel -------------------------------------------------------------
  const squad: SquadMember[] = useMemo(
    () =>
      (members ?? []).map((m) => ({
        uid: m.uid,
        name: m.display_name,
        posLabel: m.profile?.position?.trim() || null,
        group: positionGroup(m.profile?.position),
        ovr: m.profile?.rating ?? null,
      })),
    [members],
  );

  const squadStatuses = useMemo(() => {
    const map = new Map<string, Exclude<SquadStatus, null>>();
    if (!nextMatchEvent) return map;
    for (const m of squad) {
      if (!nextMatchEvent.invitee_uids.includes(m.uid)) continue;
      map.set(m.uid, toSquadStatus(userRsvp(nextMatchEvent, m.uid)));
    }
    return map;
  }, [squad, nextMatchEvent]);

  const confirmedCount = useMemo(() => {
    let yes = 0;
    let invited = 0;
    squadStatuses.forEach((s) => {
      invited += 1;
      if (s === 'yes') yes += 1;
    });
    return { yes, invited };
  }, [squadStatuses]);

  const filteredSquad = useMemo(() => {
    if (posFilter === 'all') return squad;
    return squad.filter((p) => p.group === posFilter);
  }, [squad, posFilter]);

  const staff = useMemo(
    () => (members ?? []).filter((m) => STAFF_ROLES.has(m.role)),
    [members],
  );

  if (!profile) return null;

  return (
    <TabScreenShell
      caption="GROUPE · ÉQUIPE PRO"
      title={teamName}
      subtitle="Effectif · Prochain match · Vestiaire"
      flat
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: TAB_BAR_CONTENT_INSET + 28 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={accent} />
        }
      >
        {/* 1. HERO IDENTITÉ ÉQUIPE */}
        <View style={[styles.teamHeroCard, { borderColor: `${accent}40` }]}>
          <View style={styles.heroTopRow}>
            <View style={[styles.crestContainer, { borderColor: `${accent}60`, backgroundColor: `${accent}18` }]}>
              <CrestWatermark width={34} height={40} color={accent} opacity={0.95} />
            </View>

            <View style={styles.heroMetaCol}>
              <ProDayText style={styles.heroTeamName} numberOfLines={1}>
                {teamName}
              </ProDayText>
              <ProDayText style={styles.heroSubMeta}>
                {members === null
                  ? 'Chargement de l’effectif…'
                  : `${members.length} membre${members.length > 1 ? 's' : ''} rattaché${members.length > 1 ? 's' : ''}`}
              </ProDayText>
              {clubVerified ? (
                <View style={styles.licenseBadgeRow}>
                  <View style={[styles.licensePill, { backgroundColor: '#22C55E1C', borderColor: '#22C55E60' }]}>
                    <Ionicons name="shield-checkmark" size={11} color="#22C55E" />
                    <ProDayText style={[styles.licenseText, { color: '#22C55E' }]}>Club vérifié</ProDayText>
                  </View>
                </View>
              ) : null}
            </View>
          </View>

          {/* Bilan saison — uniquement sur les scores réellement enregistrés */}
          {seasonStats.played > 0 ? (
            <View style={styles.seasonStatsStrip}>
              <View style={styles.statCol}>
                <ProDayText style={styles.statVal}>{seasonStats.played}</ProDayText>
                <ProDayText style={styles.statLbl}>Matchs</ProDayText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <ProDayText style={[styles.statVal, { color: '#22C55E' }]}>{seasonStats.w}</ProDayText>
                <ProDayText style={styles.statLbl}>Victoires</ProDayText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <ProDayText style={[styles.statVal, { color: '#9CA3AF' }]}>{seasonStats.d}</ProDayText>
                <ProDayText style={styles.statLbl}>Nuls</ProDayText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <ProDayText style={[styles.statVal, { color: '#EF4444' }]}>{seasonStats.l}</ProDayText>
                <ProDayText style={styles.statLbl}>Défaites</ProDayText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <ProDayText style={[styles.statVal, { color: accent }]}>{seasonStats.pts}</ProDayText>
                <ProDayText style={styles.statLbl}>Points</ProDayText>
              </View>
            </View>
          ) : null}
        </View>

        {/* 2. PROCHAIN MATCH RÉEL */}
        {nextMatchItem && nextMatchEvent ? (
          <MatchNextUpCard
            item={nextMatchItem}
            onPress={() => nav.openTeamEvent(nextMatchEvent.id)}
            onRsvp={handleRsvp}
            onOpenCarpool={() =>
              nav.openCarpool({ chapter: 'reserver', eventId: nextMatchEvent.id })
            }
            currentRsvp={myRsvp}
            rsvpBusy={rsvpBusy}
          />
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={22} color="#8B8B9A" />
            <ProDayText style={styles.emptyTitle}>Aucun match programmé</ProDayText>
            <ProDayText style={styles.emptyBody}>
              Les convocations apparaîtront ici dès qu’un match sera créé par le staff.
            </ProDayText>
          </View>
        )}

        {/* 3. DERNIERS SCORES ENREGISTRÉS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <View style={styles.tagRow}>
                <Ionicons name="trending-up" size={13} color={accent} />
                <ProDayText style={[styles.sectionKicker, { color: accent }]}>DYNAMIQUE DU GROUPE</ProDayText>
              </View>
              <ProDayText style={styles.sectionTitle}>Derniers scores enregistrés</ProDayText>
            </View>
          </View>

          {recentFinished.length === 0 ? (
            <ProDayText style={styles.emptyInline}>
              Aucun score enregistré pour l’instant. Les résultats apparaissent dès la saisie du staff.
            </ProDayText>
          ) : (
            <View style={styles.formRow}>
              {recentFinished.map((e) => {
                const ls = e.live_state!;
                const result = ls.home_score > ls.away_score ? 'V' : ls.home_score === ls.away_score ? 'N' : 'D';
                return (
                  <View key={e.id} style={styles.formItem}>
                    <View
                      style={[
                        styles.formBadge,
                        {
                          backgroundColor: result === 'V' ? '#22C55E20' : '#9CA3AF20',
                          borderColor: result === 'V' ? '#22C55E60' : '#9CA3AF60',
                        },
                      ]}
                    >
                      <ProDayText
                        style={[styles.formResultText, { color: result === 'V' ? '#22C55E' : '#9CA3AF' }]}
                      >
                        {result}
                      </ProDayText>
                    </View>
                    <ProDayText style={styles.formScore}>
                      {ls.home_score} - {ls.away_score}
                    </ProDayText>
                    <ProDayText numberOfLines={1} style={styles.formOpponent}>
                      {ls.opponent_name || e.title || '—'}
                    </ProDayText>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* 4. EFFECTIF RÉEL & CONVOCATIONS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <View style={styles.tagRow}>
                <View style={[styles.tagDot, { backgroundColor: accent }]} />
                <ProDayText style={[styles.sectionKicker, { color: accent }]}>EFFECTIF</ProDayText>
              </View>
              <ProDayText style={styles.sectionTitle}>
                Roster du groupe ({squad.length} joueur{squad.length > 1 ? 's' : ''})
              </ProDayText>
            </View>

            {nextMatchEvent && confirmedCount.invited > 0 ? (
              <View style={[styles.confirmedPill, { backgroundColor: `${accent}18`, borderColor: `${accent}40` }]}>
                <Ionicons name="checkmark-circle" size={12} color={accent} />
                <ProDayText style={[styles.confirmedText, { color: accent }]}>
                  {confirmedCount.yes}/{confirmedCount.invited} confirmés
                </ProDayText>
              </View>
            ) : null}
          </View>

          {members !== null && members.length > 0 ? (
            <>
              {/* Filtres par Poste */}
              <View style={styles.posFilterRow}>
                {[
                  { id: 'all' as const, label: 'Tous' },
                  { id: 'gk' as const, label: 'Gardiens' },
                  { id: 'def' as const, label: 'Défenseurs' },
                  { id: 'mid' as const, label: 'Milieux' },
                  { id: 'att' as const, label: 'Attaquants' },
                ].map((tab) => {
                  const active = posFilter === tab.id;
                  return (
                    <PressableSpring
                      key={tab.id}
                      onPress={() => {
                        prodayHaptics.press();
                        setPosFilter(tab.id);
                      }}
                      scaleTo={0.95}
                      haptic
                      style={[
                        styles.posTab,
                        active
                          ? [styles.posTabActive, { backgroundColor: `${accent}20`, borderColor: accent }]
                          : styles.posTabInactive,
                      ]}
                    >
                      <ProDayText style={[styles.posTabText, active && { color: accent, fontWeight: '800' }]}>
                        {tab.label}
                      </ProDayText>
                    </PressableSpring>
                  );
                })}
              </View>

              <View style={styles.squadList}>
                {filteredSquad.map((player) => {
                  const status = squadStatuses.get(player.uid) ?? null;
                  const pill = status ? STATUS_PILL[status] : null;
                  return (
                    <View key={player.uid} style={styles.playerRow}>
                      <View style={[styles.playerNumBox, { borderColor: `${accent}35` }]}>
                        <ProDayText style={[styles.playerNumVal, { color: accent }]}>
                          {player.name.charAt(0).toUpperCase()}
                        </ProDayText>
                      </View>

                      <View style={styles.playerMetaCol}>
                        <ProDayText style={styles.playerRowName} numberOfLines={1}>
                          {player.name}
                        </ProDayText>
                        <View style={styles.playerTagRow}>
                          {player.posLabel ? (
                            <View style={[styles.playerPosTag, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                              <ProDayText style={styles.playerPosText}>{player.posLabel}</ProDayText>
                            </View>
                          ) : null}
                          {player.ovr != null ? (
                            <ProDayText style={styles.playerOvrText}>Note {player.ovr}</ProDayText>
                          ) : null}
                        </View>
                      </View>

                      {pill ? (
                        <View style={[styles.statusPill, { backgroundColor: `${pill.color}18` }]}>
                          <Ionicons name={pill.icon} size={12} color={pill.color} />
                          <ProDayText style={[styles.statusPillText, { color: pill.color }]}>
                            {pill.label}
                          </ProDayText>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
                {filteredSquad.length === 0 ? (
                  <ProDayText style={styles.emptyInline}>Aucun joueur à ce poste.</ProDayText>
                ) : null}
              </View>
            </>
          ) : (
            <ProDayText style={styles.emptyInline}>
              {rosterError
                ? 'Impossible de charger l’effectif. Vérifie ta connexion et tire pour actualiser.'
                : members === null
                  ? 'Chargement de l’effectif…'
                  : 'Aucun membre rattaché à ce club pour l’instant.'}
            </ProDayText>
          )}
        </View>

        {/* 5. STAFF RÉEL */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <ProDayText style={[styles.sectionKicker, { color: accent }]}>ENCADREMENT</ProDayText>
              <ProDayText style={styles.sectionTitle}>Staff technique & médical</ProDayText>
            </View>
          </View>

          {staff.length === 0 ? (
            <ProDayText style={styles.emptyInline}>
              Aucun membre du staff renseigné dans le club pour l’instant.
            </ProDayText>
          ) : (
            <View style={styles.staffList}>
              {staff.map((st) => (
                <View key={st.uid} style={styles.staffRow}>
                  <View style={[styles.staffIconCircle, { backgroundColor: `${accent}16`, borderColor: `${accent}35` }]}>
                    <Ionicons name="person" size={15} color={accent} />
                  </View>
                  <View style={styles.staffMetaCol}>
                    <ProDayText style={styles.staffName} numberOfLines={1}>
                      {st.display_name}
                    </ProDayText>
                    <ProDayText style={styles.staffRole}>
                      {STAFF_ROLE_LABELS[st.role] ?? st.role}
                    </ProDayText>
                  </View>
                  <PressableSpring
                    onPress={() => nav.setActiveTab('messages')}
                    scaleTo={0.92}
                    haptic
                    style={styles.staffMsgBtn}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color="#9CA3AF" />
                  </PressableSpring>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </TabScreenShell>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    gap: 14,
    paddingTop: 6,
  },
  teamHeroCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.2,
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  crestContainer: {
    width: 58,
    height: 58,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMetaCol: {
    flex: 1,
    gap: 2,
  },
  heroTeamName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  heroSubMeta: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  licenseBadgeRow: {
    marginTop: 4,
  },
  licensePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  licenseText: {
    fontSize: 10,
    fontWeight: '800',
  },
  seasonStatsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundAlt,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statCol: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  statVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  statLbl: {
    fontSize: 9.5,
    color: '#71717A',
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionKicker: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  confirmedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  confirmedText: {
    fontSize: 11,
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyBody: {
    fontSize: 12,
    color: '#8B8B9A',
    textAlign: 'center',
  },
  emptyInline: {
    fontSize: 12,
    color: '#8B8B9A',
    lineHeight: 17,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  formItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  formBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formResultText: {
    fontSize: 13,
    fontWeight: '900',
  },
  formScore: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#E5E7EB',
  },
  formOpponent: {
    fontSize: 9,
    fontWeight: '600',
    color: '#71717A',
    maxWidth: 58,
    textAlign: 'center',
  },
  posFilterRow: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 2,
  },
  posTab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  posTabInactive: {
    backgroundColor: '#101016',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  posTabActive: {},
  posTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B8B9A',
  },
  squadList: {
    gap: 6,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  playerNumBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    backgroundColor: '#1A1A24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerNumVal: {
    fontSize: 13,
    fontWeight: '900',
  },
  playerMetaCol: {
    flex: 1,
    gap: 2,
  },
  playerRowName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  playerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerPosTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  playerPosText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#9CA3AF',
  },
  playerOvrText: {
    fontSize: 10,
    color: '#71717A',
    fontWeight: '600',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  staffList: {
    gap: 6,
  },
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.backgroundAlt,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  staffIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffMetaCol: {
    flex: 1,
    gap: 1,
  },
  staffName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  staffRole: {
    fontSize: 10.5,
    color: '#8B8B9A',
    fontWeight: '600',
  },
  staffMsgBtn: {
    padding: 6,
  },
});
