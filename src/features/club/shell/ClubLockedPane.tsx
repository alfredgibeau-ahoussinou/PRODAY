import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ClubActionRow,
  ClubChapterScroll,
  ClubEmptyState,
  ClubSectionCard,
  ClubText,
} from '../ui/clubUi';
import { ClubBrandHeader } from '../ui/ClubBrandHeader';
import { useClubShellNav } from './ClubShellNavContext';
import { useClubTheme } from './ClubThemeContext';
import type { ClubNavResolvedItem } from '../navigation/resolveClubNavAccess';
import type { ClubThemeTokens } from '../theme/clubTokens';

type Props = {
  item: ClubNavResolvedItem;
};

/** Contenu affiché quand un module est hors formule. */
export function ClubLockedPane({ item }: Props) {
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  return (
    <View style={styles.root}>
      <ClubChapterScroll>
        <ClubBrandHeader title={item.label} subtitle="Module verrouillé" />
        <ClubSectionCard title="Accès">
          <ClubText variant="h3">Hors formule actuelle</ClubText>
          <ClubText variant="body" muted>
            {item.lockReason ?? 'Ce module n’est pas inclus dans votre offre.'}
          </ClubText>
          <ClubActionRow
            icon="star-outline"
            label="Voir Pack Club"
            hint="SUR DEVIS · dès 3 € / adhérent"
            onPress={() => shellNav?.requestNav('pack')}
          />
          <ClubActionRow
            icon="star-four-points"
            label="Assistant IA"
            onPress={() => shellNav?.requestNav('assistant')}
          />
        </ClubSectionCard>
        <ClubEmptyState
          title="Débloquez ce module"
          body="Choisissez la formule adaptée via Pack Club — jamais libellé Premium."
          actionLabel="Pack Club"
          onAction={() => shellNav?.requestNav('pack')}
          icon="lock"
        />
      </ClubChapterScroll>
    </View>
  );
}

function createStyles(tokens: ClubThemeTokens) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
  });
}
