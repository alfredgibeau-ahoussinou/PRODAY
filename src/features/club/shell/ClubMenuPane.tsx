import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ClubText, ClubChapterScroll, ClubEmptyState } from '../ui/clubUi';
import { ClubBrandHeader } from '../ui/ClubBrandHeader';
import { useClubShellNav } from './ClubShellNavContext';
import { useClubTheme } from './ClubThemeContext';
import { CLUB_TOOL_GROUPS } from '../navigation/clubNavConfig';
import type { ClubNavResolvedItem } from '../navigation/resolveClubNavAccess';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import type { ClubThemeTokens } from '../theme/clubTokens';
import { clubRadius, clubShadow, clubSpace } from '../theme/clubDesignSystem';

type Props = {
  items?: ClubNavResolvedItem[];
};

/** Hub Outils — catalogue d’outils par jobs (Fréquents + sections repliables). */
export function ClubMenuPane({ items = [] }: Props) {
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const resolvedById = useMemo(
    () => new Map(items.map((item) => [item.id, item] as const)),
    [items],
  );

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const group of CLUB_TOOL_GROUPS) {
      if (group.collapsible === false) {
        init[group.title] = true;
      } else {
        init[group.title] = group.defaultExpanded ?? false;
      }
    }
    return init;
  });

  return (
    <View style={styles.root}>
      <ClubChapterScroll>
        <ClubBrandHeader title="Outils" subtitle="Catalogue d’outils du club" />
        {shellNav?.openPresident ? (
          <PressableSpring
            onPress={() => shellNav.openPresident?.()}
            scaleTo={0.98}
            haptic
            style={[
              styles.row,
              {
                borderColor: tokens.accent,
                backgroundColor: tokens.accentSoft,
                marginBottom: clubSpace.md,
              },
            ]}
          >
            <Icon name="briefcase" size={20} color={tokens.accent} />
            <View style={{ flex: 1 }}>
              <ClubText variant="body" style={{ fontWeight: '700' }}>
                Ouvrir le Pôle Président
              </ClubText>
              <ClubText variant="caption" muted>
                Direction · stratégie · cockpit exécutif
              </ClubText>
            </View>
            <Icon name="chevron-forward" size={16} color={tokens.muted} />
          </PressableSpring>
        ) : null}
        {items.length === 0 ? (
          <ClubEmptyState title="Aucun outil" body="Aucun outil disponible pour le moment." />
        ) : (
          CLUB_TOOL_GROUPS.map((group) => {
            const rows = group.ids
              .map((id) => resolvedById.get(id))
              .filter(Boolean) as ClubNavResolvedItem[];
            if (rows.length === 0) return null;
            const isCollapsible = group.collapsible !== false;
            const isOpen = expanded[group.title] ?? true;
            return (
              <View key={group.title} style={styles.group}>
                {isCollapsible ? (
                  <PressableSpring
                    onPress={() =>
                      setExpanded((prev) => ({
                        ...prev,
                        [group.title]: !prev[group.title],
                      }))
                    }
                    scaleTo={0.98}
                    haptic
                    style={styles.groupHead}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isOpen }}
                    accessibilityLabel={`${group.title}, ${isOpen ? 'replier' : 'déplier'}`}
                  >
                    <ClubText variant="label" muted style={styles.groupTitle}>
                      {group.title}
                    </ClubText>
                    <Icon
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={tokens.faint}
                    />
                  </PressableSpring>
                ) : (
                  <ClubText variant="label" muted style={styles.groupTitle}>
                    {group.title}
                  </ClubText>
                )}
                {isOpen ? (
                  <View
                    style={[
                      styles.card,
                      group.collapsible === false && {
                        borderLeftColor: tokens.pitch,
                      },
                    ]}
                  >
                    {rows.map((item) => (
                      <PressableSpring
                        key={item.id}
                        onPress={() => shellNav?.requestNav(item.id)}
                        scaleTo={0.98}
                        haptic
                        style={styles.row}
                      >
                        <View
                          style={[
                            styles.icon,
                            group.collapsible === false && {
                              backgroundColor: tokens.pitchSoft,
                            },
                          ]}
                        >
                          <Icon
                            name={item.icon}
                            size={18}
                            color={
                              group.collapsible === false ? tokens.pitch : tokens.accent
                            }
                          />
                        </View>
                        <View style={styles.col}>
                          <ClubText variant="body" style={{ fontWeight: '600' }}>
                            {item.label}
                          </ClubText>
                          {item.hint ? (
                            <ClubText variant="caption" muted numberOfLines={1}>
                              {item.hint}
                            </ClubText>
                          ) : null}
                        </View>
                        {item.locked ? (
                          <Icon name="lock" size={14} color={tokens.muted} />
                        ) : (
                          <Icon name="chevron-forward" size={16} color={tokens.faint} />
                        )}
                      </PressableSpring>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ClubChapterScroll>
    </View>
  );
}

function createStyles(tokens: ClubThemeTokens) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    group: { gap: clubSpace.sm },
    groupHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 2,
      paddingHorizontal: 2,
    },
    groupTitle: { marginLeft: 4 },
    card: {
      backgroundColor: tokens.surface,
      borderRadius: clubRadius.xl,
      padding: clubSpace.sm,
      borderWidth: 1,
      borderColor: tokens.borderStrong,
      borderLeftWidth: 3,
      borderLeftColor: tokens.accent,
      gap: 2,
      ...clubShadow.card,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
      paddingVertical: 10,
      paddingHorizontal: clubSpace.sm,
      borderRadius: clubRadius.md,
    },
    icon: {
      width: 38,
      height: 38,
      borderRadius: clubRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.accentSoft,
    },
    col: { flex: 1, minWidth: 0, gap: 2 },
  });
}
