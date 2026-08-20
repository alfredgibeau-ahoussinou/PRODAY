import React, { useMemo } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
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

type Props = {
  playerUid: string;
  onBack: () => void;
};

/**
 * Fiche joueur club — admin / notes / docs.
 * Pas de dossier médical. Données sensibles = permission gated (UI).
 */
export function ClubPlayerDetailScreen({ playerUid, onBack }: Props) {
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  if (ws.loading) return <ClubLoading />;

  const player =
    ws.members.find((m) => m.uid === playerUid) ??
    ws.players.find((m) => m.uid === playerUid);
  const membership = ws.memberships.find((m) => m.player_uid === playerUid);
  const team = ws.teams.find((t) => t.id === membership?.team_id);

  if (!player) {
    return (
      <View style={styles.root}>
        <ClubChapterScroll>
          <ClubEmptyState
            title="Joueur introuvable"
            body="Ce profil n’est plus lié au club."
            actionLabel="Retour"
            onAction={onBack}
          />
        </ClubChapterScroll>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ClubChapterScroll>
        <PressableSpring onPress={onBack} scaleTo={0.97} haptic style={styles.back}>
          <Icon name="arrow-back" size={18} color={tokens.accent} />
          <ClubText variant="caption" style={{ color: tokens.accent, fontWeight: '700' }}>
            Joueurs
          </ClubText>
        </PressableSpring>

        <ClubScreenHeader
          title={player.display_name || 'Joueur'}
          subtitle={[team?.name, membership?.status === 'pending' ? 'En attente' : 'Actif']
            .filter(Boolean)
            .join(' · ')}
        />

        <ClubSectionCard title="Identité club">
          <ClubText variant="body" muted>
            Catégorie : {player.profile?.category || '—'}
          </ClubText>
          <ClubText variant="body" muted>
            Poste : {player.profile?.position || '—'}
          </ClubText>
          <ClubText variant="caption" muted>
            Pas de dossier médical sur cette fiche.
          </ClubText>
        </ClubSectionCard>

        <ClubSectionCard title="Notes staff">
          <ClubText variant="body" muted>
            Notes internes (visibles selon votre rôle). Aucune donnée sensible n’est affichée sans
            permission.
          </ClubText>
          <ClubActionRow
            icon="document"
            label="Ajouter une note"
            onPress={() =>
              Alert.alert('Notes', 'La saisie des notes staff arrive dans le prochain passage.')
            }
          />
        </ClubSectionCard>

        <ClubSectionCard title="Documents">
          <ClubActionRow
            icon="document"
            label="Licences & pièces"
            hint="Accès réservé Admin / Dirigeant"
            onPress={() =>
              Alert.alert(
                'Documents',
                'Les documents sensibles sont filtrés selon votre rôle (Admin, Dirigeant, DS, Coach).',
              )
            }
          />
        </ClubSectionCard>
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: tokens.bg },
    back: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingVertical: spacing.xs,
    },
  });
