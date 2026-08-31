import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import {
  ClubActionRow,
  ClubButton,
  ClubChapterScroll,
  ClubEmptyState,
  ClubLoading,
  ClubSectionCard,
  ClubText,
} from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import { ClubRosterPlayerCard } from '../../features/club/ui/ClubRosterPlayerCard';
import { buildClubTeamCardMeta } from '../../features/club/ui/clubTeamsModel';
import { formatMatchClock, formatMatchDay } from '../../features/club/ui/clubMatchesModel';
import { isCoachMatchEvent, isCoachTrainingEvent } from '../../models/TeamEvent';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { clubRadius, clubSpace } from '../../features/club/theme/clubDesignSystem';

type Props = {
  teamId: string;
  onBack: () => void;
};

function eventWhenLabel(startsAt: Date): string {
  return `${formatMatchDay(startsAt)} · ${formatMatchClock(startsAt)}`;
}

/** Espace équipe — chrome teinté, effectif, prochaines séances, sections existantes. */
export function ClubTeamSpaceScreen({ teamId, onBack }: Props) {
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  if (ws.loading) return <ClubLoading />;

  const row = ws.teamRows.find((t) => t.teamId === teamId);
  const team = ws.teams.find((t) => t.id === teamId);
  const meta = row ? buildClubTeamCardMeta(row) : null;
  const teamEvents = ws.events.filter((e) => e.team_id === teamId);
  const now = new Date();
  const nextMatch = teamEvents.find(
    (e) => isCoachMatchEvent(e) && e.starts_at && e.starts_at >= new Date(now.getTime() - 30 * 60 * 1000),
  );
  const nextTraining = teamEvents.find(
    (e) =>
      isCoachTrainingEvent(e) &&
      e.starts_at &&
      e.starts_at >= new Date(now.getTime() - 30 * 60 * 1000),
  );
  const rosterMemberships = ws.memberships.filter(
    (m) => m.status === 'active' && m.team_id === teamId,
  );
  const byUid = new Map(ws.members.map((m) => [m.uid, m]));
  const roster = rosterMemberships
    .map((m) => byUid.get(m.player_uid))
    .filter(Boolean) as typeof ws.members;

  const headerSubtitle = meta
    ? [meta.metaPrimary || meta.metaSecondary, meta.hasCoach ? meta.coachesLabel : null]
        .filter(Boolean)
        .join(' · ')
    : 'Équipe';

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <PressableSpring onPress={onBack} scaleTo={0.97} haptic style={styles.back}>
          <Icon name="arrow-back" size={18} color={tokens.accent} />
          <ClubText variant="caption" style={{ color: tokens.accent, fontWeight: '700' }}>
            Équipes
          </ClubText>
        </PressableSpring>

        <ClubBrandHeader
          title={meta?.title ?? team?.name ?? 'Équipe'}
          subtitle={headerSubtitle || undefined}
        />

        {meta && !meta.hasCoach ? (
          <PressableSpring
            onPress={() => shellNav?.requestNav('coaches')}
            scaleTo={0.98}
            haptic
            style={styles.noCoachBanner}
          >
            <View style={[styles.noCoachPill, { backgroundColor: tokens.warningSoft }]}>
              <ClubText
                variant="caption"
                style={{ color: tokens.warning, fontWeight: '800', fontSize: 11 }}
              >
                Sans coach
              </ClubText>
            </View>
            <ClubText variant="caption" muted style={{ flex: 1 }}>
              Affecter un coach pour cette catégorie
            </ClubText>
            <Icon name="chevron-forward" size={14} color={tokens.faint} />
          </PressableSpring>
        ) : null}

        <View style={styles.actionRow}>
          <View style={styles.actionFlex}>
            <ClubButton
              label="Inviter des membres"
              icon="people"
              variant="outline"
              layout="tile"
              onPress={() => shellNav?.openCreate?.('invite_member')}
            />
          </View>
          <View style={styles.actionFlex}>
            <ClubButton
              label="Chat d'équipe"
              icon="chat"
              variant="outline"
              layout="tile"
              onPress={() => shellNav?.requestNav('communication')}
            />
          </View>
        </View>

        <ClubSectionCard title="Prochainement">
          {nextMatch ? (
            <ClubActionRow
              icon="trophy"
              label={nextMatch.title || 'Match'}
              hint={eventWhenLabel(nextMatch.starts_at)}
              onPress={() => shellNav?.requestNav('matches')}
            />
          ) : (
            <ClubText variant="body" muted>
              Aucun match à venir pour cette équipe.
            </ClubText>
          )}
          {nextTraining ? (
            <ClubActionRow
              icon="football"
              label={nextTraining.title || 'Entraînement'}
              hint={eventWhenLabel(nextTraining.starts_at)}
              onPress={() => shellNav?.requestNav('trainings')}
            />
          ) : (
            <ClubText variant="caption" muted>
              Aucune séance à venir.
            </ClubText>
          )}
        </ClubSectionCard>

        <View style={styles.chapter}>
          <ClubText variant="h3" style={styles.rosterTitle}>
            {`Joueurs (${roster.length})`}
          </ClubText>
          {roster.length === 0 ? (
            <ClubEmptyState
              title="Effectif vide"
              body="Invitez des joueurs ou rattachez des licenciés à cette catégorie."
              actionLabel="Voir les joueurs"
              onAction={() => shellNav?.requestNav('players')}
              icon="people"
            />
          ) : (
            <View style={styles.roster}>
              {roster.slice(0, 8).map((p, index) => {
                const membership = rosterMemberships.find((m) => m.player_uid === p.uid);
                return (
                  <ClubRosterPlayerCard
                    key={p.uid}
                    player={p}
                    membership={membership}
                    teamName={team?.name}
                    clubName={ws.club?.name}
                    index={index}
                    onPress={() => {
                      shellNav?.setSelectedPlayerUid?.(p.uid);
                      shellNav?.requestNav('players');
                    }}
                  />
                );
              })}
              {roster.length > 8 ? (
                <ClubActionRow
                  label={`Voir les ${roster.length} joueurs`}
                  onPress={() => shellNav?.requestNav('players')}
                />
              ) : null}
            </View>
          )}
        </View>

        <ClubSectionCard title="Sections">
          <ClubActionRow
            icon="people"
            label="Tous les joueurs"
            hint={`${roster.length} joueur${roster.length > 1 ? 's' : ''}`}
            onPress={() => shellNav?.requestNav('players')}
          />
          <ClubActionRow
            icon="school"
            label="Coachs"
            hint={meta?.hasCoach ? meta.coachesLabel : 'Affecter un coach'}
            onPress={() => shellNav?.requestNav('coaches')}
          />
          <ClubActionRow
            icon="calendar"
            label="Calendrier"
            onPress={() => shellNav?.requestNav('calendar')}
          />
          <ClubActionRow
            icon="trophy"
            label="Matchs"
            onPress={() => shellNav?.requestNav('matches')}
          />
          <ClubActionRow
            icon="football"
            label="Entraînements"
            onPress={() => shellNav?.requestNav('trainings')}
          />
          <ClubActionRow
            icon="chat"
            label="Communication"
            onPress={() => shellNav?.requestNav('communication')}
          />
          <ClubActionRow
            icon="stats-chart"
            label="Statistiques"
            onPress={() => shellNav?.requestNav('stats')}
          />
        </ClubSectionCard>

        {!row && !team ? (
          <ClubEmptyState
            title="Équipe introuvable"
            body="Cette équipe n’existe plus ou n’est pas liée à votre club."
            actionLabel="Retour"
            onAction={onBack}
          />
        ) : null}
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    actionRow: { flexDirection: 'row', gap: 10 },
    actionFlex: { flex: 1 },
    back: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingVertical: clubSpace.xs,
    },
    noCoachBanner: {
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
    noCoachPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: clubRadius.pill,
    },
    chapter: { gap: clubSpace.sm },
    rosterTitle: { fontWeight: '800', letterSpacing: -0.2 },
    roster: { gap: clubSpace.sm },
  });
