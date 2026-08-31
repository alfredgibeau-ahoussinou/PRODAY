import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import {
  ClubChapterScroll,
  ClubEmptyState,
  ClubLoading,
  ClubSectionCard,
  ClubSegmentedControl,
  ClubText,
} from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import { ClubMatchDayHero, ClubMatchListRow } from '../../features/club/ui/ClubMatchesDay';
import {
  buildClubMatchCardModel,
  resolveClubMatchHero,
  resolveMatchHubActions,
  sortClubMatches,
} from '../../features/club/ui/clubMatchesModel';
import { ClubMatchInvitePanel } from '../../components/club/ClubMatchInvitePanel';
import { ClubFriendlyMatchesPanel } from '../../components/club/ClubFriendlyMatchesPanel';
import { AnimatedRouteContent, PushScreenTransition } from '../../components/motion';
import { MatchEventHubScreen } from '../MatchEventHubScreen';
import type { MatchHubChapterId } from '../../content/matchHubChapters';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { clubSpace } from '../../features/club/theme/clubDesignSystem';

type Tab = 'list' | 'invites';
const MATCH_TAB_ORDER: Tab[] = ['list', 'invites'];

/**
 * Matchs Club — Match day premium :
 * hero jour J · liste · hub détail / convocs / compo / live (écrans existants).
 */
export function ClubMatchesScreen() {
  const shellNav = useClubShellNav();
  const profile = useSessionProfile();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const [tab, setTab] = useState<Tab>('list');
  const [hubEventId, setHubEventId] = useState<string | null>(null);
  const [hubChapter, setHubChapter] = useState<MatchHubChapterId>('apercu');
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const matches = useMemo(() => sortClubMatches(ws.events), [ws.events]);
  const heroEvent = useMemo(() => resolveClubMatchHero(matches), [matches]);
  const heroModel = useMemo(
    () => (heroEvent ? buildClubMatchCardModel(heroEvent, ws.teamRows) : null),
    [heroEvent, ws.teamRows],
  );
  const listModels = useMemo(
    () =>
      matches
        .filter((m) => m.id !== heroEvent?.id)
        .map((m) => buildClubMatchCardModel(m, ws.teamRows)),
    [matches, heroEvent?.id, ws.teamRows],
  );

  const openHub = (eventId: string, chapter: MatchHubChapterId = 'apercu') => {
    setHubChapter(chapter);
    setHubEventId(eventId);
  };

  if (ws.loading) return <ClubLoading />;

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubBrandHeader
          title="Matchs"
          subtitle={
            heroModel?.isLive
              ? 'Match en cours — score & convocations'
              : heroModel?.isToday
                ? 'Jour de match — score, convocs, détail'
                : 'Calendrier · convocations · invitations'
          }
        />

        <ClubSegmentedControl
          options={[
            { id: 'list' as const, label: 'Calendrier' },
            { id: 'invites' as const, label: 'Invitations' },
          ]}
          value={tab}
          onChange={setTab}
        />

        <AnimatedRouteContent
          routeKey={tab}
          routeOrder={MATCH_TAB_ORDER}
          context="tab"
          fill={false}
        >
          {tab === 'invites' ? (
            <>
              <ClubSectionCard title="Inter-clubs">
                {ws.clubId ? (
                  <ClubMatchInvitePanel
                    onOrganize={() => shellNav?.openCreate?.('invite_club')}
                    onPropose={() => shellNav?.openCreate?.('invite_club')}
                    onOpenConvocations={() => setTab('list')}
                  />
                ) : (
                  <ClubText variant="body" muted>
                    Liez un club à votre compte pour envoyer ou recevoir des invitations.
                  </ClubText>
                )}
                <ClubText variant="caption" muted>
                  Accepter · Refuser · Proposer une autre date — flux existants.
                </ClubText>
              </ClubSectionCard>
              {ws.clubId && profile ? (
                <ClubSectionCard title="Invitations & réponses">
                  <ClubFriendlyMatchesPanel
                    clubId={ws.clubId}
                    clubName={ws.club?.name ?? profile.display_name}
                    profile={profile}
                  />
                </ClubSectionCard>
              ) : null}
            </>
          ) : matches.length === 0 ? (
            <ClubEmptyState
              title="Aucun match au calendrier"
              body="Créez un match amical ou de compétition, puis envoyez les convocations depuis le détail."
              actionLabel="Créer un match"
              onAction={() => shellNav?.openCreate?.('match')}
              icon="trophy"
            />
          ) : (
            <View style={styles.list}>
              {heroModel && heroEvent ? (
                <ClubMatchDayHero
                  model={heroModel}
                  actions={resolveMatchHubActions(heroModel)}
                  onAction={(chapter) => openHub(heroEvent.id, chapter)}
                />
              ) : null}

              {listModels.length > 0 ? (
                <View style={styles.sectionHead}>
                  <ClubText variant="label" muted style={styles.sectionLabel}>
                    {heroModel ? 'Autres matchs' : 'Calendrier'}
                  </ClubText>
                  <ClubText variant="caption" muted>
                    {listModels.length}
                  </ClubText>
                </View>
              ) : null}

              {listModels.map((model, index) => (
                <ClubMatchListRow
                  key={model.id}
                  model={model}
                  index={index}
                  onOpen={() => openHub(model.id, 'apercu')}
                  onConvocations={
                    model.presence.pending > 0
                      ? () => openHub(model.id, 'effectif')
                      : undefined
                  }
                />
              ))}
            </View>
          )}
        </AnimatedRouteContent>
      </ClubChapterScroll>

      <PushScreenTransition active={hubEventId != null} backgroundColor={tokens.bg}>
        {hubEventId ? (
          <MatchEventHubScreen
            eventId={hubEventId}
            initialChapter={hubChapter}
            onBack={() => {
              setHubEventId(null);
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
  });
