import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { CoachText } from '../../../components/coach/coachPortalUi';
import { COACH_SITE } from '../../../content/coachPageIdentity';
import type { CoachNavResolvedItem } from '../navigation/resolveCoachNavAccess';
import type { CoachToolGroup } from '../navigation/coachNavConfig';
import { useCoachShellNav } from './CoachShellNavContext';
import { CoachNavRow } from './CoachNavRow';
import { radius, spacing } from '../../../theme/designTokens';

type Props = {
  groups: CoachToolGroup[];
  /** Groupes déjà résolus (verrous, labels). */
  resolvedById: Map<string, CoachNavResolvedItem>;
  /** Titre de section — omit pour liste nue. */
  title?: string;
  onSelect?: (id: CoachNavResolvedItem['id']) => void;
};

/** Liste Outils style iOS Settings — une colonne, groupes optionnels. */
export function CoachToolsList({ groups, resolvedById, title = 'Outils', onSelect }: Props) {
  const shellNav = useCoachShellNav();
  const styles = useMemo(() => createStyles(), []);

  const handleSelect = (item: CoachNavResolvedItem) => {
    if (item.locked) return;
    if (onSelect) onSelect(item.id);
    else shellNav?.requestNav(item.id);
  };

  return (
    <View style={styles.root}>
      {title ? (
        <CoachText variant="section" style={styles.title}>
          {title}
        </CoachText>
      ) : null}
      {groups.map((group) => {
        const items = group.toolIds
          .map((id) => resolvedById.get(id))
          .filter((item): item is CoachNavResolvedItem => Boolean(item));
        if (items.length === 0) return null;

        return (
          <View key={group.id} style={styles.group}>
            {group.label ? (
              <CoachText variant="caption" muted style={styles.groupHeader}>
                {group.label.toUpperCase()}
              </CoachText>
            ) : null}
            <View style={styles.groupCard}>
              {items.map((item, index) => (
                <CoachNavRow
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  locked={item.locked}
                  aiBadge={item.aiBadge}
                  onPress={() => handleSelect(item)}
                  showSeparator={index < items.length - 1}
                />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: { gap: spacing.md, paddingBottom: spacing.xl },
    title: {
      color: COACH_SITE.foreground,
      fontWeight: '700',
      fontSize: 22,
      letterSpacing: -0.3,
    },
    group: { gap: spacing.xs },
    groupHeader: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.8,
      paddingHorizontal: spacing.md,
      marginBottom: 2,
    },
    groupCard: {
      backgroundColor: COACH_SITE.surface,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
  });
}
