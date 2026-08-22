import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ClubText, ClubChapterScroll, ClubEmptyState } from '../ui/clubUi';
import { ClubBrandHeader } from '../ui/ClubBrandHeader';
import { useClubShellNav } from './ClubShellNavContext';
import { useClubTheme } from './ClubThemeContext';
import { CLUB_TOOL_GROUPS } from '../navigation/clubNavConfig';
import type { ClubNavResolvedItem } from '../navigation/resolveClubNavAccess';
import { AnimatedEntrance, PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import type { ClubThemeTokens } from '../theme/clubTokens';
import { clubRadius, clubSpace } from '../theme/clubDesignSystem';

type Props = {
  items?: ClubNavResolvedItem[];
};

/**
 * Hub Outils — vestiaire digital : header compact, listes aérées, jobs clairs.
 * Pas de cards empilées / rails glow (aligné Accueil + dock émeraude).
 */
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
        <ClubBrandHeader title="Outils" subtitle="Pilotage & métiers du club" />

        {shellNav?.openPresident ? (
          <AnimatedEntrance kind="fadeUp" index={0} delayStep={32}>
            <PressableSpring
              onPress={() => shellNav.openPresident?.()}
              scaleTo={0.98}
              haptic
              style={styles.presidentRow}
              accessibilityRole="button"
              accessibilityLabel="Ouvrir le Pôle Président"
            >
              <View style={[styles.presidentMark, { backgroundColor: tokens.pitch }]} />
              <View style={styles.col}>
                <ClubText variant="body" style={styles.presidentTitle}>
                  Pôle Président
                </ClubText>
                <ClubText variant="caption" muted numberOfLines={1}>
                  Direction · stratégie · cockpit
                </ClubText>
              </View>
              <Icon name="chevron-forward" size={15} color={tokens.pitch} />
            </PressableSpring>
          </AnimatedEntrance>
        ) : null}

        {items.length === 0 ? (
          <ClubEmptyState title="Aucun outil" body="Aucun outil disponible pour le moment." />
        ) : (
          CLUB_TOOL_GROUPS.map((group, groupIndex) => {
            const rows = group.ids
              .map((id) => resolvedById.get(id))
              .filter(Boolean) as ClubNavResolvedItem[];
            if (rows.length === 0) return null;
            const isFrequent = group.collapsible === false;
            const isCollapsible = group.collapsible !== false;
            const isOpen = expanded[group.title] ?? true;
            const entranceIndex = groupIndex + 1;

            return (
              <AnimatedEntrance
                key={group.title}
                kind="fadeUp"
                index={entranceIndex}
                delayStep={32}
              >
                <View style={styles.group}>
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
                      <View style={styles.groupHeadLeft}>
                        <View
                          style={[
                            styles.sectionDot,
                            { backgroundColor: isFrequent ? tokens.pitch : tokens.faint },
                          ]}
                        />
                        <ClubText variant="label" muted style={styles.groupTitle}>
                          {group.title}
                        </ClubText>
                      </View>
                      <Icon
                        name={isOpen ? 'chevron-up' : 'chevron-down'}
                        size={15}
                        color={tokens.faint}
                      />
                    </PressableSpring>
                  ) : (
                    <View style={styles.groupHeadStatic}>
                      <View
                        style={[styles.sectionDot, { backgroundColor: tokens.pitch }]}
                      />
                      <ClubText variant="label" muted style={styles.groupTitle}>
                        {group.title}
                      </ClubText>
                    </View>
                  )}

                  {isOpen ? (
                    <View style={styles.list}>
                      {rows.map((item, rowIndex) => {
                        const ink = isFrequent ? tokens.pitch : tokens.accent;
                        const iconBg = isFrequent ? tokens.pitchSoft : tokens.elevated;
                        const showDivider = rowIndex < rows.length - 1;
                        return (
                          <View key={item.id}>
                            <PressableSpring
                              onPress={() => shellNav?.requestNav(item.id)}
                              scaleTo={0.98}
                              haptic
                              style={styles.row}
                              accessibilityRole="button"
                              accessibilityLabel={item.label}
                              accessibilityHint={item.hint}
                            >
                              <View style={[styles.icon, { backgroundColor: iconBg }]}>
                                <Icon name={item.icon} size={17} color={ink} />
                              </View>
                              <View style={styles.col}>
                                <ClubText variant="body" style={styles.rowTitle}>
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
                                <Icon name="chevron-forward" size={14} color={tokens.faint} />
                              )}
                            </PressableSpring>
                            {showDivider ? (
                              <View
                                style={[styles.divider, { backgroundColor: tokens.border }]}
                              />
                            ) : null}
                          </View>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              </AnimatedEntrance>
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
    presidentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.md,
      paddingVertical: clubSpace.lg,
      paddingHorizontal: clubSpace.sm,
      paddingLeft: clubSpace.md,
      borderRadius: clubRadius.lg,
      backgroundColor: tokens.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      overflow: 'hidden',
    },
    presidentMark: {
      position: 'absolute',
      left: 0,
      top: 14,
      bottom: 14,
      width: 3,
      borderTopRightRadius: 2,
      borderBottomRightRadius: 2,
    },
    presidentTitle: {
      fontWeight: '700',
      letterSpacing: -0.2,
      color: tokens.foreground,
    },
    group: {
      gap: clubSpace.sm,
      paddingTop: clubSpace.xs,
    },
    groupHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 4,
      paddingHorizontal: 2,
    },
    groupHeadStatic: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 4,
      paddingHorizontal: 2,
    },
    groupHeadLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
      minWidth: 0,
    },
    sectionDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      flexShrink: 0,
    },
    groupTitle: {
      letterSpacing: 1.05,
    },
    list: {
      borderRadius: clubRadius.lg,
      backgroundColor: tokens.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.md,
      paddingVertical: 13,
      paddingHorizontal: clubSpace.md,
    },
    icon: {
      width: 34,
      height: 34,
      borderRadius: clubRadius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    col: { flex: 1, minWidth: 0, gap: 2 },
    rowTitle: {
      fontWeight: '600',
      letterSpacing: -0.15,
      color: tokens.foreground,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      marginLeft: clubSpace.md + 34 + clubSpace.md,
    },
  });
}
