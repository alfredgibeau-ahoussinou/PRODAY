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
  ClubSectionCard,
  ClubSegmentedControl,
  ClubText,
} from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import { clubSpace } from '../../features/club/theme/clubDesignSystem';
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
        <ClubBrandHeader
          title="Recrutement"
          subtitle="Interne d’abord · Suivi des recrutements"
        />

        <ClubSegmentedControl
          options={[
            { id: 'internal' as const, label: 'Interne' },
            { id: 'external' as const, label: 'Suivi' },
            { id: 'ai' as const, label: 'IA' },
          ]}
          value={tab}
          onChange={setTab}
        />

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
    root: { flex: 1, backgroundColor: 'transparent' },
  });
