import React, { useMemo } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import { AnimatedEntrance } from '../../components/motion';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import {
  ClubActionRow,
  ClubChapterScroll,
  ClubEmptyState,
  ClubLoading,
  ClubSectionCard,
  ClubText,
} from '../../features/club/ui/clubUi';
import { ClubPlayerHero } from '../../features/club/ui/ClubPlayerHero';
import { clubSpace } from '../../features/club/theme/clubDesignSystem';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';

type Props = {
  playerUid: string;
  onBack: () => void;
};

/**
 * Fiche joueur club — hero maillot/crest + infos club.
 * Pas de dossier médical. Pas de score inventé. Pas de carte pôle Joueur.
 */
export function ClubPlayerDetailScreen({ playerUid, onBack }: Props) {
  const { tokens, logoUrl } = useClubTheme();
  const ws = useClubWorkspace();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  if (ws.loading) return <ClubLoading />;

  const player =
    ws.members.find((m) => m.uid === playerUid) ??
    ws.players.find((m) => m.uid === playerUid);
  const membership = ws.memberships.find((m) => m.player_uid === playerUid);
  const team = ws.teams.find((t) => t.id === membership?.team_id);
  const season = player?.profile?.season_stats;

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

  const statusLabel =
    membership?.status === 'pending'
      ? 'En attente'
      : membership?.status === 'active'
        ? membership.license_number
          ? 'Licencié'
          : 'Actif'
        : membership?.status ?? '—';

  const statusTone =
    membership?.status === 'active'
      ? 'ok'
      : membership?.status === 'pending'
        ? 'warn'
        : 'neutral';

  return (
    <View style={styles.root}>
      <ClubChapterScroll>
        <PressableSpring onPress={onBack} scaleTo={0.97} haptic style={styles.back}>
          <Icon name="arrow-back" size={18} color={tokens.accent} />
          <ClubText variant="caption" style={{ color: tokens.accent, fontWeight: '700' }}>
            Joueurs
          </ClubText>
        </PressableSpring>

        <AnimatedEntrance kind="zoom" index={0}>
          <ClubPlayerHero
            displayName={player.display_name || 'Joueur'}
            position={player.profile?.position}
            jerseyNumber={player.profile?.jersey_number}
            photoUrl={player.avatar_url}
            clubName={ws.club?.name ?? team?.name}
            clubLogoUrl={logoUrl}
            subtitle={[team?.name, player.profile?.category].filter(Boolean).join(' · ') || undefined}
            statusLabel={statusLabel}
            statusTone={statusTone}
            stats={
              season
                ? {
                    matches: season.matches,
                    goals: season.goals,
                    assists: season.assists,
                  }
                : undefined
            }
          />
        </AnimatedEntrance>

        <ClubSectionCard title="Identité club">
          <ClubText variant="body" muted>
            Catégorie : {player.profile?.category || '—'}
          </ClubText>
          <ClubText variant="body" muted>
            Poste : {player.profile?.position || '—'}
          </ClubText>
          <ClubText variant="body" muted>
            Maillot :{' '}
            {player.profile?.jersey_number != null ? `#${player.profile.jersey_number}` : '—'}
          </ClubText>
          <ClubText variant="body" muted>
            Licence : {membership?.license_number || 'Non renseignée'}
          </ClubText>
          <ClubText variant="caption" muted>
            Pas de dossier médical sur cette fiche.
          </ClubText>
        </ClubSectionCard>

        <ClubSectionCard title="Contact">
          {player.email ? (
            <ClubActionRow
              icon="mail"
              label={player.email}
              hint="E-mail"
              onPress={() => void Linking.openURL(`mailto:${player.email}`)}
            />
          ) : (
            <ClubText variant="body" muted>
              Aucun e-mail renseigné.
            </ClubText>
          )}
          {player.phone ? (
            <ClubActionRow
              icon="call"
              label={player.phone}
              hint="Téléphone"
              onPress={() => void Linking.openURL(`tel:${player.phone}`)}
            />
          ) : null}
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

const createStyles = (_tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    back: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingVertical: clubSpace.xs,
    },
  });
