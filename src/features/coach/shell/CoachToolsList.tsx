import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  CoachSectionCard,
  CoachSettingsGroup,
  CoachSettingsRow,
} from '../../../components/coach/coachPortalUi';
import type { CoachNavResolvedItem } from '../navigation/resolveCoachNavAccess';
import type { CoachToolGroup, CoachToolGroupId } from '../navigation/coachNavConfig';
import { useCoachShellNav } from './CoachShellNavContext';
import { spacing } from '../../../theme/designTokens';

type Props = {
  groups: CoachToolGroup[];
  /** Groupes déjà résolus (verrous, labels). */
  resolvedById: Map<string, CoachNavResolvedItem>;
  onSelect?: (id: CoachNavResolvedItem['id']) => void;
};

const GROUP_CARD: Record<
  CoachToolGroupId,
  { title: string; body: string }
> = {
  match: {
    title: 'Compétition & entraînements',
    body: 'Calendrier matchs et séances.',
  },
  club: {
    title: 'Gestion & communication',
    body: 'Effectif, parents et covoiturage.',
  },
  performance: {
    title: 'Analyse & préparation',
    body: 'Tactique IA, vidéos et suivi forme.',
  },
};

/** Liste Outils — une CoachSectionCard par groupe (Match, Club, Performance). */
export function CoachToolsList({ groups, resolvedById, onSelect }: Props) {
  const shellNav = useCoachShellNav();
  const styles = useMemo(() => createStyles(), []);

  const handleSelect = (item: CoachNavResolvedItem) => {
    if (item.locked) return;
    if (onSelect) onSelect(item.id);
    else shellNav?.requestNav(item.id);
  };

  return (
    <View style={styles.root}>
      {groups.map((group) => {
        const items = group.toolIds
          .map((id) => resolvedById.get(id))
          .filter((item): item is CoachNavResolvedItem => Boolean(item));
        if (items.length === 0) return null;

        const card = GROUP_CARD[group.id];

        return (
          <CoachSectionCard
            key={group.id}
            kicker={group.label}
            title={card.title}
            body={card.body}
          >
            <CoachSettingsGroup>
              {items.map((item, index) => (
                <CoachSettingsRow
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  locked={item.locked}
                  badge={item.aiBadge ? 'IA' : undefined}
                  last={index === items.length - 1}
                  onPress={() => handleSelect(item)}
                />
              ))}
            </CoachSettingsGroup>
          </CoachSectionCard>
        );
      })}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: { gap: spacing.md, paddingBottom: spacing.xl },
  });
}
