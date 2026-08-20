import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MessagesScreen } from '../MessagesScreen';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import {
  ClubActionRow,
  ClubChapterScroll,
  ClubScreenHeader,
  ClubSectionCard,
  ClubText,
} from '../../features/club/ui/clubUi';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';

type Channel = 'hub' | 'inbox';

/** Communication — équipe / coachs / parents / annonces. */
export function ClubCommunicationScreen() {
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const [channel, setChannel] = useState<Channel>('hub');
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  if (channel === 'inbox') {
    return (
      <View style={styles.root}>
        <MessagesScreen />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ClubChapterScroll>
        <ClubScreenHeader
          title="Communication"
          subtitle="Équipes · coachs · parents · annonces"
        />

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
          <ClubActionRow
            icon="notifications"
            label="Annonces club"
            hint="Broadcast officiel"
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
    root: { flex: 1, backgroundColor: tokens.bg },
  });
