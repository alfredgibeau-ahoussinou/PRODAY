import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MessagesScreen } from '../MessagesScreen';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import {
  ClubActionRow,
  ClubChapterScroll,
  ClubSectionCard,
  ClubSegmentedControl,
  ClubText,
} from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { clubRadius, clubShadow, clubSpace } from '../../features/club/theme/clubDesignSystem';

type Channel = 'hub' | 'inbox';

/** Communication — esthétique messaging moderne (logique MessagesScreen inchangée). */
export function ClubCommunicationScreen() {
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const [channel, setChannel] = useState<Channel>('hub');
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  if (channel === 'inbox') {
    return (
      <View style={styles.root}>
        <View style={styles.inboxBar}>
          <ClubActionRow
            icon="arrow-back"
            label="Retour aux canaux"
            onPress={() => setChannel('hub')}
          />
        </View>
        <MessagesScreen />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ClubChapterScroll>
        <ClubBrandHeader
          title="Communication"
          subtitle="Équipes · coachs · parents · annonces"
        />

        <ClubSegmentedControl
          options={[
            { id: 'hub' as const, label: 'Canaux' },
            { id: 'inbox' as const, label: 'Messagerie' },
          ]}
          value={channel}
          onChange={setChannel}
        />

        <ClubSectionCard title="Annonces">
          <View style={styles.announce}>
            <ClubText variant="label" muted>
              Broadcast
            </ClubText>
            <ClubText variant="h3">Annonces club</ClubText>
            <ClubText variant="body" muted>
              Publiez une info officielle vers l’effectif via la messagerie ProDay.
            </ClubText>
            <ClubActionRow
              icon="notifications"
              label="Ouvrir les annonces"
              hint="Messagerie existante"
              onPress={() => setChannel('inbox')}
            />
          </View>
        </ClubSectionCard>

        <ClubSectionCard title="Canaux">
          <ClubActionRow
            icon="chat"
            label="Messagerie"
            hint="Fils staff & effectif"
            onPress={() => setChannel('inbox')}
          />
          <ClubActionRow
            icon="people"
            label="Équipe"
            hint="Annonces par catégorie"
            onPress={() => shellNav?.requestNav('teams')}
          />
          <ClubActionRow
            icon="school"
            label="Coachs"
            hint="Coordination staff"
            onPress={() => shellNav?.requestNav('coaches')}
          />
          <ClubActionRow
            icon="mail"
            label="Parents"
            hint="Infos licenciés mineurs"
            onPress={() => setChannel('inbox')}
          />
        </ClubSectionCard>

        <ClubText variant="caption" muted>
          La messagerie ProDay existante est réutilisée — pas de second système parallèle.
        </ClubText>
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    inboxBar: {
      paddingHorizontal: clubSpace.lg,
      paddingTop: clubSpace.sm,
      backgroundColor: tokens.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.border,
    },
    announce: {
      gap: clubSpace.sm,
      padding: clubSpace.md,
      borderRadius: clubRadius.lg,
      backgroundColor: tokens.headerWash,
      borderWidth: 1,
      borderColor: tokens.border,
      ...clubShadow.soft,
    },
  });
