/**
 * Pôle Club — Entraînements, Terrains & Suivi Technique (RTJ).
 * Vue cohérente avec le reste du Club : onglets Planning Terrains / Suivi RTJ /
 * Séances, filtres de statut (programmée · terminée · annulée), recherche,
 * feuille de présence et actions staff explicites (annuler · reporter · rétablir).
 *
 * Permissions : la gestion (annulation / report / pointage) reste réservée au
 * staff via `canManageTeamEvent` — le compte club voit, ne pilote pas.
 * Les commentaires DT internes restent dans le module Suivi (lecture seule).
 */
import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import {
  ClubChapterScroll,
  ClubEmptyState,
  ClubLoading,
  ClubPresenceBar,
  ClubSearchField,
  ClubSectionCard,
  ClubSegmentedControl,
  ClubText,
} from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import { ClubPitchSchedule } from '../../features/club/ui/ClubPitchSchedule';
import { ClubTrainingsOversight } from '../../features/club/ui/ClubTrainingsOversight';
import { ClubTrainingDayHero, ClubTrainingListRow } from '../../features/club/ui/ClubTrainingsDay';
import {
  buildClubTrainingCardModel,
  filterClubTrainingsByStatus,
  resolveClubTrainingHero,
  resolveTrainingActions,
  sortClubTrainings,
  type ClubTrainingStatusFilter,
} from '../../features/club/ui/clubTrainingsModel';
import { PressableSpring, PushScreenTransition } from '../../components/motion';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { teamEventsService } from '../../services/teamEvents.service';
import {
  buildSessionCheckIns,
  buildPitchFacilities,
} from '../../utils/clubHubRealData';
import {
  isSessionCancelled,
  RSVP_STATUS_LABELS,
  userRsvp,
  type RsvpStatus,
  type TeamEvent,
} from '../../models/TeamEvent';
import { canManageTeamEvent } from '../../utils/teamEventAccess';
import { TeamEventDetailScreen } from '../TeamEventDetailScreen';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { clubRadius, clubSpace } from '../../features/club/theme/clubDesignSystem';

type TrainingsTab = 'pitches' | 'oversight' | 'sessions';
type PresenceChoice = 'present' | 'absent' | 'late_under_10' | 'late_over_10' | 'pending';

const PRESENCE_CHOICES: { id: PresenceChoice; label: string }[] = [
  { id: 'present', label: 'Présent' },
  { id: 'absent', label: 'Absent' },
  { id: 'late_under_10', label: 'Retard < 10' },
  { id: 'late_over_10', label: 'Retard ≥ 10' },
  { id: 'pending', label: 'En attente' },
];

const STATUS_FILTER_OPTIONS: { id: ClubTrainingStatusFilter; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'upcoming', label: 'Programmées' },
  { id: 'completed', label: 'Terminées' },
  { id: 'cancelled', label: 'Annulées' },
];

function resolveInviteeUids(event: TeamEvent, fallback: string[]): string[] {
  if (event.invitee_uids?.length) return event.invitee_uids;
  return fallback;
}

function labelForUid(uid: string, names: Map<string, string>): string {
  return names.get(uid) ?? uid.slice(0, 8);
}

