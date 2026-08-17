import React from 'react';
import type { CoachNavResolvedItem } from '../navigation/resolveCoachNavAccess';
import type { CoachToolGroup } from '../navigation/coachNavConfig';
import { CoachMenuToolGrid } from './CoachMenuToolGrid';

type Props = {
  groups: CoachToolGroup[];
  /** Groupes déjà résolus (verrous, labels). */
  resolvedById: Map<string, CoachNavResolvedItem>;
  onSelect?: (id: CoachNavResolvedItem['id']) => void;
};

/** Liste Outils Menu — grille 2 colonnes par section. */
export function CoachToolsList(props: Props) {
  return <CoachMenuToolGrid {...props} />;
}
