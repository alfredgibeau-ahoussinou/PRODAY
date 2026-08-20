import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import {
  ClubChapterScroll,
  ClubEmptyState,
  ClubLoading,
  ClubMatchScoreCard,
  ClubSectionCard,
  ClubSegmentedControl,
  ClubText,
} from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import { ClubMatchInvitePanel } from '../../components/club/ClubMatchInvitePanel';
import { ClubFriendlyMatchesPanel } from '../../components/club/ClubFriendlyMatchesPanel';
import { isCoachMatchEvent } from '../../models/TeamEvent';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { clubSpace } from '../../features/club/theme/clubDesignSystem';

type Tab = 'list' | 'invites';

/** Matchs — présentation score-forward (pas de score inventé) + convocations. */
export function ClubMatchesScreen() {
  const shellNav = useClubShellNav();
  const profile = useSessionProfile();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const [tab, setTab] = useState<Tab>('list');
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  if (ws.loading) return <ClubLoading />;

  const matches = ws.events
    .filter((e) => isCoachMatchEvent(e))
    .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubBrandHeader title="Matchs" subtitle="Convocations & invitations inter-clubs" />

        <ClubSegmentedControl
          options={[
            { id: 'list' as const, label: 'Calendrier' },
            { id: 'invites' as const, label: 'Invitations' },
          ]}
          value={tab}
          onChange={setTab}
        />

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
                Accepter · Refuser · Proposer une autre date — flux de premier ordre.
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
            title="Aucun match"
            body="Créez un match amical ou de compétition, puis envoyez les convocations."
            actionLabel="+ Créer un match"
            onAction={() => shellNav?.openCreate?.('match')}
            icon="trophy"
          />
        ) : (
          <View style={styles.list}>
            {matches.map((e, index) => (
              <ClubMatchScoreCard
                key={e.id}
                index={index}
                title={e.title || 'Match'}
                when={e.starts_at.toLocaleString('fr-FR')}
                onPress={() =>
                  Alert.alert(
                    e.title || 'Match',
                    'Pas de score inventé. Convocations via l’effectif ; invitations inter-clubs dans l’onglet dédié.',
                    [
                      { text: 'OK', style: 'cancel' },
                      {
                        text: 'Inviter un club',
                        onPress: () => setTab('invites'),
                      },
                      {
                        text: 'Créer un match',
                        onPress: () => shellNav?.openCreate?.('match'),
                      },
                    ],
                  )
                }
              />
            ))}
          </View>
        )}
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: tokens.bg },
    list: { gap: clubSpace.md },
  });
