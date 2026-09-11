import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { ClubRecruitmentKanban } from '../../components/club/ClubRecruitmentKanban';
import { ClubRosterBoardPanel } from '../../components/club/ClubRosterBoardPanel';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { openClubHelpChatbot } from '../../features/club/shell/clubHelpOpen';
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
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { AnimatedRouteContent } from '../../components/motion';
import { clubRecruitmentAiEmpty } from '../../utils/aiUxHonesty';

type Tab = 'internal' | 'external' | 'ai';
const RECRUIT_TAB_ORDER: Tab[] = ['internal', 'external', 'ai'];

/** Recrutement — bassin interne + Suivi + pistes IA (honnêtes / Copilote réel). */
export function ClubRecruitmentScreen() {
  const shellNav = useClubShellNav();
  const profile = useSessionProfile();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const [tab, setTab] = useState<Tab>('internal');
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const aiEmpty = clubRecruitmentAiEmpty();

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
            { id: 'ai' as const, label: 'Pistes' },
          ]}
          value={tab}
          onChange={setTab}
        />

        <AnimatedRouteContent
          routeKey={tab}
          routeOrder={RECRUIT_TAB_ORDER}
          context="tab"
          fill={false}
        >
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
                Un mouvement d’effectif demande toujours votre confirmation — jamais d’auto-transfert.
              </ClubText>
            </ClubSectionCard>
          ) : null}

          {tab === 'external' ? (
            <ClubSectionCard title="Suivi des recrutements">
              <ClubRecruitmentKanban />
            </ClubSectionCard>
          ) : null}

          {tab === 'ai' ? (
            <ClubSectionCard title={aiEmpty.title}>
              <ClubText variant="body" muted>
                {aiEmpty.body}
              </ClubText>
              <ClubActionRow
                icon="chat"
                label={aiEmpty.primaryCta}
                hint={aiEmpty.primaryHint}
                onPress={() => {
                  if (!openClubHelpChatbot()) {
                    shellNav?.requestNav('assistant');
                  }
                }}
              />
              <ClubActionRow
                icon="people"
                label="Voir le vivier interne"
                hint="Effectif et mouvements d’équipes"
                onPress={() => setTab('internal')}
              />
              <ClubActionRow
                icon="briefcase"
                label="Ouvrir le suivi des recrutements"
                hint="Kanban candidatures"
                onPress={() => setTab('external')}
              />
            </ClubSectionCard>
          ) : null}
        </AnimatedRouteContent>
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (_tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
  });
