import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ClubRecruitmentKanban } from '../../components/club/ClubRecruitmentKanban';
import { ClubRosterBoardPanel } from '../../components/club/ClubRosterBoardPanel';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
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
import { spacing } from '../../theme/designTokens';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';

type Tab = 'internal' | 'external' | 'ai';

/** Recrutement — bassin interne + Suivi des recrutements (externe) + suggestions IA stub. */
export function ClubRecruitmentScreen() {
  const profile = useSessionProfile();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const [tab, setTab] = useState<Tab>('internal');
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  if (ws.loading) return <ClubLoading />;

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubScreenHeader
          title="Recrutement"
          subtitle="Interne d’abord · Suivi des recrutements"
        />

        <View style={styles.tabs}>
          <ClubActionRow
            label="Bassin interne"
            trailing={
              tab === 'internal' ? (
                <ClubText variant="caption" style={{ color: tokens.accent }}>
                  ●
                </ClubText>
              ) : undefined
            }
            onPress={() => setTab('internal')}
          />
          <ClubActionRow
            label="Suivi des recrutements"
            trailing={
              tab === 'external' ? (
                <ClubText variant="caption" style={{ color: tokens.accent }}>
                  ●
                </ClubText>
              ) : undefined
            }
            onPress={() => setTab('external')}
          />
          <ClubActionRow
            label="Suggestions IA"
            trailing={
              tab === 'ai' ? (
                <ClubText variant="caption" style={{ color: tokens.accent }}>
                  ●
                </ClubText>
              ) : undefined
            }
            onPress={() => setTab('ai')}
          />
        </View>

        {tab === 'internal' ? (
          <ClubSectionCard title="Vivier club">
            {ws.clubId && profile ? (
              <ClubRosterBoardPanel
                clubId={ws.clubId}
                profile={profile}
                members={ws.members}
                audience="club"
              />
            ) : (
              <ClubEmptyState
                title="Club non lié"
                body="Associez un club pour gérer le bassin interne."
              />
            )}
            <ClubText variant="caption" muted>
              L’IA peut suggérer un mouvement — jamais le faire sans confirmation.
            </ClubText>
          </ClubSectionCard>
        ) : null}

        {tab === 'external' ? (
          <ClubSectionCard title="Suivi des recrutements">
            <ClubRecruitmentKanban />
          </ClubSectionCard>
        ) : null}

        {tab === 'ai' ? (
          <ClubSectionCard title="Suggestions IA (stub)">
            <ClubText variant="body" muted>
              Aucune suggestion automatique pour le moment. Quand elles arriveront, chaque
              recommandation demandera votre validation — aucun transfert auto entre équipes.
            </ClubText>
            <ClubActionRow
              icon="star-four-points"
              label="Générer des pistes (bientôt)"
              hint="Stub — pas d’exécution"
            />
          </ClubSectionCard>
        ) : null}
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: tokens.bg },
    tabs: { gap: spacing.xs },
  });
