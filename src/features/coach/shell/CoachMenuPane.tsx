import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { CoachChapterScroll, CoachText } from '../../../components/coach/coachPortalUi';
import { CoachPane } from '../../../components/coach/CoachScreenHeader';
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

/** Hub Menu — liste Outils groupés (Match, Club, Performance). */
export function CoachMenuPane({ items = [] }: Props) {
  const shellNav = useCoachShellNav();
  const resolvedById = useMemo(
    () => new Map(items.map((item) => [item.id, item] as const)),
    [items],
  );

  if (items.length === 0) {
    return (
      <CoachPane title={getCoachPageIdentity('plus').title}>
        <CoachChapterScroll>
          <CoachText variant="caption" muted style={styles.lead}>
            Aucun outil disponible pour le moment.
          </CoachText>
        </CoachChapterScroll>
      </CoachPane>
    );
  }

  return (
    <CoachPane title={getCoachPageIdentity('plus').title}>
      <CoachChapterScroll>
        <CoachToolsList
          groups={COACH_TOOL_GROUPS}
          resolvedById={resolvedById}
          title=""
          onSelect={(id) => shellNav?.requestNav(id)}
        />
      </CoachChapterScroll>
    </CoachPane>
  );
}

const styles = StyleSheet.create({
  lead: {
    marginBottom: spacing.md,
    lineHeight: 18,
    color: COACH_SITE.muted,
  },
});
