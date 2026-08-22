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
  ClubSectionCard,
  ClubText,
} from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import { ClubTrainingDayHero, ClubTrainingListRow } from '../../features/club/ui/ClubTrainingsDay';
import {
  buildClubTrainingCardModel,
  resolveClubTrainingHero,
  resolveTrainingActions,
  sortClubTrainings,
} from '../../features/club/ui/clubTrainingsModel';
import { PressableSpring, PushScreenTransition } from '../../components/motion';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { teamEventsService } from '../../services/teamEvents.service';
import {
  RSVP_STATUS_LABELS,
  userRsvp,
  type RsvpStatus,
  type TeamEvent,
} from '../../models/TeamEvent';
import { TeamEventDetailScreen } from '../TeamEventDetailScreen';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { clubRadius, clubSpace } from '../../features/club/theme/clubDesignSystem';

type PresenceChoice = 'present' | 'absent' | 'late_under_10' | 'late_over_10' | 'pending';

const PRESENCE_CHOICES: { id: PresenceChoice; label: string }[] = [
  { id: 'present', label: 'Présent' },
  { id: 'absent', label: 'Absent' },
  { id: 'late_under_10', label: 'Retard < 10' },
  { id: 'late_over_10', label: 'Retard ≥ 10' },
  { id: 'pending', label: 'En attente' },
];

function resolveInviteeUids(event: TeamEvent, fallback: string[]): string[] {
  if (event.invitee_uids?.length) return event.invitee_uids;
  return fallback;
}

function labelForUid(uid: string, names: Map<string, string>): string {
  return names.get(uid) ?? uid.slice(0, 8);
}

/**
 * Entraînements Club — hero séance + liste + feuille de présence RSVP
 * + détail événement existant (TeamEventDetailScreen).
 */
export function ClubTrainingsScreen() {
  const shellNav = useClubShellNav();
  const profile = useSessionProfile();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailEventId, setDetailEventId] = useState<string | null>(null);
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const nameByUid = useMemo(() => {
    const map = new Map<string, string>();
    ws.members.forEach((m) => map.set(m.uid, m.display_name));
    ws.players.forEach((p) => map.set(p.uid, p.display_name));
    return map;
  }, [ws.members, ws.players]);

  const trainings = useMemo(() => sortClubTrainings(ws.events), [ws.events]);
  const heroEvent = useMemo(() => resolveClubTrainingHero(trainings), [trainings]);
  const heroModel = useMemo(
    () => (heroEvent ? buildClubTrainingCardModel(heroEvent, ws.teamRows) : null),
    [heroEvent, ws.teamRows],
  );
  const listModels = useMemo(
    () =>
      trainings
        .filter((t) => t.id !== heroEvent?.id)
        .map((t) => buildClubTrainingCardModel(t, ws.teamRows)),
    [trainings, heroEvent?.id, ws.teamRows],
  );

  if (ws.loading) return <ClubLoading />;

  const selected = trainings.find((t) => t.id === selectedId) ?? null;
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

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubBrandHeader
          title="Entraînements"
          subtitle={
            heroModel?.isInProgress
              ? 'Séance en cours — présences & détail'
              : heroModel?.isToday
                ? 'Séance du jour — présences & retards'
                : 'Présences, retards et plan de séance'
          }
        />

        {trainings.length === 0 ? (
          <ClubEmptyState
            title="Aucune séance planifiée"
            body="Créez un entraînement pour suivre les présences (Présent / Absent / Retard / En attente)."
            actionLabel="Créer une séance"
            onAction={() => shellNav?.openCreate?.('training')}
            icon="football"
          />
        ) : (
          <View style={styles.list}>
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
          </View>
        )}

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
            <ClubText variant="body" muted>
              Marquez chaque joueur. Retard &lt; 10 min ou ≥ 10 min.
            </ClubText>
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
                  </View>
                );
              })
            )}
          </ClubSectionCard>
        ) : trainings.length > 0 ? (
          <ClubText variant="caption" muted style={styles.hintIdle}>
            Choisissez une séance pour ouvrir la feuille de présence.
          </ClubText>
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
  });
