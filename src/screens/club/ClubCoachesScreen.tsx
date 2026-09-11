import React, { useMemo, useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import {
  ClubActionRow,
  ClubChapterScroll,
  ClubEmptyState,
  ClubLoading,
  ClubSectionCard,
  ClubStatusPill,
  ClubText,
} from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import { ClubCoachListCard, ClubCoachesGapHero } from '../../features/club/ui/ClubCoachesChrome';
import {
  buildClubCoachListItems,
  listTeamsWithoutCoach,
  preferCoachForAssignment,
  resolveClubCoachesSubtitle,
} from '../../features/club/ui/clubCoachesModel';
import { teamsService } from '../../services/teams.service';
import { isCoachMatchEvent, isCoachTrainingEvent } from '../../models/TeamEvent';
import { formatMatchClock, formatMatchDay } from '../../features/club/ui/clubMatchesModel';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { clubRadius, clubSpace } from '../../features/club/theme/clubDesignSystem';
import type { User } from '../../models/User';
import type { Team } from '../../models/Team';

/** Annuaire coachs + fiche détail / affectation équipes. */
export function ClubCoachesScreen() {
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const [busy, setBusy] = useState(false);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const coachItems = useMemo(
    () => buildClubCoachListItems(ws.coaches, ws.teams),
    [ws.coaches, ws.teams],
  );
  const teamsWithoutCoach = useMemo(() => listTeamsWithoutCoach(ws.teams), [ws.teams]);
  const subtitle = useMemo(
    () =>
      resolveClubCoachesSubtitle({
        coachCount: ws.coaches.length,
        withoutCoach: teamsWithoutCoach.length,
      }),
    [ws.coaches.length, teamsWithoutCoach.length],
  );

  if (ws.loading) return <ClubLoading />;

  const selectedCoach = selectedUid
    ? ws.coaches.find((c) => c.uid === selectedUid)
    : null;

  if (selectedUid && selectedCoach) {
    return (
      <ClubCoachDetail
        coach={selectedCoach}
        onBack={() => setSelectedUid(null)}
        busy={busy}
        setBusy={setBusy}
        preferUnassignedOnly={false}
      />
    );
  }

  const openAssignFlow = () => {
    const pick = preferCoachForAssignment(ws.coaches, ws.teams);
    if (pick) {
      setSelectedUid(pick.uid);
      return;
    }
    shellNav?.openCreate?.('coach');
  };

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing || busy} onRefresh={() => void ws.refresh()}>
        <ClubBrandHeader title="Coachs" subtitle={subtitle} />

        <View style={styles.shortcutRow}>
          <PressableSpring
            onPress={() => shellNav?.requestNav('teams')}
            scaleTo={0.97}
            haptic
            style={styles.shortcut}
          >
            <Icon name="football" size={14} color={tokens.accent} />
            <ClubText variant="caption" style={styles.shortcutLabel}>
              Équipes
            </ClubText>
          </PressableSpring>
          <PressableSpring
            onPress={() => shellNav?.openCreate?.('invite_member')}
            scaleTo={0.97}
            haptic
            style={styles.shortcut}
          >
            <Icon name="mail" size={14} color={tokens.accent} />
            <ClubText variant="caption" style={styles.shortcutLabel}>
              Inviter
            </ClubText>
          </PressableSpring>
          <PressableSpring
            onPress={() => shellNav?.openCreate?.('coach')}
            scaleTo={0.97}
            haptic
            style={styles.shortcut}
          >
            <Icon name="add" size={14} color={tokens.accent} />
            <ClubText variant="caption" style={styles.shortcutLabel}>
              Créer
            </ClubText>
          </PressableSpring>
        </View>

        {teamsWithoutCoach.length > 0 ? (
          <ClubCoachesGapHero
            count={teamsWithoutCoach.length}
            teamNames={teamsWithoutCoach.map((t) => t.name)}
            onAssign={openAssignFlow}
            onSeeTeams={() => shellNav?.requestNav('teams')}
          />
        ) : null}

        {ws.coaches.length === 0 ? (
          <ClubEmptyState
            title="Aucun coach pour l’instant"
            body="Invitez un coach ou créez un profil staff pour l’affecter à une catégorie."
            actionLabel="Ajouter un coach"
            onAction={() => shellNav?.openCreate?.('coach')}
            icon="school"
          />
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <ClubText variant="label" muted style={styles.sectionLabel}>
                Annuaire
              </ClubText>
              <ClubText variant="caption" muted>
                {coachItems.length}
              </ClubText>
            </View>
            <View style={styles.list}>
              {coachItems.map((item, index) => (
                <ClubCoachListCard
                  key={item.coach.uid}
                  item={item}
                  index={index}
                  onPress={() => setSelectedUid(item.coach.uid)}
                />
              ))}
            </View>
          </View>
        )}

        {teamsWithoutCoach.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <ClubText variant="label" muted style={styles.sectionLabel}>
                À affecter
              </ClubText>
              <ClubText variant="caption" muted>
                {teamsWithoutCoach.length}
              </ClubText>
            </View>
            <View style={styles.list}>
              {teamsWithoutCoach.map((t) => (
                <PressableSpring
                  key={t.id}
                  onPress={openAssignFlow}
                  scaleTo={0.98}
                  haptic
                  style={styles.gapRow}
                >
                  <View style={[styles.gapIcon, { backgroundColor: tokens.warningSoft }]}>
                    <Icon name="warning" size={16} color={tokens.warning} />
                  </View>
                  <View style={styles.gapCopy}>
                    <ClubText variant="body" style={{ fontWeight: '700' }} numberOfLines={1}>
                      {t.name}
                    </ClubText>
                    <ClubText variant="caption" muted numberOfLines={1}>
                      Sans coach — ouvrir un coach pour affecter
                    </ClubText>
                  </View>
                  <Icon name="chevron-forward" size={14} color={tokens.faint} />
                </PressableSpring>
              ))}
            </View>
          </View>
        ) : null}

        <ClubActionRow
          icon="shield"
          label="Permissions"
          hint="Visibilité documents par rôle"
          onPress={() => shellNav?.requestNav('permissions')}
        />

        <ClubText variant="caption" muted style={styles.footer}>
          Rôles : Admin · Dirigeant · DS · Coach · Assistant.
        </ClubText>
      </ClubChapterScroll>
    </View>
  );
}

