import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import {
  ClubActionRow,
  ClubChapterScroll,
  ClubEmptyState,
  ClubLoading,
  ClubScreenHeader,
  ClubSectionCard,
  ClubText,
} from '../../features/club/ui/clubUi';
import { ClubMatchInvitePanel } from '../../components/club/ClubMatchInvitePanel';
import { isCoachMatchEvent } from '../../models/TeamEvent';
import { spacing } from '../../theme/designTokens';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';

type Tab = 'list' | 'invites';

/** Matchs — liste + convocations + invitation autre club. */
export function ClubMatchesScreen() {
  const shellNav = useClubShellNav();
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
        <ClubScreenHeader title="Matchs" subtitle="Convocations & invitations inter-clubs" />

        <View style={styles.tabs}>
          <ClubActionRow
            label="Calendrier matchs"
            trailing={tab === 'list' ? <ClubText variant="caption" style={{ color: tokens.accent }}>●</ClubText> : undefined}
            onPress={() => setTab('list')}
          />
          <ClubActionRow
            label="Invitation autre club"
            trailing={tab === 'invites' ? <ClubText variant="caption" style={{ color: tokens.accent }}>●</ClubText> : undefined}
            onPress={() => setTab('invites')}
          />
        </View>

        {tab === 'invites' ? (
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
        ) : matches.length === 0 ? (
          <ClubEmptyState
            title="Aucun match"
            body="Créez un match amical ou de compétition, puis envoyez les convocations."
            actionLabel="+ Créer un match"
            onAction={() => shellNav?.openCreate?.('match')}
            icon="trophy"
          />
        ) : (
          <ClubSectionCard title={`${matches.length} match(s)`}>
            {matches.map((e) => (
              <ClubActionRow
                key={e.id}
                icon="trophy"
                label={e.title || 'Match'}
                hint={e.starts_at.toLocaleString('fr-FR')}
                onPress={() =>
                  Alert.alert(
                    e.title || 'Match',
                    'Convocations et feuille de match : détail disponible. Les invitations inter-clubs sont dans l’onglet dédié.',
                    [
                      { text: 'OK', style: 'cancel' },
                      {
                        text: 'Inviter un club',
                        onPress: () => setTab('invites'),
                      },
                    ],
                  )
                }
              />
            ))}
          </ClubSectionCard>
        )}
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: tokens.bg },
    tabs: { gap: spacing.xs },
  });
