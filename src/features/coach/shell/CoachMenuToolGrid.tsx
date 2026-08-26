import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { CoachText } from '../../../components/coach/coachPortalUi';
import { Icon } from '../../../components/ui/Icon';
import { PressableSpring } from '../../../components/motion';
import { useTranslation } from '../../../context/LocaleContext';
import type { CoachNavResolvedItem } from '../navigation/resolveCoachNavAccess';
import type { CoachToolGroup, CoachToolGroupId } from '../navigation/coachNavConfig';
import { useCoachShellNav } from './CoachShellNavContext';
import { useCoachTheme, useCoachThemedStyles } from './CoachThemeContext';
import type { CoachThemeTokens } from '../../../utils/coachTeamTheme';
import { spacing } from '../../../theme/designTokens';
import { coachChrome } from '../theme/coachDesignSystem';

type Props = {
  groups: CoachToolGroup[];
  resolvedById: Map<string, CoachNavResolvedItem>;
  onSelect?: (id: CoachNavResolvedItem['id']) => void;
};

const SECTION_I18N: Record<CoachToolGroupId, string> = {
  match: 'coach.portal.menu.section.match',
  club: 'coach.portal.menu.section.club',
  performance: 'coach.portal.menu.section.performance',
};

type TileProps = {
  item: CoachNavResolvedItem;
  onPress: () => void;
};

function CoachMenuToolTile({ item, onPress }: TileProps) {
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createTileStyles);
  const locked = item.locked;

  return (
    <PressableSpring
      style={styles.tileWrap}
      scaleTo={0.94}
      haptic={!locked}
      disabled={locked}
      onPress={onPress}
    >
      <View style={[styles.tile, locked && styles.tileLocked]}>
        {item.aiBadge ? (
          <View style={styles.aiBadge}>
            <CoachText variant="caption" accent style={styles.aiBadgeText}>
              IA
            </CoachText>
          </View>
        ) : null}

        <View style={styles.iconCircle}>
          <Icon
            name={item.icon}
            size={22}
            color={locked ? tokens.muted : tokens.accent}
            variant="filled"
          />
        </View>

        <CoachText
          variant="caption"
          muted={locked}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          style={styles.label}
        >
          {item.label}
        </CoachText>

        {locked ? (
          <View style={styles.lockOverlay} pointerEvents="none">
            <View style={styles.lockBadge}>
              <Icon name="lock" size={14} color={tokens.muted} />
            </View>
          </View>
        ) : null}
      </View>
    </PressableSpring>
  );
}

/** Grille outils — 2 col mobile, 3–4 col desktop. */
export function CoachMenuToolGrid({ groups, resolvedById, onSelect }: Props) {
  const shellNav = useCoachShellNav();
  const { t } = useTranslation();
  const { tokens } = useCoachTheme();
  const { width } = useWindowDimensions();
  const cols = coachChrome.menuToolCols(width);
  const styles = useMemo(() => createStyles(tokens, cols), [tokens, cols]);

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

        return (
          <View key={group.id} style={styles.section}>
            <CoachText variant="caption" accent style={styles.sectionLabel}>
              {t(SECTION_I18N[group.id])}
            </CoachText>
            <View style={styles.grid}>
              {items.map((item) => (
                <View key={item.id} style={styles.cell}>
                  <CoachMenuToolTile item={item} onPress={() => handleSelect(item)} />
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function createStyles(_tokens: CoachThemeTokens, cols: 2 | 3 | 4) {
  const gap = spacing.sm;
  const cellPct = `${Math.floor(100 / cols) - 1}%` as `${number}%`;
  return StyleSheet.create({
    root: { gap: spacing.lg, paddingBottom: spacing.xl },
    section: { gap: spacing.sm },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap,
    },
    cell: {
      width: cellPct,
      flexGrow: 1,
      minWidth: cols >= 3 ? 140 : '46%',
      maxWidth: cols >= 3 ? undefined : '48%',
    },
  });
}

function createTileStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    tileWrap: { flex: 1 },
    tile: {
      minHeight: 88,
      borderRadius: 16,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      gap: spacing.xs,
      overflow: 'hidden',
    },
    tileLocked: { opacity: 0.55 },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.soft,
    },
    label: {
      fontWeight: '700',
      textAlign: 'center',
      paddingHorizontal: spacing.xs,
    },
    aiBadge: {
      position: 'absolute',
      top: spacing.xs,
      right: spacing.xs,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 999,
      backgroundColor: tokens.soft,
      zIndex: 1,
    },
    aiBadgeText: { fontSize: 10, fontWeight: '800' },
    lockOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.08)',
    },
    lockBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.surface,
    },
  });
}
