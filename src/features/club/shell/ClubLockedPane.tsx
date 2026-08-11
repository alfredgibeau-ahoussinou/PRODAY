import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ClubActionRow,
  ClubChapterScroll,
  ClubEmptyState,
  ClubSectionCard,
} from '../../../components/club/clubPortalUi';
import { ProDayText } from '../../../components/ui/ProDayText';
import { useClubShellNav } from './ClubShellNavContext';
import type { ClubNavResolvedItem } from '../navigation/resolveClubNavAccess';
import { spacing } from '../../../theme/designTokens';

type Props = {
  item: ClubNavResolvedItem;
};

/** Contenu affiché quand un module est hors formule. */
export function ClubLockedPane({ item }: Props) {
  const shellNav = useClubShellNav();

  return (
    <ClubChapterScroll>
      <View style={styles.stack}>
        <ClubSectionCard
          kicker={item.label}
          title="Hors formule actuelle"
          body={item.lockReason ?? 'Ce module n’est pas inclus dans votre offre.'}
        >
          <ClubActionRow
            primary="Voir Offres & formule"
            onPrimary={() => shellNav?.requestNav('offers')}
            secondary="Assistant"
            onSecondary={() => shellNav?.requestNav('assistant')}
          />
        </ClubSectionCard>
        <ClubEmptyState
          title="Passez à la bonne offre"
          body="Amateur, Essentiel, Tout inclus ou Pro + Veo — chaque dossier s’ouvre avec la formule adaptée."
          cta="Comparer les formules"
          onPress={() => shellNav?.requestNav('offers')}
        />
        <ProDayText variant="caption" muted>
          Aujourd’hui et l’Assistant restent accessibles pour vous orienter.
        </ProDayText>
      </View>
    </ClubChapterScroll>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
});
