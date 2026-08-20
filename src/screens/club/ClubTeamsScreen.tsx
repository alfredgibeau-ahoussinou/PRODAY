import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
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
import { PressableSpring } from '../../components/motion';
import { teamsService } from '../../services/teams.service';
import { formatTeamRowLabel } from '../../utils/clubStructureView';
import { ClubTeamSpaceScreen } from './ClubTeamSpaceScreen';
import { spacing } from '../../theme/designTokens';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';

/** Mes Équipes — cartes catégories → espace équipe. */
export function ClubTeamsScreen() {
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const [teamName, setTeamName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const selected = shellNav?.selectedTeamId ?? null;

  const createTeam = async () => {
    if (!ws.clubId) {
      Alert.alert('Club requis', 'Liez un club pour créer une équipe.');
      return;
    }
    const name = teamName.trim();
    if (!name) {
      Alert.alert('Nom requis', 'Indiquez le nom de l’équipe (ex. U15).');
      return;
    }
    setCreating(true);
    try {
      await teamsService.create({
        club_id: ws.clubId,
        name,
        is_default: ws.teams.length === 0,
      });
      setTeamName('');
      setShowCreate(false);
      await ws.refresh();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Création impossible.');
    } finally {
      setCreating(false);
    }
  };

  if (selected) {
    return (
      <ClubTeamSpaceScreen
        teamId={selected}
        onBack={() => shellNav?.setSelectedTeamId?.(null)}
      />
    );
  }

  if (ws.loading) return <ClubLoading />;

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubScreenHeader
          title="Équipes"
          subtitle={`${ws.teamRows.length} catégorie(s)`}
        />

        {ws.teamRows.length === 0 ? (
          <ClubEmptyState
            title="Structurez votre club"
            body="Ajoutez vos équipes (U7 → Seniors). Les joueurs et coachs s’y rattachent ensuite."
            actionLabel="+ Créer une équipe"
            onAction={() => setShowCreate(true)}
            icon="football"
          />
        ) : (
          <View style={styles.grid}>
            {ws.teamRows.map((row) => (
              <ClubSectionCard key={row.teamId}>
                <ClubActionRow
                  icon="football"
                  label={formatTeamRowLabel(row)}
                  hint={[
                    `${row.licensedCount} licencié(s)`,
                    row.coachNames.length
                      ? `Coach : ${row.coachNames.join(', ')}`
                      : 'Sans coach',
                  ].join(' · ')}
                  onPress={() => shellNav?.setSelectedTeamId?.(row.teamId)}
                />
              </ClubSectionCard>
            ))}
          </View>
        )}

        <ClubActionRow
          icon="add"
          label="Nouvelle équipe"
          hint="Catégorie U7 → Seniors"
          onPress={() => setShowCreate(true)}
        />

        {showCreate ? (
          <ClubSectionCard title="Créer une équipe">
            <TextInput
              value={teamName}
              onChangeText={setTeamName}
              placeholder="Ex. U15 garçons"
              placeholderTextColor={tokens.muted}
              style={{
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: tokens.border,
                backgroundColor: tokens.elevated,
                borderRadius: 12,
                paddingHorizontal: spacing.md,
                paddingVertical: 12,
                color: tokens.foreground,
              }}
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' }}>
              <PressableSpring onPress={() => setShowCreate(false)} scaleTo={0.97}>
                <ClubText variant="caption" muted style={{ fontWeight: '700' }}>
                  Annuler
                </ClubText>
              </PressableSpring>
              <PressableSpring
                onPress={() => void createTeam()}
                scaleTo={0.97}
                haptic
                disabled={creating}
                style={{
                  backgroundColor: tokens.accent,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 12,
                }}
              >
                <ClubText variant="caption" style={{ color: '#fff', fontWeight: '800' }}>
                  {creating ? '…' : 'Enregistrer'}
                </ClubText>
              </PressableSpring>
            </View>
          </ClubSectionCard>
        ) : null}

        <ClubText variant="caption" muted>
          L’IA peut suggérer des mouvements entre équipes — jamais les appliquer sans vous.
        </ClubText>
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: tokens.bg },
    grid: { gap: spacing.sm },
  });
