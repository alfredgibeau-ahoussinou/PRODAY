import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ClubText, ClubChapterScroll, ClubEmptyState, ClubScreenHeader } from '../ui/clubUi';
import { useClubShellNav } from './ClubShellNavContext';
import { useClubTheme } from './ClubThemeContext';
import { CLUB_TOOL_GROUPS } from '../navigation/clubNavConfig';
import type { ClubNavResolvedItem } from '../navigation/resolveClubNavAccess';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { spacing } from '../../../theme/designTokens';
import type { ClubThemeTokens } from '../theme/clubTokens';

type Props = {
  items?: ClubNavResolvedItem[];
};

/** Hub Menu — outils groupés (mobile). */
export function ClubMenuPane({ items = [] }: Props) {
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const resolvedById = useMemo(
    () => new Map(items.map((item) => [item.id, item] as const)),
    [items],
  );

  return (
    <View style={styles.root}>
      <ClubScreenHeader title="Menu" subtitle="Tous les outils du club" />
      <ClubChapterScroll>
        {items.length === 0 ? (
          <ClubEmptyState title="Aucun outil" body="Aucun outil disponible pour le moment." />
        ) : (
          CLUB_TOOL_GROUPS.map((group) => {
            const rows = group.ids
              .map((id) => resolvedById.get(id))
              .filter(Boolean) as ClubNavResolvedItem[];
            if (rows.length === 0) return null;
            return (
              <View key={group.title} style={styles.group}>
                <ClubText variant="caption" muted style={styles.groupTitle}>
                  {group.title}
                </ClubText>
                {rows.map((item) => (
                  <PressableSpring
                    key={item.id}
                    onPress={() => shellNav?.requestNav(item.id)}
                    scaleTo={0.98}
                    haptic
                    style={styles.row}
                  >
                    <View style={styles.icon}>
                      <Icon name={item.icon} size={18} color={tokens.accent} />
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
                      <Icon name="chevron-forward" size={16} color={tokens.muted} />
                    )}
                  </PressableSpring>
                ))}
              </View>
            );
          })
        )}
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, minHeight: 0, backgroundColor: tokens.bg },
    group: { gap: spacing.xs, marginBottom: spacing.md },
    groupTitle: {
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      fontWeight: '800',
      fontSize: 11,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      backgroundColor: tokens.surface,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    icon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.accentSoft,
    },
    col: { flex: 1, minWidth: 0, gap: 2 },
  });
