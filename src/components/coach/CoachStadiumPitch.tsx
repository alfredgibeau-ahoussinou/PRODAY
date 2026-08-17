import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { PitchFrame, projectPitch } from '../smartTactics/PerspectivePitch';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { CoachText } from './coachPortalUi';
import {
  useCoachTheme,
  useCoachThemedStyles,
} from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { radius, spacing } from '../../theme/designTokens';
import {
  cellsByFormationLine,
  perspectiveHighlightBand,
  perspectiveLineNy,
  type CoachStadiumBenchPlayer,
  type CoachStadiumCell,
} from '../../utils/coachStadiumPitchLayout';
import { parseFormationLines } from '../../utils/formationPitch';

const TOKEN = 34;
const TOKEN_LABEL = 15;

export type { CoachStadiumCell, CoachStadiumBenchPlayer };

export type CoachStadiumPitchProps = {
  formation: string;
  cells: (CoachStadiumCell | null)[];
  readOnly?: boolean;
  selectedSlotIndex?: number | null;
  selectedUid?: string | null;
  pendingUid?: string | null;
  highlightLineIndex?: number | null;
  onSlotPress?: (slotIndex: number) => void;
  onSlotLongPress?: (slotIndex: number) => void;
  bench?: CoachStadiumBenchPlayer[];
  onBenchPress?: (uid: string) => void;
  pendingBenchUid?: string | null;
  formations?: readonly string[];
  onFormationChange?: (formation: string) => void;
  /** Carte coach complète ou terrain seul (Smart Tactics). */
  variant?: 'card' | 'embedded';
  showHeader?: boolean;
  showBench?: boolean;
  pitchWidth?: number;
  headerTitle?: string;
};

function isFilled(cell: CoachStadiumCell | null | undefined): boolean {
  return Boolean(cell?.uid);
}

function CoachPitchToken({
  cell,
  selected,
  emptyActive,
  readOnly,
  onPress,
  onLongPress,
  size,
  styles,
}: {
  cell: CoachStadiumCell | null;
  selected: boolean;
  emptyActive: boolean;
  readOnly: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  size: number;
  styles: ReturnType<typeof createStyles>;
}) {
  const filled = isFilled(cell);
  const label =
    filled && cell?.jerseyNumber != null && cell.jerseyNumber > 0
      ? String(cell.jerseyNumber)
      : filled
        ? cell?.shortName?.slice(0, 1).toUpperCase() ?? '?'
        : null;

  return (
    <PressableSpring
      onPress={onPress}
      onLongPress={onLongPress}
      scaleTo={0.94}
      haptic={!readOnly}
      style={[styles.tokenWrap, { width: size }]}
    >
      <View
        style={[
          styles.token,
          { width: size, height: size, borderRadius: size / 2 },
          filled ? styles.tokenFilled : styles.tokenEmpty,
          (selected || emptyActive) && styles.tokenSelected,
        ]}
      >
        {filled ? (
          <CoachText
            variant="caption"
            style={[
              styles.tokenNum,
              selected || emptyActive ? styles.tokenNumLight : styles.tokenNumDark,
            ]}
          >
            {label}
          </CoachText>
        ) : (
          <Icon
            name="add"
            size={Math.round(size * 0.38)}
            color={emptyActive ? '#FFFFFF' : 'rgba(255,255,255,0.92)'}
          />
        )}
      </View>
      <CoachText variant="caption" inverse numberOfLines={1} style={styles.tokenName}>
        {filled ? cell?.shortName ?? ' ' : ' '}
      </CoachText>
    </PressableSpring>
  );
}