export function ClubTrainingsScreen() {
  const shellNav = useClubShellNav();
  const profile = useSessionProfile();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const [activeTab, setActiveTab] = useState<TrainingsTab>('pitches');
  const [statusFilter, setStatusFilter] = useState<ClubTrainingStatusFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailEventId, setDetailEventId] = useState<string | null>(null);
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [sessionBusy, setSessionBusy] = useState(false);
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const nameByUid = useMemo(() => {
    const map = new Map<string, string>();
    ws.members.forEach((m) => map.set(m.uid, m.display_name));
    ws.players.forEach((p) => map.set(p.uid, p.display_name));
    return map;
  }, [ws.members, ws.players]);

  const trainings = useMemo(() => sortClubTrainings(ws.events), [ws.events]);

  const searchFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return trainings;
    return trainings.filter((t) => {
      const team = t.team_id
        ? ws.teamRows.find((r) => r.teamId === t.team_id)?.name ?? ''
        : '';
      const haystack = `${t.title} ${t.location_label ?? ''} ${t.city ?? ''} ${team} ${t.organizer_name ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [trainings, search, ws.teamRows]);

  const filteredTrainings = useMemo(
    () => filterClubTrainingsByStatus(searchFiltered, statusFilter),
    [searchFiltered, statusFilter],
  );

  const counts = useMemo(() => {
    const cancelled = trainings.filter((t) => isSessionCancelled(t)).length;
    const completed = trainings.filter((t) => {
      const start = t.starts_at?.getTime() ?? 0;
      return !isSessionCancelled(t) && start < Date.now();
    }).length;
    return {
      cancelled,
      completed,
      upcoming: trainings.length - cancelled - completed,
    };
  }, [trainings]);

  const heroEvent = useMemo(() => resolveClubTrainingHero(filteredTrainings), [filteredTrainings]);

  // Données réelles pour le suivi DT et le planning des terrains (aucune démo).
  const teamNamesById = useMemo(
    () => new Map(ws.teamRows.map((t) => [t.teamId, t.name])),
    [ws.teamRows],
  );
  const memberNamesByUid = useMemo(
    () => new Map(ws.members.map((m) => [m.uid, m.display_name])),
    [ws.members],
  );
  const sessionCheckIns = useMemo(
    () => buildSessionCheckIns(ws.events, teamNamesById, memberNamesByUid),
    [ws.events, teamNamesById, memberNamesByUid],
  );
  const pitchFacilities = useMemo(
    () => buildPitchFacilities(ws.events, teamNamesById),
    [ws.events, teamNamesById],
  );
  const heroModel = useMemo(
    () => (heroEvent ? buildClubTrainingCardModel(heroEvent, ws.teamRows) : null),
    [heroEvent, ws.teamRows],
  );
  const listModels = useMemo(
    () =>
      filteredTrainings
        .filter((t) => t.id !== heroEvent?.id)
        .map((t) => buildClubTrainingCardModel(t, ws.teamRows)),
    [filteredTrainings, heroEvent?.id, ws.teamRows],
  );

  const selected = filteredTrainings.find((t) => t.id === selectedId)
    ?? trainings.find((t) => t.id === selectedId)
    ?? null;

  /** Peut-on gérer cette séance ? (staff coach/organisateur — pas le compte club vitrine) */
  const canManageSelected = useMemo(() => {
    if (!profile || !selected) return false;
    return canManageTeamEvent(selected, profile);
  }, [profile, selected]);

  if (ws.loading) return <ClubLoading />;

  const fallbackUids = ws.players.map((p) => p.uid);
  const roster = selected ? resolveInviteeUids(selected, fallbackUids) : [];

  const openPresence = (eventId: string) => {
    setSelectedId(eventId);
  };

  const openDetail = (eventId: string) => {
    setDetailEventId(eventId);
  };

  const setPresence = async (uid: string, choice: PresenceChoice) => {
    if (!profile || !selected) return;
    setBusyUid(uid);
    try {
      const actor = { user: profile };
      if (choice === 'late_under_10') {
        await teamEventsService.reportLate(selected.id, uid, 'under_10', {
          playerName: labelForUid(uid, nameByUid),
        });
      } else if (choice === 'late_over_10') {
        await teamEventsService.reportLate(selected.id, uid, 'over_10', {
          playerName: labelForUid(uid, nameByUid),
        });
      } else if (choice === 'present') {
        await teamEventsService.updateRsvpAsStaff(selected.id, uid, 'yes', actor);
        await teamEventsService.markAttendance(selected.id, uid, 'present', actor);
      } else if (choice === 'absent') {
        await teamEventsService.updateRsvpAsStaff(selected.id, uid, 'no', actor);
        await teamEventsService.markAttendance(selected.id, uid, 'absent', actor);
      } else {
        await teamEventsService.updateRsvpAsStaff(selected.id, uid, 'pending', actor);
      }
      await ws.refresh();
    } catch (e) {
      Alert.alert('Présence', e instanceof Error ? e.message : 'Mise à jour impossible.');
    } finally {
      setBusyUid(null);
    }
  };

  /** Staff — annule la séance sélectionnée avec motif. */
  const cancelSelectedSession = () => {
    if (!profile || !selected) return;
    Alert.prompt?.('Annuler la séance', 'Motif visible par les convoqués :', [
      { text: 'Retour', style: 'cancel' },
      {
        text: 'Annuler la séance',
        style: 'destructive',
        onPress: (reason?: string) => {
          void (async () => {
            setSessionBusy(true);
            try {
              await teamEventsService.cancelSession(selected.id, { user: profile }, reason);
              await ws.refresh();
            } catch (e) {
              Alert.alert('Annulation', e instanceof Error ? e.message : 'Action impossible.');
            } finally {
              setSessionBusy(false);
            }
          })();
        },
      },
    ]) ?? (() => {
      // Fallback plateformes sans Alert.prompt : confirmation simple.
      Alert.alert('Annuler la séance', 'Les convoqués seront notifiés.', [
        { text: 'Retour', style: 'cancel' },
        {
          text: 'Annuler la séance',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setSessionBusy(true);
              try {
                await teamEventsService.cancelSession(
                  selected.id,
                  { user: profile },
                  'Annulée par le staff',
                );
                await ws.refresh();
              } catch (e) {
                Alert.alert('Annulation', e instanceof Error ? e.message : 'Action impossible.');
              } finally {
                setSessionBusy(false);
              }
            })();
          },
        },
      ]);
    })();
  };

  /** Staff — rétablit une séance annulée. */
  const restoreSelectedSession = () => {
    if (!profile || !selected) return;
    void (async () => {
      setSessionBusy(true);
      try {
        await teamEventsService.restoreCancelledSession(selected.id, { user: profile });
        await ws.refresh();
        Alert.alert('Séance rétablie', 'La séance est de nouveau dans le planning.');
      } catch (e) {
        Alert.alert('Rétablissement', e instanceof Error ? e.message : 'Action impossible.');
      } finally {
        setSessionBusy(false);
      }
    })();
  };

  /** Staff — reporte d'une semaine (point d'entrée simple). */
  const postponeSelectedSession = () => {
    if (!profile || !selected) return;
    Alert.alert(
      'Reporter la séance',
      'Décaler la séance au même horaire, une semaine plus tard ?',
      [
        { text: 'Retour', style: 'cancel' },
        {
          text: 'Reporter +7 jours',
          onPress: () => {
            void (async () => {
              setSessionBusy(true);
              try {
                const next = new Date(selected.starts_at.getTime() + 7 * 24 * 60 * 60 * 1000);
                await teamEventsService.postponeSession(selected.id, next, { user: profile });
                await ws.refresh();
              } catch (e) {
                Alert.alert('Report', e instanceof Error ? e.message : 'Action impossible.');
              } finally {
                setSessionBusy(false);
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubBrandHeader
          title="Entraînements & Terrains"
          subtitle="Planning des créneaux · Suivi RTJ · Exercices & pointages"
        />

        {/* Sélecteur d'onglet tripartite */}
        <ClubSegmentedControl
          options={[
            { id: 'pitches' as const, label: 'Planning Terrains' },
            { id: 'oversight' as const, label: 'Suivi RTJ & Exercices' },
            { id: 'sessions' as const, label: `Séances (${trainings.length})` },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />

        {/* VUE 1 : PLANNING DES TERRAINS */}
        {activeTab === 'pitches' ? (
          <ClubPitchSchedule facilities={pitchFacilities} />
        ) : null}

        {/* VUE 2 : SUIVI RTJ & BIBLIOTHÈQUE D'EXERCICES */}
        {activeTab === 'oversight' ? (
          <ClubTrainingsOversight sessions={sessionCheckIns} />
        ) : null}

        {/* VUE 3 : CALENDRIER SÉANCES & POINTAGES */}
        {activeTab === 'sessions' ? (
          trainings.length === 0 ? (
            <ClubEmptyState
              title="Aucune séance planifiée"
              body="Créez un entraînement pour suivre les présences (Présent / Absent / Retard / En attente)."
              actionLabel="Créer une séance"
              onAction={() => shellNav?.openCreate?.('training')}
              icon="football"
            />
          ) : (
            <View style={styles.list}>
              {/* Recherche + filtres de statut */}
              <ClubSearchField
                value={search}
                onChangeText={setSearch}
                placeholder="Rechercher par équipe, lieu, intitulé…"
              />
              <ClubSegmentedControl
                options={STATUS_FILTER_OPTIONS.map((o) => ({
                  id: o.id,
                  label:
                    o.id === 'cancelled' && counts.cancelled > 0
                      ? `${o.label} (${counts.cancelled})`
                      : o.label,
                }))}
                value={statusFilter}
                onChange={setStatusFilter}
              />

              {filteredTrainings.length === 0 ? (
                <ClubEmptyState
                  title={
                    statusFilter === 'cancelled'
                      ? 'Aucune séance annulée'
                      : statusFilter === 'completed'
                        ? 'Aucune séance terminée'
                        : 'Aucun résultat'
                  }
                  body={
                    statusFilter === 'all'
                      ? 'Aucune séance ne correspond à la recherche.'
                      : 'Changez de filtre ou effacez la recherche pour voir les autres séances.'
                  }
                  icon="calendar"
                />
              ) : null}

              {heroModel && heroEvent ? (
                <ClubTrainingDayHero
                  model={heroModel}
                  actions={resolveTrainingActions(heroModel)}
                  onAction={(id) => {
                    if (id === 'presence') openPresence(heroEvent.id);
                    else openDetail(heroEvent.id);
                  }}
                />
              ) : null}

              {listModels.length > 0 ? (
                <View style={styles.sectionHead}>
                  <ClubText variant="label" muted style={styles.sectionLabel}>
                    {heroModel ? 'Autres séances' : 'Calendrier'}
                  </ClubText>
                  <ClubText variant="caption" muted>
                    {listModels.length}
                  </ClubText>
                </View>
              ) : null}

              {listModels.map((model, index) => (
                <ClubTrainingListRow
                  key={model.id}
                  model={model}
                  index={index}
                  selected={selectedId === model.id}
                  onOpenPresence={() => openPresence(model.id)}
                  onOpenDetail={() => openDetail(model.id)}
                />
              ))}

              {selected ? (
                <ClubSectionCard title={`Présences · ${selected.title || 'Séance'}`}>
                  {(() => {
                    const presentCount = roster.filter((uid) => {
                      const mark = selected.attendance_marks?.[uid];
                      const rsvp = userRsvp(selected, uid);
                      return mark === 'present' || rsvp === 'yes';
                    }).length;
                    return roster.length > 0 ? (
                      <ClubPresenceBar present={presentCount} total={roster.length} />
                    ) : null;
                  })()}

                  {isSessionCancelled(selected) ? (
                    <View style={[styles.cancelledBanner, { backgroundColor: tokens.dangerSoft }]}>
                      <ClubText variant="caption" style={{ color: tokens.danger, fontWeight: '700' }}>
                        Séance annulée{selected.live_state?.cancel_reason ? ` — ${selected.live_state.cancel_reason}` : ''}.
                        Les présences restent consultables pour l'historique.
                      </ClubText>
                    </View>
                  ) : (
                    <ClubText variant="body" muted>
                      Marquez chaque joueur. Retard &lt; 10 min ou ≥ 10 min.
                    </ClubText>
                  )}

                  <PressableSpring
                    onPress={() => openDetail(selected.id)}
                    scaleTo={0.97}
                    haptic
                    style={styles.detailLink}
                  >
                    <ClubText variant="caption" style={{ color: tokens.accent, fontWeight: '800' }}>
                      Ouvrir le détail de la séance
                    </ClubText>
                  </PressableSpring>

                  {roster.length === 0 ? (
                    <ClubText variant="caption" muted>
                      Aucun joueur convoqué. Invitez l’effectif ou créez une séance avec équipe.
                    </ClubText>
                  ) : (
                    roster.map((uid) => {
                      const rsvp = userRsvp(selected, uid);
                      const mark = selected.attendance_marks?.[uid];
                      const hint = mark
                        ? `Pointage : ${mark}`
                        : RSVP_STATUS_LABELS[rsvp as RsvpStatus] ?? 'En attente';
                      return (
                        <View key={uid} style={styles.playerBlock}>
                          <ClubText variant="body" style={{ fontWeight: '700' }}>
                            {labelForUid(uid, nameByUid)}
                          </ClubText>
                          <ClubText variant="caption" muted>
                            {hint}
                          </ClubText>
                          {canManageSelected && !isSessionCancelled(selected) ? (
                            <View style={styles.markRow}>
                              {PRESENCE_CHOICES.map((c) => {
                                const active =
                                  (c.id === 'present' && (mark === 'present' || rsvp === 'yes')) ||
                                  (c.id === 'absent' && (mark === 'absent' || rsvp === 'no')) ||
                                  (c.id === 'late_under_10' && rsvp === 'late_under_10') ||
                                  (c.id === 'late_over_10' && rsvp === 'late_over_10') ||
                                  (c.id === 'pending' && rsvp === 'pending' && !mark);
                                return (
                                  <PressableSpring
                                    key={c.id}
                                    onPress={() => void setPresence(uid, c.id)}
                                    scaleTo={0.94}
                                    haptic
                                    disabled={busyUid === uid}
                                    style={[styles.markBtn, active && styles.markBtnOn]}
                                  >
                                    <ClubText
                                      variant="caption"
                                      style={
                                        active
                                          ? { color: '#fff', fontWeight: '700', fontSize: 10 }
                                          : { fontWeight: '600', fontSize: 10 }
                                      }
                                    >
                                      {c.label}
                                    </ClubText>
                                  </PressableSpring>
                                );
                              })}
                            </View>
                          ) : null}
                        </View>
                      );
                    })
                  )}

                  {/* Actions staff explicites — même séance que Coach, droits gérés par le service */}
                  {canManageSelected && !sessionBusy ? (
                    <View style={styles.staffActions}>
                      <ClubText variant="label" muted>
                        Actions staff
                      </ClubText>
                      <View style={styles.markRow}>
                        {isSessionCancelled(selected) ? (
                          <PressableSpring
                            onPress={restoreSelectedSession}
                            scaleTo={0.95}
                            haptic
                            style={[styles.markBtn, { borderColor: tokens.success }]}
                          >
                            <ClubText variant="caption" style={{ color: tokens.success, fontWeight: '700', fontSize: 10 }}>
                              Rétablir la séance
                            </ClubText>
                          </PressableSpring>
                        ) : (
                          <>
                            <PressableSpring
                              onPress={postponeSelectedSession}
                              scaleTo={0.95}
                              haptic
                              style={styles.markBtn}
                            >
                              <ClubText variant="caption" style={{ fontWeight: '600', fontSize: 10 }}>
                                Reporter +7j
                              </ClubText>
                            </PressableSpring>
                            <PressableSpring
                              onPress={cancelSelectedSession}
                              scaleTo={0.95}
                              haptic
                              style={[styles.markBtn, { borderColor: tokens.danger }]}
                            >
                              <ClubText variant="caption" style={{ color: tokens.danger, fontWeight: '700', fontSize: 10 }}>
                                Annuler la séance
                              </ClubText>
                            </PressableSpring>
                          </>
                        )}
                      </View>
                    </View>
                  ) : null}
                  {sessionBusy ? (
                    <ClubText variant="caption" muted>
                      Mise à jour en cours…
                    </ClubText>
                  ) : null}
                </ClubSectionCard>
              ) : filteredTrainings.length > 0 ? (
                <ClubText variant="caption" muted style={styles.hintIdle}>
                  Choisissez une séance pour ouvrir la feuille de présence.
                </ClubText>
              ) : null}
            </View>
          )
        ) : null}
      </ClubChapterScroll>

      <PushScreenTransition active={detailEventId != null} backgroundColor={tokens.bg}>
        {detailEventId ? (
          <TeamEventDetailScreen
            eventId={detailEventId}
            onBack={() => {
              setDetailEventId(null);
              void ws.refresh();
            }}
          />
        ) : null}
      </PushScreenTransition>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    list: { gap: clubSpace.md },
    sectionHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: clubSpace.sm,
      marginTop: clubSpace.xs,
    },
    sectionLabel: {
      letterSpacing: 1.05,
      opacity: 0.92,
    },
    hintIdle: {
      textAlign: 'center',
      paddingVertical: clubSpace.sm,
    },
    detailLink: {
      alignSelf: 'flex-start',
      paddingVertical: 4,
    },
    cancelledBanner: {
      padding: clubSpace.md,
      borderRadius: clubRadius.sm,
    },
    playerBlock: {
      gap: 4,
      paddingVertical: clubSpace.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.border,
    },
    markRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
    markBtn: {
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: clubRadius.xs,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      backgroundColor: tokens.elevated,
    },
    markBtnOn: { backgroundColor: tokens.accent, borderColor: tokens.accent },
    staffActions: {
      gap: clubSpace.xs,
      paddingTop: clubSpace.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.border,
    },
  });
