import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ClubPitchMapPanel } from '../../../components/club/ClubPitchMapPanel';
import { ClubChapterScroll, ClubSectionCard } from '../../../components/club/clubPortalUi';
import type { ClubHubSectionId } from '../../../content/clubPoleExperience';
import { useClubShellNav } from './ClubShellNavContext';
import type { ClubNavItemId } from '../navigation/clubNavConfig';
import { spacing } from '../../../theme/designTokens';

function sectionToNav(section: ClubHubSectionId): ClubNavItemId {
  switch (section) {
    case 'structure':
      return 'structure';
    case 'bourse':
      return 'vivier';
    case 'invites':
      return 'invites';
    case 'events':
      return 'events';
    case 'mercato':
      return 'pipeline';
    case 'offers':
      return 'offers';
    case 'video':
      return 'video';
    case 'equipment':
      return 'equipment';
    case 'sponsors':
      return 'sponsors';
    case 'pitch':
      return 'pitch';
    case 'overview':
    case 'modules':
    default:
      return 'today';
  }
}

/** Cockpit terrain — contenu sous le hero ClubPageFrame. */
export function ClubPitchPane() {
  const shellNav = useClubShellNav();

  return (
    <ClubChapterScroll>
      <View style={styles.stack}>
        <ClubSectionCard
          kicker="Commandes"
          title="Touchez une zone du terrain"
          body="Chaque zone ouvre le dossier correspondant — comme sur le site Pro Club."
        />
        <ClubPitchMapPanel
          onOpenSection={(section) => shellNav?.requestNav(sectionToNav(section))}
          onOpenCarpool={() => shellNav?.requestNav('carpool')}
        />
      </View>
    </ClubChapterScroll>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
});
