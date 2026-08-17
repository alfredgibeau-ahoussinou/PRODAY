import React, { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import { COACH_COLOR_GRID } from '../../utils/coachColorPicker';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { spacing } from '../../theme/designTokens';

const NUM_COLUMNS = 8;
const SWATCH_SIZE = 30;
const SWATCH_GAP = 6;
const ROW_HEIGHT = SWATCH_SIZE + SWATCH_GAP;
const BOARD_HEIGHT = 280;

type ColorRow = { key: string; colors: string[] };

const COLOR_ROWS: ColorRow[] = (() => {
  const rows: ColorRow[] = [];
  for (let i = 0; i < COACH_COLOR_GRID.length; i += NUM_COLUMNS) {
    const slice = COACH_COLOR_GRID.slice(i, i + NUM_COLUMNS);
    rows.push({ key: `row-${i}`, colors: slice });
  }
  return rows;
})();

export function CoachAccentColorBoard({
  selectedColor,
  onSelect,
  boardHeight = BOARD_HEIGHT,
}: {
  selectedColor: string;
  onSelect: (color: string) => void;
  boardHeight?: number;
}) {
  const { tokens } = useCoachTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const normalizedSelected = selectedColor.toUpperCase();

  const renderRow = useCallback(
    ({ item }: { item: ColorRow }) => (
      <View style={styles.row}>
        {item.colors.map((color) => {
          const isSelected = color === normalizedSelected;
          return (
            <PressableSpring
              key={color}
              onPress={() => onSelect(color)}
              scaleTo={0.92}
              haptic
              style={[styles.swatchWrap, isSelected && styles.swatchWrapSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={color}
            >
              <View style={[styles.swatch, { backgroundColor: color }]} />
            </PressableSpring>
          );
        })}
      </View>
    ),
    [normalizedSelected, onSelect, styles],
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: ROW_HEIGHT,
      offset: ROW_HEIGHT * index,
      index,
    }),
    [],
  );

  return (
    <View style={styles.board}>
      <View style={styles.previewPill}>
        <View style={[styles.previewDot, { backgroundColor: normalizedSelected }]} />
        <ProDayText variant="caption" style={styles.previewHex}>
          {normalizedSelected}
        </ProDayText>
      </View>
      <FlatList
        data={COLOR_ROWS}
        keyExtractor={(item) => item.key}
        renderItem={renderRow}
        getItemLayout={getItemLayout}
        initialNumToRender={12}
        maxToRenderPerBatch={16}
        windowSize={7}
        removeClippedSubviews
        style={[styles.list, { height: boardHeight }]}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator
      />
    </View>
  );
}

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    board: {
      gap: spacing.sm,
    },
    previewPill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: spacing.sm,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs,
      borderRadius: 999,
      backgroundColor: tokens.elevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    previewDot: {
      width: 18,
      height: 18,
      borderRadius: 9,
    },
    previewHex: {
      color: tokens.foreground,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
    list: {
      height: BOARD_HEIGHT,
    },
    grid: {
      gap: SWATCH_GAP,
      paddingBottom: spacing.xs,
    },
    row: {
      flexDirection: 'row',
      gap: SWATCH_GAP,
    },
    swatchWrap: {
      width: SWATCH_SIZE,
      height: SWATCH_SIZE,
      borderRadius: SWATCH_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    swatchWrapSelected: {
      borderColor: tokens.foreground,
    },
    swatch: {
      width: SWATCH_SIZE - 8,
      height: SWATCH_SIZE - 8,
      borderRadius: (SWATCH_SIZE - 8) / 2,
    },
  });
}
