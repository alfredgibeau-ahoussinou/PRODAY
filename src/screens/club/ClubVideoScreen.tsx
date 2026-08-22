import React, { useMemo } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { ClubCamerasPanel } from '../../components/club/ClubCamerasPanel';
import { CLUB_VIDEO_PROVIDERS } from '../../features/club/video/ClubVideoProvider';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import {
  ClubActionRow,
  ClubChapterScroll,
  ClubLoading,
  ClubSectionCard,
  ClubText,
} from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';

/** Vidéo & caméras — Veo / XbotGo / Smartphone / autre (jamais forcé). */
export function ClubVideoScreen() {
  const profile = useSessionProfile();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  if (ws.loading) return <ClubLoading />;

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubBrandHeader
          title="Vidéo"
          subtitle="Outil vidéo — captation au choix, aucun vendeur imposé"
        />

        <ClubSectionCard title="Fournisseurs">
          {CLUB_VIDEO_PROVIDERS.map((p) => (
            <ClubActionRow
              key={p.id}
              icon="videocam"
              label={p.label}
              hint={p.description}
              onPress={() =>
                Alert.alert(
                  p.label,
                  p.connected
                    ? 'Intégration native active pour ce fournisseur.'
                    : 'Pas d’OAuth dans l’app pour l’instant. Enregistrez une fiche caméra ou importez des fichiers ci-dessous — pack / devis via Offre club si besoin.',
                )
              }
            />
          ))}
        </ClubSectionCard>

        <ClubSectionCard title="Caméras club">
          {ws.clubId && profile ? (
            <ClubCamerasPanel profile={profile} clubId={ws.clubId} />
          ) : (
            <ClubText variant="body" muted>
              Liez un club pour enregistrer vos caméras (Veo, XbotGo, smartphone…).
            </ClubText>
          )}
        </ClubSectionCard>
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
  });
