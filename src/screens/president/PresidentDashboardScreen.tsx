import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { usePresidentHealth } from '../../features/president/hooks/usePresidentHealth';
import { usePresidentShellNav } from '../../features/president/shell/PresidentShellNavContext';
import { usePresidentTheme } from '../../features/president/shell/PresidentThemeContext';
import { PresidentHealthBoard } from '../../features/president/ui/PresidentHealthBoard';
import {
  PresidentActionRow,
  PresidentChapterScroll,
  PresidentHeroBanner,
  PresidentLoading,
  PresidentSearchField,
  PresidentSectionCard,
  PresidentText,
} from '../../features/president/ui/presidentUi';
import {
  PRESIDENT_HEALTH_AXIS_NAV,
} from '../../features/president/navigation/presidentNavConfig';
import { presidentSpace } from '../../features/president/theme/presidentDesignSystem';
import type { PresidentThemeTokens } from '../../features/president/theme/presidentTokens';

/** Cockpit Accueil — état du club, indicateurs, centre de décision, actions rapides. */
export function PresidentDashboardScreen() {
  const profile = useSessionProfile();
  const ws = useClubWorkspace();
  const health = usePresidentHealth(ws);
  const shellNav = usePresidentShellNav();
  const { tokens } = usePresidentTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const [search, setSearch] = useState('');

  if (ws.loading) return <PresidentLoading />;

  const firstName = profile?.display_name?.split(/\s+/)[0] || 'Président';

  return (
    <View style={styles.root}>
      <PresidentChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <PresidentHeroBanner
          greeting={`Bonjour ${firstName}`}
          clubName={ws.club?.name ?? 'Votre club'}
          subtitle="Voici l’état de votre club"
        />

        <PresidentSearchField
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher une section… (⌘K)"
          onFocus={() => shellNav?.openCommandPalette?.()}
        />

        <PresidentSectionCard eyebrow="Vue d’ensemble" title="Lecture éditoriale">
          <PresidentText variant="body">
            {ws.briefingHeadline || 'Structure opérationnelle'}
          </PresidentText>
          <PresidentText variant="body" muted>
            {ws.briefingSummary ||
              `${ws.teams.length} équipes · ${ws.players.length} licenciés · ${ws.coaches.length} coachs.`}
          </PresidentText>
          <View style={styles.statRow}>
            <StatChip label="Équipes" value={String(ws.teams.length)} />
            <StatChip label="Licenciés" value={String(ws.players.length)} />
            <StatChip label="À faire" value={String(ws.todoCount)} />
          </View>
        </PresidentSectionCard>

        <PresidentSectionCard eyebrow="Indicateurs" title="Cinq axes de direction">
          <PresidentHealthBoard
            health={health}
            onAxisPress={(axis) => {
              shellNav?.requestNav(PRESIDENT_HEALTH_AXIS_NAV[axis.id]);
            }}
          />
        </PresidentSectionCard>

        <PresidentSectionCard eyebrow="Centre de décision" title="Priorités IA (heuristiques)">
          {health.insights.map((line, i) => (
            <PresidentText key={i} variant="body" muted>
              {i + 1}. {line}
            </PresidentText>
          ))}
          <PresidentActionRow
            label="Ouvrir l’assistant exécutif"
            hint="Dialogue Mistral + confirmation d’actions"
            icon="star-four-points"
            accent
            onPress={() => shellNav?.requestNav('ai')}
          />
        </PresidentSectionCard>

        <PresidentSectionCard eyebrow="Actions rapides" title="Piloter sans quitter la direction">
          <PresidentActionRow
            label="Équipes"
            hint="Espace équipes Club"
            icon="football"
            onPress={() => shellNav?.openClubDeepLink('teams')}
          />
          <PresidentActionRow
            label="Match Center"
            hint="Matchs & invitations"
            icon="trophy"
            onPress={() => shellNav?.openClubDeepLink('matches')}
          />
          <PresidentActionRow
            label="Recrutement"
            hint="Bourse & mercato"
            icon="briefcase"
            onPress={() => shellNav?.openClubDeepLink('recruitment')}
          />
          <PresidentActionRow
            label="Centre Vidéo"
            hint="Captations club"
            icon="videocam"
            onPress={() => shellNav?.openClubDeepLink('video')}
          />
          <PresidentActionRow
            label="Adhérents en attente"
            hint={
              ws.pendingMemberships > 0
                ? `${ws.pendingMemberships} à valider`
                : 'Aucune validation en cours'
            }
            icon="people"
            onPress={() => shellNav?.requestNav('members')}
          />
        </PresidentSectionCard>
      </PresidentChapterScroll>
    </View>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  const { tokens } = usePresidentTheme();
  return (
    <View
      style={{
        flex: 1,
        padding: presidentSpace.md,
        borderRadius: 12,
        backgroundColor: tokens.surfaceMuted,
        borderWidth: 1,
        borderColor: tokens.border,
        gap: 2,
      }}
    >
      <PresidentText variant="stat" style={{ fontSize: 22, lineHeight: 26 }}>
        {value}
      </PresidentText>
      <PresidentText variant="caption" muted>
        {label}
      </PresidentText>
    </View>
  );
}

function createStyles(tokens: PresidentThemeTokens) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: tokens.bg },
    statRow: {
      flexDirection: 'row',
      gap: presidentSpace.sm,
      marginTop: presidentSpace.sm,
    },
  });
}