export function CoachStadiumPitch({
  formation,
  cells,
  readOnly = false,
  selectedSlotIndex = null,
  selectedUid = null,
  pendingUid = null,
  highlightLineIndex = null,
  onSlotPress,
  onSlotLongPress,
  bench = [],
  onBenchPress,
  pendingBenchUid = null,
  formations,
  onFormationChange,
  variant = 'card',
  showHeader = true,
  showBench = true,
  pitchWidth: pitchWidthProp,
  headerTitle,
}: CoachStadiumPitchProps) {
  const { width: winW } = useWindowDimensions();
  const { tokens: themeTokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);

  const pitchW = pitchWidthProp ?? Math.min(winW - spacing.md * 4, 360);
  const pitchH = Math.round(pitchW * 1.32);
  const maxInLine = Math.max(1, ...parseFormationLines(formation));
  const tokenSize = Math.max(34, Math.min(52, Math.floor((pitchW * 0.86) / maxInLine) - 6));

  const pitchRows = useMemo(
    () => [...cellsByFormationLine(cells, formation)].reverse(),
    [cells, formation],
  );
  const lineCount = Math.max(1, pitchRows.length);
  const activeVisual =
    highlightLineIndex == null
      ? -1
      : pitchRows.findIndex((r) => r.lineIndex === highlightLineIndex);
  const activeNy =
    activeVisual < 0
      ? undefined
      : perspectiveLineNy(activeVisual, lineCount);
  const bandH = perspectiveHighlightBand(lineCount);

  const pitchScene = (
    <View style={variant === 'card' ? styles.pitchFrame : styles.embeddedFrame}>
      {showHeader ? (
        <View style={styles.stadiumHead}>
          <CoachText variant="caption" muted style={styles.headerKicker}>
            {headerTitle ?? (readOnly ? 'Composition publiée' : 'Composition')} · {formation}
          </CoachText>
        </View>
      ) : null}

      <View style={styles.scene}>
        <PitchFrame
          width={pitchW}
          height={pitchH}
          highlightNy0={
            activeNy == null ? undefined : Math.max(0.02, activeNy - bandH / 2)
          }
          highlightNy1={
            activeNy == null ? undefined : Math.min(0.98, activeNy + bandH / 2)
          }
        >
          <View style={styles.ends} pointerEvents="none">
            <CoachText variant="caption" style={styles.endBadge}>
              ATT
            </CoachText>
            <CoachText variant="caption" style={styles.endBadge}>
              GB
            </CoachText>
          </View>

          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {pitchRows.map((row, visualIndex) => {
              const ny = perspectiveLineNy(visualIndex, lineCount);
              const n = Math.max(1, row.slots.length);
              const lineActive = row.lineIndex === highlightLineIndex;

              return row.slots.map((cell, i) => {
                const absoluteIndex = row.startIdx + i;
                const nx = n === 1 ? 0.5 : 0.14 + (i / (n - 1)) * 0.72;
                const pos = projectPitch(nx, ny, pitchW, pitchH);
                const box = tokenSize + 28;
                const filled = isFilled(cell);
                const selected =
                  selectedSlotIndex === absoluteIndex ||
                  Boolean(cell?.uid && selectedUid === cell.uid);
                const emptyActive =
                  !readOnly &&
                  !filled &&
                  (selectedSlotIndex === absoluteIndex || (lineActive && !filled));

                return (
                  <View
                    key={`slot_${absoluteIndex}`}
                    style={{
                      position: 'absolute',
                      left: pos.x - box / 2,
                      top: pos.y - box * 0.55,
                      width: box,
                      height: box + 22,
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      transform: [{ scale: pos.scale }],
                      zIndex: Math.round(10 + pos.scale * 20) + (lineActive ? 5 : 0),
                    }}
                  >
                    <CoachPitchToken
                      cell={cell}
                      selected={selected}
                      emptyActive={emptyActive}
                      readOnly={readOnly}
                      size={tokenSize}
                      styles={styles}
                      onPress={() => onSlotPress?.(absoluteIndex)}
                      onLongPress={
                        !readOnly && filled
                          ? () => onSlotLongPress?.(absoluteIndex)
                          : undefined
                      }
                    />
                  </View>
                );
              });
            })}
          </View>
        </PitchFrame>
      </View>
    </View>
  );

  const benchSection =
    showBench && bench.length > 0 ? (
      <>
        <CoachText variant="caption" style={styles.benchLabel}>
          Banc
        </CoachText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.benchRow}
        >
          {bench.map((player) => {
            const on = pendingBenchUid === player.uid;
            return (
              <PressableSpring
                key={`bench_${player.uid}`}
                onPress={() => onBenchPress?.(player.uid)}
                scaleTo={0.96}
                haptic={!readOnly}
                style={styles.benchItem}
              >
                <View style={[styles.benchToken, on && styles.tokenSelected]}>
                  <CoachText
                    variant="caption"
                    style={[styles.tokenNum, on ? styles.tokenNumLight : styles.tokenNumDark]}
                  >
                    {player.jerseyNumber}
                  </CoachText>
                </View>
                <CoachText variant="caption" numberOfLines={1} style={styles.benchName}>
                  {player.shortName}
                </CoachText>
              </PressableSpring>
            );
          })}
        </ScrollView>
      </>
    ) : showBench && bench.length === 0 && variant === 'card' ? (
      <>
        <CoachText variant="caption" style={styles.benchLabel}>
          Banc
        </CoachText>
        <CoachText variant="caption" muted>
          Tout l&apos;effectif est sur le terrain.
        </CoachText>
      </>
    ) : null;

  const formationChips =
    formations && onFormationChange ? (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {formations.map((f) => {
          const on = formation === f;
          return (
            <PressableSpring
              key={f}
              onPress={() => onFormationChange(f)}
              scaleTo={0.97}
              haptic
              style={[styles.chip, on && styles.chipOn]}
            >
              <CoachText
                variant="caption"
                inverse={on && !themeTokens.isLight}
                muted={!on}
                accent={on && themeTokens.isLight}
                style={styles.chipText}
              >
                {f}
              </CoachText>
            </PressableSpring>
          );
        })}
      </ScrollView>
    ) : null;

  if (variant === 'embedded') {
    return (
      <View style={styles.embeddedRoot}>
        {pitchScene}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {formationChips}
      {pitchScene}
      {benchSection}
    </View>
  );
}

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    root: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
      backgroundColor: tokens.surface,
    },
    embeddedRoot: {
      alignItems: 'center',
    },
    chipRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      paddingVertical: 2,
    },
    chip: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      backgroundColor: tokens.elevated,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
    },
    chipOn: tokens.isLight
      ? {
          borderColor: tokens.accent,
          backgroundColor: tokens.soft,
        }
      : {
          borderColor: tokens.accent,
          backgroundColor: tokens.accent,
        },
    chipText: {
      fontWeight: '700',
    },
    pitchFrame: {
      alignItems: 'center',
      backgroundColor: tokens.elevated,
      borderRadius: radius.lg,
      padding: spacing.sm,
      gap: spacing.xs,
    },
    embeddedFrame: {
      alignItems: 'center',
    },
    stadiumHead: {
      alignSelf: 'stretch',
      paddingHorizontal: spacing.xs,
    },
    headerKicker: {
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      fontSize: 10,
    },
    scene: {
      alignItems: 'center',
    },
    ends: {
      position: 'absolute',
      top: '5%',
      bottom: '4%',
      left: 8,
      justifyContent: 'space-between',
      zIndex: 2,
    },
    endBadge: {
      color: '#0B1A12',
      fontWeight: '900',
      fontSize: 10,
      letterSpacing: 1,
      backgroundColor: 'rgba(255,255,255,0.9)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      overflow: 'hidden',
    },
    tokenWrap: {
      alignItems: 'center',
    },
    token: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
    },
    tokenFilled: {
      backgroundColor: '#FFFFFF',
      borderColor: 'rgba(255,255,255,0.95)',
    },
    tokenEmpty: {
      backgroundColor: 'rgba(255,255,255,0.22)',
      borderColor: 'rgba(255,255,255,0.7)',
      borderStyle: 'dashed',
    },
    tokenSelected: {
      borderColor: tokens.accent,
      backgroundColor: tokens.accent,
      borderStyle: 'solid',
    },
    tokenNum: {
      fontSize: 13,
      fontWeight: '800',
      lineHeight: 16,
    },
    tokenNumDark: { color: tokens.foreground },
    tokenNumLight: { color: '#FFFFFF' },
    tokenName: {
      marginTop: 2,
      fontSize: 9,
      fontWeight: '700',
      color: '#FFFFFF',
      textAlign: 'center',
      width: TOKEN + 18,
      textShadowColor: 'rgba(0,0,0,0.45)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
      height: TOKEN_LABEL,
    },
    benchLabel: {
      color: tokens.foreground,
      fontWeight: '700',
      marginTop: spacing.xs,
    },
    benchRow: {
      gap: spacing.sm,
      paddingVertical: 4,
      paddingRight: spacing.sm,
    },
    benchItem: {
      width: 56,
      alignItems: 'center',
      gap: 4,
    },
    benchToken: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.elevated,
      borderWidth: 2,
      borderColor: tokens.border,
    },
    benchName: {
      fontSize: 10,
      fontWeight: '600',
      color: tokens.foreground,
      textAlign: 'center',
      width: 56,
    },
  });
}