function ClubCoachDetail({
  coach,
  onBack,
  busy,
  setBusy,
}: {
  coach: User;
  onBack: () => void;
  busy: boolean;
  setBusy: (v: boolean) => void;
  preferUnassignedOnly?: boolean;
}) {
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const assigned = ws.teams.filter((t) => t.coach_uids?.includes(coach.uid));
  const withoutAnyCoach = listTeamsWithoutCoach(ws.teams);
  const unassigned = ws.teams.filter((t) => !t.coach_uids?.includes(coach.uid));
  /** Priorise les équipes sans aucun coach en tête de liste d’affectation. */
  const assignTargets = [
    ...withoutAnyCoach.filter((t) => unassigned.some((u) => u.id === t.id)),
    ...unassigned.filter((t) => !withoutAnyCoach.some((w) => w.id === t.id)),
  ];

  const coachEvents = ws.events.filter((e) => {
    if (assigned.length === 0) return false;
    const ids = new Set(assigned.map((t) => t.id));
    return e.team_id != null && ids.has(e.team_id);
  });
  const upcomingTrainings = coachEvents
    .filter((e) => isCoachTrainingEvent(e) && e.starts_at >= new Date())
    .slice(0, 4);
  const upcomingMatches = coachEvents
    .filter((e) => isCoachMatchEvent(e) && e.starts_at >= new Date())
    .slice(0, 4);

  const assignCoach = (team: Team) => {
    Alert.alert(
      'Affecter le coach',
      `Affecter ${coach.display_name || 'ce coach'} à « ${team.name} » ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Affecter',
          onPress: () =>
            void (async () => {
              setBusy(true);
              try {
                await teamsService.assignCoach(team.id, coach.uid);
                await ws.refresh();
              } catch (e) {
                Alert.alert('Erreur', e instanceof Error ? e.message : 'Affectation impossible.');
              } finally {
                setBusy(false);
              }
            })(),
        },
      ],
    );
  };

  const removeCoach = (team: Team) => {
    Alert.alert(
      'Retirer le coach',
      `Retirer ${coach.display_name || 'ce coach'} de « ${team.name} » ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: () =>
            void (async () => {
              setBusy(true);
              try {
                await teamsService.removeCoach(team.id, coach.uid);
                await ws.refresh();
              } catch (e) {
                Alert.alert('Erreur', e instanceof Error ? e.message : 'Retrait impossible.');
              } finally {
                setBusy(false);
              }
            })(),
        },
      ],
    );
  };

  const whenLabel = (d: Date) => `${formatMatchDay(d)} · ${formatMatchClock(d)}`;

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing || busy} onRefresh={() => void ws.refresh()}>
        <PressableSpring onPress={onBack} scaleTo={0.97} haptic style={styles.back}>
          <Icon name="arrow-back" size={18} color={tokens.accent} />
          <ClubText variant="caption" style={{ color: tokens.accent, fontWeight: '700' }}>
            Coachs
          </ClubText>
        </PressableSpring>

        <ClubBrandHeader
          title={coach.display_name || 'Coach'}
          subtitle={
            [coach.profile?.job_title, coach.profile?.diploma].filter(Boolean).join(' · ') ||
            'Staff technique'
          }
          right={
            <ClubStatusPill
              label={assigned.length ? `${assigned.length} équipe(s)` : 'Non affecté'}
              tone={assigned.length ? 'ok' : 'warn'}
            />
          }
        />

        <ClubSectionCard title="Profil">
          <ClubText variant="body" muted>
            Rôle : {coach.role === 'coach' ? 'Coach' : coach.role}
          </ClubText>
          <ClubText variant="body" muted>
            Diplôme : {coach.profile?.diploma || '—'}
          </ClubText>
          <ClubText variant="body" muted>
            Titre : {coach.profile?.job_title || '—'}
          </ClubText>
          <ClubText variant="body" muted>
            Licence coach : {coach.profile?.license_number || '—'}
          </ClubText>
        </ClubSectionCard>

        <ClubSectionCard title="Équipes affectées">
          {assigned.length === 0 ? (
            <ClubText variant="body" muted>
              Aucune équipe — choisissez une affectation ci-dessous.
            </ClubText>
          ) : (
            assigned.map((t) => (
              <ClubActionRow
                key={t.id}
                icon="football"
                label={t.name}
                hint={t.category || 'Retirer de l’équipe'}
                onPress={() => removeCoach(t)}
              />
            ))
          )}
        </ClubSectionCard>

        {assignTargets.length > 0 ? (
          <ClubSectionCard title="Affecter à">
            {assignTargets.map((t) => {
              const needsCoach = withoutAnyCoach.some((w) => w.id === t.id);
              return (
                <ClubActionRow
                  key={t.id}
                  icon="add"
                  label={t.name}
                  hint={needsCoach ? 'Sans coach — prioritaire' : 'Toucher pour affecter'}
                  onPress={() => assignCoach(t)}
                />
              );
            })}
          </ClubSectionCard>
        ) : null}

        <ClubSectionCard title="Planning à venir">
          {upcomingTrainings.length === 0 && upcomingMatches.length === 0 ? (
            <ClubText variant="body" muted>
              Aucun événement planifié sur les équipes de ce coach.
            </ClubText>
          ) : (
            <>
              {upcomingMatches.map((e) => (
                <ClubActionRow
                  key={e.id}
                  icon="trophy"
                  label={e.title || 'Match'}
                  hint={whenLabel(e.starts_at)}
                  onPress={() => shellNav?.requestNav('matches')}
                />
              ))}
              {upcomingTrainings.map((e) => (
                <ClubActionRow
                  key={e.id}
                  icon="football"
                  label={e.title || 'Entraînement'}
                  hint={whenLabel(e.starts_at)}
                  onPress={() => shellNav?.requestNav('trainings')}
                />
              ))}
            </>
          )}
        </ClubSectionCard>

        <ClubSectionCard title="Contact & actions">
          {coach.email ? (
            <ClubActionRow
              icon="mail"
              label={coach.email}
              hint="Écrire un e-mail"
              onPress={() => void Linking.openURL(`mailto:${coach.email}`)}
            />
          ) : (
            <ClubText variant="body" muted>
              Aucun e-mail renseigné.
            </ClubText>
          )}
          {coach.phone ? (
            <ClubActionRow
              icon="call"
              label={coach.phone}
              hint="Appeler"
              onPress={() => void Linking.openURL(`tel:${coach.phone}`)}
            />
          ) : null}
          <ClubActionRow
            icon="chat"
            label="Ouvrir la communication"
            onPress={() => shellNav?.requestNav('communication')}
          />
          <ClubActionRow
            icon="football"
            label="Voir les équipes"
            onPress={() => shellNav?.requestNav('teams')}
          />
        </ClubSectionCard>
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    shortcutRow: {
      flexDirection: 'row',
      gap: clubSpace.sm,
    },
    shortcut: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: clubRadius.md,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    shortcutLabel: {
      color: tokens.foreground,
      fontWeight: '700',
    },
    section: { gap: clubSpace.sm },
    sectionHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: clubSpace.sm,
    },
    sectionLabel: {
      letterSpacing: 1.05,
      opacity: 0.92,
    },
    list: { gap: clubSpace.sm },
    gapRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
      paddingVertical: clubSpace.md,
      paddingHorizontal: clubSpace.md,
      borderRadius: clubRadius.lg,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    gapIcon: {
      width: 36,
      height: 36,
      borderRadius: clubRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gapCopy: { flex: 1, minWidth: 0, gap: 2 },
    footer: {
      textAlign: 'center',
      paddingVertical: clubSpace.sm,
    },
    back: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingVertical: clubSpace.xs,
    },
  });
