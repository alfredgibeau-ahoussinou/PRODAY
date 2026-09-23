import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import type { User } from '../../models/User';
import { ProDayText } from '../ui/ProDayText';
import { Icon, type IconName } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';
import { spacing, radius } from '../../theme/designTokens';

export type ProfileBlockId =
  | 'identity'
  | 'stats'
  | 'videos'
  | 'season'
  | 'availability'
  | 'bio';

export interface ProfileBlockConfig {
  id: ProfileBlockId;
  label: string;
  icon: IconName;
  visible: boolean;
}

const DEFAULT_BLOCKS: ProfileBlockConfig[] = [
  { id: 'identity', label: 'Identité & galerie', icon: 'person', visible: true },
  { id: 'stats', label: 'Stats saison', icon: 'trophy', visible: true },
  { id: 'bio', label: 'Bio', icon: 'document', visible: true },
  { id: 'availability', label: 'Disponibilité', icon: 'calendar', visible: true },
  { id: 'videos', label: 'Highlights', icon: 'videocam', visible: true },
  { id: 'season', label: 'Saison & niveau', icon: 'football', visible: true },
];

type PlayerProfileBlocksProps = {
  player: User;
  renderBlock: (id: ProfileBlockId) => React.ReactNode;
  editable?: boolean;
};

/** Profil modulaire type Notion — blocs réordonnables. */
export const PlayerProfileBlocks: React.FC<PlayerProfileBlocksProps> = ({
  player,
  renderBlock,
  editable = false,
}) => {
  const { colors } = useAppTheme();
  const playerColors = usePlayerThemeColors();
  const [blocks, setBlocks] = useState<ProfileBlockConfig[]>(DEFAULT_BLOCKS);
  const [collapsed, setCollapsed] = useState<Set<ProfileBlockId>>(new Set());

  const visibleBlocks = useMemo(
    () => blocks.filter((b) => b.visible),
    [blocks]
  );

  const toggleCollapse = (id: ProfileBlockId) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const moveBlock = (id: ProfileBlockId, dir: -1 | 1) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item);
      return next;
    });
  };

  return (
    <View style={styles.root}>
      {visibleBlocks.map((block) => {
        const isCollapsed = collapsed.has(block.id);
        return (
          <View
            key={block.id}
            style={[styles.block, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Pressable style={styles.blockHeader} onPress={() => toggleCollapse(block.id)}>
              <View style={[styles.blockIcon, { backgroundColor: playerColors.accentSoft }]}>
                <Icon name={block.icon} size={16} color={playerColors.accent} />
              </View>
              <ProDayText variant="section" style={styles.blockTitle}>
                {block.label}
              </ProDayText>
              {editable ? (
                <View style={styles.blockActions}>
                  <Pressable onPress={() => moveBlock(block.id, -1)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Remonter la section">
                    <Icon name="chevron-up" size={16} color={colors.textMuted} />
                  </Pressable>
                  <Pressable onPress={() => moveBlock(block.id, 1)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Descendre la section">
                    <Icon name="chevron-down" size={16} color={colors.textMuted} />
                  </Pressable>
                </View>
              ) : null}
              <Icon
                name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                size={16}
                color={colors.textMuted}
              />
            </Pressable>
            {!isCollapsed ? <View style={styles.blockBody}>{renderBlock(block.id)}</View> : null}
          </View>
        );
      })}
      {player.profile.bio ? null : (
        <ProDayText variant="caption" muted style={styles.hint}>
          Complétez chaque bloc pour maximiser votre visibilité Mercato.
        </ProDayText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  block: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  blockIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockTitle: { flex: 1, fontSize: 15 },
  blockActions: { flexDirection: 'row', gap: spacing.xs },
  blockBody: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  hint: { textAlign: 'center', marginTop: spacing.xs },
});
