import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  CoachChapterScroll,
  CoachEmptyState,
  CoachText,
} from '../../../components/coach/coachPortalUi';
import { CoachScreenHeader } from '../../../components/coach/CoachScreenHeader';
import { COACH_SITE, getCoachPageIdentity } from '../../../content/coachPageIdentity';
import type { CoachNavResolvedItem } from '../navigation/resolveCoachNavAccess';
import { COACH_TOOL_GROUPS } from '../navigation/coachNavConfig';
import { CoachToolsList } from './CoachToolsList';
import { useCoachShellNav } from './CoachShellNavContext';
import { spacing } from '../../../theme/designTokens';

type Props = {
  /** Legacy — liste d’outils résolus (deep link Menu / plus). */
  items?: CoachNavResolvedItem[];
};

const pageIdentity = getCoachPageIdentity('plus');

/** Hub Menu — outils groupés (Match, Club, Performance). */
export function CoachMenuPane({ items = [] }: Props) {
  const shellNav = useCoachShellNav();
  const resolvedById = useMemo(
    () => new Map(items.map((item) => [item.id, item] as const)),
    [items],
  );

  return (
    <View style={styles.root}>
      <CoachScreenHeader title={pageIdentity.title} showTeamRow={false} />
      <CoachChapterScroll>
        <CoachText variant="body" muted style={styles.subtitle}>
          {pageIdentity.support}
        </CoachText>

        {items.length === 0 ? (
          <CoachEmptyState
            title="Aucun outil"
            body="Aucun outil disponible pour le moment."
          />
        ) : (
          <CoachToolsList
            groups={COACH_TOOL_GROUPS}
            resolvedById={resolvedById}
            onSelect={(id) => shellNav?.requestNav(id)}
          />
        )}
      </CoachChapterScroll>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0, backgroundColor: COACH_SITE.bg },
  subtitle: { marginTop: -spacing.sm },
});
