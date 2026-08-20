import React, { useMemo, useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { AnimatedEntrance, PressableSpring } from '../../components/motion';
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
import { teamsService } from '../../services/teams.service';
import { isCoachMatchEvent, isCoachTrainingEvent } from '../../models/TeamEvent';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { clubRadius, clubShadow, clubSpace } from '../../features/club/theme/clubDesignSystem';
import type { User } from '../../models/User';
import type { Team } from '../../models/Team';

/** Annuaire coachs + fiche détail complète. */
export function ClubCoachesScreen() {
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const [busy, setBusy] = useState(false);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const styles = useMemo(() => createStyles(tokens), [tokens]);

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
      />
    );
  }

  const teamsByCoach = (uid: string) =>
    ws.teams.filter((t) => t.coach_uids?.includes(uid));

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing || busy} onRefresh={() => void ws.refresh()}>
        <ClubBrandHeader
          title="Coachs"
          subtitle={`${ws.coaches.length} coach(s) · ${ws.teamsWithoutCoach} équipe(s) sans affectation`}
        />

        {ws.coaches.length === 0 ? (
          <ClubEmptyState
            title="Aucun coach"
            body="Invitez un coach ou affectez un membre staff à une équipe."
            actionLabel="Ajouter un coach"
            onAction={() => shellNav?.openCreate?.('coach')}
            icon="school"
          />
        ) : (
          <View style={styles.list}>
            {ws.coaches.map((c, index) => {
              const teams = teamsByCoach(c.uid);
              return (
                <AnimatedEntrance key={c.uid} kind="fadeUp" index={index} delayStep={40}>
                  <PressableSpring
                    onPress={() => setSelectedUid(c.uid)}
                    scaleTo={0.97}
                    haptic
                    style={styles.coachCard}
                  >
                    <View style={[styles.avatar, { backgroundColor: tokens.accentSoft }]}>
                      <Icon name="school" size={20} color={tokens.accent} />
                    </View>
                    <View style={styles.coachCopy}>
                      <ClubText variant="section" numberOfLines={1}>
                        {c.display_name || 'Coach'}
                      </ClubText>
                      <ClubText variant="caption" muted numberOfLines={2}>
                        {teams.length
                          ? teams.map((t) => t.name).join(' · ')
                          : 'Non affecté'}
                      </ClubText>
                      {c.profile?.diploma ? (
                        <ClubText variant="caption" muted>
                          {c.profile.diploma}
                        </ClubText>
                      ) : null}
                    </View>
                    <ClubStatusPill
                      label={teams.length ? `${teams.length} éq.` : 'Libre'}
                      tone={teams.length ? 'ok' : 'warn'}
                    />
                  </PressableSpring>
                </AnimatedEntrance>
              );
            })}
          </View>
        )}

        {ws.teamsWithoutCoach > 0 ? (
          <ClubSectionCard title="À affecter">
            {ws.teams
              .filter((t) => !(t.coach_uids?.length > 0))
              .map((t) => (
                <ClubActionRow
                  key={t.id}
                  icon="warning"
                  label={t.name}
                  hint="Sans coach — ouvrir un coach pour affecter"
                  onPress={() => {
                    if (ws.coaches[0]) setSelectedUid(ws.coaches[0].uid);
                    else shellNav?.openCreate?.('coach');
                  }}
                />
              ))}
          </ClubSectionCard>
        ) : null}

        <ClubText variant="caption" muted>
          Rôles : Admin · Dirigeant · DS · Coach · Assistant — voir Permissions.
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
}) {
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const assigned = ws.teams.filter((t) => t.coach_uids?.includes(coach.uid));
  const unassigned = ws.teams.filter((t) => !t.coach_uids?.includes(coach.uid));

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

        {unassigned.length > 0 ? (
          <ClubSectionCard title="Affecter à">
            {unassigned.map((t) => (
              <ClubActionRow
                key={t.id}
                icon="add"
                label={t.name}
                hint="Toucher pour affecter"
                onPress={() => assignCoach(t)}
              />
            ))}
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
                  hint={e.starts_at.toLocaleString('fr-FR')}
                  onPress={() => shellNav?.requestNav('matches')}
                />
              ))}
              {upcomingTrainings.map((e) => (
                <ClubActionRow
                  key={e.id}
                  icon="time"
                  label={e.title || 'Entraînement'}
                  hint={e.starts_at.toLocaleString('fr-FR')}
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
        </ClubSectionCard>
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    list: { gap: clubSpace.sm },
    coachCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.md,
      padding: clubSpace.md,
      borderRadius: clubRadius.xl,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      ...clubShadow.card,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: clubRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    coachCopy: { flex: 1, minWidth: 0, gap: 2 },
    back: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingVertical: clubSpace.xs,
    },
  });
