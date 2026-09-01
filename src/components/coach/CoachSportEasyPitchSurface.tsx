import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Line,
  Path,
  Polygon,
  Rect,
} from 'react-native-svg';
import { PressableSpring } from '../motion/PressableSpring';
import { Icon } from '../ui/Icon';

import { CoachText } from './coachPortalUi';
import {
  useCoachTheme,
  useCoachThemedStyles,
} from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { radius, spacing } from '../../theme/designTokens';
import { fillPitchSlots } from '../../utils/formationPitch';
import {
  TACTICAL_DIRECTIVES,
  type TacticalAnimationDirective,
  type TacticalDirectiveConfig,
} from '../../utils/coachTacticalDirectives';

export {
  TACTICAL_DIRECTIVES,
  type TacticalAnimationDirective,
  type TacticalDirectiveConfig,
};

const GRASS_A = '#43B05A';
const GRASS_B = '#348C42';
const MARK = 'rgba(255,255,255,0.92)';
const TOKEN = 34;
const TOKEN_LABEL = 15;
const STRIPE_COUNT = 12;

export type CoachEasyPitchCell = {
  uid: string | null;
  jerseyNumber?: number | null;
  shortName?: string;
};

export type CoachEasyPitchBenchPlayer = {
  uid: string;
  jerseyNumber: number;
  shortName: string;
};

export type CoachSportEasyPitchSurfaceProps = {
  formation: string;
  cells: (CoachEasyPitchCell | null)[];
  readOnly?: boolean;
  selectedSlotIndex?: number | null;
  selectedUid?: string | null;
  pendingUid?: string | null;
  highlightLineIndex?: number | null;
  onSlotPress?: (slotIndex: number) => void;
  onSlotLongPress?: (slotIndex: number) => void;
  bench?: CoachEasyPitchBenchPlayer[];
  onBenchPress?: (uid: string) => void;
  pendingBenchUid?: string | null;
  formations?: readonly string[];
  onFormationChange?: (formation: string) => void;
  directive?: TacticalAnimationDirective;
  onDirectiveChange?: (directive: TacticalAnimationDirective) => void;
  showDirectivesSelector?: boolean;
  variant?: 'card' | 'embedded';
  showHeader?: boolean;
  showBench?: boolean;
  pitchWidth?: number;
  headerTitle?: string;
};

function isFilled(cell: CoachEasyPitchCell | null | undefined): boolean {
  return Boolean(cell?.uid);
}

export function TacticalAnimationOverlay({
  directive,
}: {
  directive?: TacticalAnimationDirective;
}) {
  if (!directive || directive === 'none') return null;

  if (directive === 'pressing') {
    return (
      <G opacity={0.94}>
        {/* Zone de déclenchement pressing */}
        <Circle
          cx={34}
          cy={20}
          r={9}
          fill="rgba(245, 158, 11, 0.16)"
          stroke="#F59E0B"
          strokeWidth={0.5}
          strokeDasharray="2,2"
        />
        {/* Attaquant gauche pressant le défenseur central adverse */}
        <Path
          d="M 18 29 C 23 21, 26 16, 31 11"
          fill="none"
          stroke="#F59E0B"
          strokeWidth={1.1}
          strokeDasharray="2.5,1.5"
        />
        <Polygon points="31,11 26.5,13 29,15.5" fill="#F59E0B" />

        {/* Attaquant droit pressant le défenseur central adverse */}
        <Path
          d="M 50 29 C 45 21, 42 16, 37 11"
          fill="none"
          stroke="#F59E0B"
          strokeWidth={1.1}
          strokeDasharray="2.5,1.5"
        />
        <Polygon points="37,11 39,15.5 41.5,13" fill="#F59E0B" />

        {/* Attaquant de pointe pressant la relance */}
        <Path
          d="M 34 23 L 34 8"
          fill="none"
          stroke="#F59E0B"
          strokeWidth={1.3}
        />
        <Polygon points="34,6.5 31.5,10.5 36.5,10.5" fill="#F59E0B" />

        {/* Milieu gauche montant au cadrage */}
        <Path
          d="M 22 52 L 22 37"
          fill="none"
          stroke="#F59E0B"
          strokeWidth={0.9}
          strokeDasharray="2,1"
        />
        <Polygon points="22,35.5 20,39 24,39" fill="#F59E0B" />

        {/* Milieu droit montant au cadrage */}
        <Path
          d="M 46 52 L 46 37"
          fill="none"
          stroke="#F59E0B"
          strokeWidth={0.9}
          strokeDasharray="2,1"
        />
        <Polygon points="46,35.5 44,39 48,39" fill="#F59E0B" />
      </G>
    );
  }

  if (directive === 'bloc') {
    return (
      <G opacity={0.94}>
        {/* Zone de compression bloc compact */}
        <Rect
          x={8}
          y={50}
          width={52}
          height={28}
          rx={2.5}
          fill="rgba(56, 189, 248, 0.16)"
          stroke="#38BDF8"
          strokeWidth={0.7}
          strokeDasharray="2.5,2"
        />
        {/* Latéral gauche resserre vers l'axe */}
        <Path
          d="M 12 73 L 23 73"
          fill="none"
          stroke="#38BDF8"
          strokeWidth={1.1}
        />
        <Polygon points="24.5,73 21,71 21,75" fill="#38BDF8" />

        {/* Latéral droit resserre vers l'axe */}
        <Path
          d="M 56 73 L 45 73"
          fill="none"
          stroke="#38BDF8"
          strokeWidth={1.1}
        />
        <Polygon points="43.5,73 47,71 47,75" fill="#38BDF8" />

        {/* Milieu central resserre le bloc médian */}
        <Path
          d="M 34 42 L 34 54"
          fill="none"
          stroke="#38BDF8"
          strokeWidth={1.1}
          strokeDasharray="2,1"
        />
        <Polygon points="34,55.5 31.5,52 36.5,52" fill="#38BDF8" />

        {/* Repli ailier gauche */}
        <Path
          d="M 14 30 L 17 48"
          fill="none"
          stroke="#38BDF8"
          strokeWidth={0.85}
          strokeDasharray="2,1"
        />
        <Polygon points="17.5,49.5 15.5,46 19,46.5" fill="#38BDF8" />

        {/* Repli ailier droit */}
        <Path
          d="M 54 30 L 51 48"
          fill="none"
          stroke="#38BDF8"
          strokeWidth={0.85}
          strokeDasharray="2,1"
        />
        <Polygon points="50.5,49.5 49,46.5 52.5,46" fill="#38BDF8" />
      </G>
    );
  }

  if (directive === 'projection') {
    return (
      <G opacity={0.94}>
        {/* Dédoublement latéral gauche */}
        <Path
          d="M 9 68 C 5 52, 5 36, 12 18"
          fill="none"
          stroke="#10B981"
          strokeWidth={1.2}
        />
        <Polygon points="12.5,16.5 9.5,20 14,21" fill="#10B981" />

        {/* Dédoublement latéral droit */}
        <Path
          d="M 59 68 C 63 52, 63 36, 56 18"
          fill="none"
          stroke="#10B981"
          strokeWidth={1.2}
        />
        <Polygon points="55.5,16.5 54,21 58.5,20" fill="#10B981" />

        {/* Course vers l'intérieur ailier gauche */}
        <Path
          d="M 15 28 C 22 22, 26 18, 31 14"
          fill="none"
          stroke="#10B981"
          strokeWidth={1.0}
          strokeDasharray="2.5,1.5"
        />
        <Polygon points="32.5,12.5 28.5,14.5 30.5,17" fill="#10B981" />

        {/* Course vers l'intérieur ailier droit */}
        <Path
          d="M 53 28 C 46 22, 42 18, 37 14"
          fill="none"
          stroke="#10B981"
          strokeWidth={1.0}
          strokeDasharray="2.5,1.5"
        />
        <Polygon points="35.5,12.5 37.5,17 39.5,14.5" fill="#10B981" />

        {/* Projection milieu axial */}
        <Path
          d="M 34 50 L 34 26"
          fill="none"
          stroke="#10B981"
          strokeWidth={1.2}
          strokeDasharray="3,1.5"
        />
        <Polygon points="34,24.5 31.5,28.5 36.5,28.5" fill="#10B981" />

        {/* Attaquant de pointe vers la surface */}
        <Path
          d="M 34 18 L 34 6"
          fill="none"
          stroke="#10B981"
          strokeWidth={1.3}
        />
        <Polygon points="34,4.5 31.5,8.5 36.5,8.5" fill="#10B981" />
      </G>
    );
  }

  return null;
}

export function SportEasyPitchMarkings({
  directive,
}: {
  directive?: TacticalAnimationDirective;
} = {}) {
  const stripes = Array.from({ length: STRIPE_COUNT }, (_, i) => {
    const h = 105 / STRIPE_COUNT;
    return (
      <Rect
        key={`stripe_${i}`}
        x={0}
        y={i * h}
        width={68}
        height={h + 0.05}
        fill={i % 2 === 0 ? GRASS_A : GRASS_B}
      />
    );
  });

  return (
    <Svg width="100%" height="100%" viewBox="-2 -2 72 109" preserveAspectRatio="none">
      <Defs>
        <ClipPath id="coachEasyPitchClip">
          <Rect x={0} y={0} width={68} height={105} rx={0.6} />
        </ClipPath>
        <ClipPath id="coachEasyTopD">
          <Rect x={12} y={16.5} width={44} height={36} />
        </ClipPath>
        <ClipPath id="coachEasyBottomD">
          <Rect x={12} y={52} width={44} height={36.5} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#coachEasyPitchClip)">
        {stripes}
        <Rect
          x={0.35}
          y={0.35}
          width={67.3}
          height={104.3}
          fill="none"
          stroke={MARK}
          strokeWidth={0.45}
        />
        <Line x1={0.35} y1={52.5} x2={67.65} y2={52.5} stroke={MARK} strokeWidth={0.4} />
        <Circle cx={34} cy={52.5} r={9.15} fill="none" stroke={MARK} strokeWidth={0.4} />
        <Circle cx={34} cy={52.5} r={0.38} fill={MARK} />

        <Rect x={13.84} y={0.35} width={40.32} height={16.15} fill="none" stroke={MARK} strokeWidth={0.4} />
        <Rect x={24.84} y={0.35} width={18.32} height={5.15} fill="none" stroke={MARK} strokeWidth={0.4} />
        <Circle cx={34} cy={11} r={0.38} fill={MARK} />
        <Circle
          cx={34}
          cy={11}
          r={9.15}
          fill="none"
          stroke={MARK}
          strokeWidth={0.4}
          clipPath="url(#coachEasyTopD)"
        />

        <Rect x={13.84} y={88.5} width={40.32} height={16.15} fill="none" stroke={MARK} strokeWidth={0.4} />
        <Rect x={24.84} y={99.5} width={18.32} height={5.15} fill="none" stroke={MARK} strokeWidth={0.4} />
        <Circle cx={34} cy={94} r={0.38} fill={MARK} />
        <Circle
          cx={34}
          cy={94}
          r={9.15}
          fill="none"
          stroke={MARK}
          strokeWidth={0.4}
          clipPath="url(#coachEasyBottomD)"
        />

        <Circle cx={0} cy={0} r={1} fill="none" stroke={MARK} strokeWidth={0.4} />
        <Circle cx={68} cy={0} r={1} fill="none" stroke={MARK} strokeWidth={0.4} />
        <Circle cx={0} cy={105} r={1} fill="none" stroke={MARK} strokeWidth={0.4} />
        <Circle cx={68} cy={105} r={1} fill="none" stroke={MARK} strokeWidth={0.4} />

        {/* Flèches tactiques & zones d'animation */}
        <TacticalAnimationOverlay directive={directive} />
      </G>
    </Svg>
  );
}

function CoachEasyPitchToken({
  cell,
  selected,
  emptyActive,
  lineActive,
  readOnly,
  onPress,
  onLongPress,
  left,
  top,
  styles,
}: {
  cell: CoachEasyPitchCell | null;
  selected: boolean;
  emptyActive: boolean;
  lineActive: boolean;
  readOnly: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  left: number;
  top: number;
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
      style={[styles.tokenWrap, { left, top }]}
    >
      <View
        style={[
          styles.token,
          filled ? styles.tokenFilled : styles.tokenEmpty,
          (selected || emptyActive || lineActive) && styles.tokenSelected,
        ]}
      >
        {filled ? (
          <CoachText
            variant="caption"
            style={[
              styles.tokenNum,
              selected || emptyActive || lineActive
                ? styles.tokenNumLight
                : styles.tokenNumDark,
            ]}
          >
            {label}
          </CoachText>
        ) : (
          <Icon
            name="add"
            size={14}
            color={emptyActive || selected ? '#FFFFFF' : 'rgba(255,255,255,0.92)'}
          />
        )}
      </View>
      <CoachText variant="caption" inverse numberOfLines={1} style={styles.tokenName}>
        {filled ? cell?.shortName ?? ' ' : ' '}
      </CoachText>
    </PressableSpring>
  );
}

export function CoachSportEasyPitchSurface({
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
  directive: directiveProp,
  onDirectiveChange,
  showDirectivesSelector = true,
  variant = 'card',
  showHeader = true,
  showBench = true,
  pitchWidth: pitchWidthProp,
  headerTitle,
}: CoachSportEasyPitchSurfaceProps) {
  const { width: winW } = useWindowDimensions();
  const { tokens: themeTokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);
  const [internalDirective, setInternalDirective] = useState<TacticalAnimationDirective>('none');

  const activeDirective = directiveProp !== undefined ? directiveProp : internalDirective;
  const setDirective = onDirectiveChange ?? setInternalDirective;

  const pitchW = pitchWidthProp ?? Math.min(winW - spacing.md * 4, 360);
  const pitchH = Math.round(pitchW * (105 / 68));

  const pitchSlots = useMemo(
    () => fillPitchSlots(cells, formation),
    [cells, formation],
  );

  const activeDirectiveInfo =
    activeDirective !== 'none' ? TACTICAL_DIRECTIVES[activeDirective] : null;

  const pitchScene = (
    <View style={variant === 'card' ? styles.pitchFrame : styles.embeddedFrame}>
      {showHeader ? (
        <View style={styles.pitchHead}>
          <CoachText variant="caption" muted style={styles.headerKicker}>
            {headerTitle ?? (readOnly ? 'Composition publiée' : 'Composition')} · {formation}
            {activeDirectiveInfo ? ` · ${activeDirectiveInfo.badge}` : ''}
          </CoachText>
        </View>
      ) : null}
      <View style={[styles.pitch, { width: pitchW, height: pitchH }]}>
        <SportEasyPitchMarkings directive={activeDirective} />
        {pitchSlots.map((cell) => {
          const slotCell = cell.player;
          const filled = isFilled(slotCell);
          const selected =
            selectedSlotIndex === cell.slotIndex ||
            Boolean(slotCell?.uid && selectedUid === slotCell.uid);
          const lineActive =
            !readOnly &&
            highlightLineIndex != null &&
            cell.lineIndex === highlightLineIndex &&
            !filled;
          const emptyActive =
            !readOnly &&
            !filled &&
            (selectedSlotIndex === cell.slotIndex || lineActive);
          const left = cell.x * pitchW - TOKEN / 2;
          const top = cell.y * pitchH - TOKEN / 2;

          return (
            <CoachEasyPitchToken
              key={`slot_${cell.slotIndex}`}
              cell={slotCell}
              selected={selected}
              emptyActive={emptyActive}
              lineActive={lineActive}
              readOnly={readOnly}
              left={left}
              top={top}
              styles={styles}
              onPress={() => onSlotPress?.(cell.slotIndex)}
              onLongPress={
                !readOnly && filled ? () => onSlotLongPress?.(cell.slotIndex) : undefined
              }
            />
          );
        })}
      </View>
    </View>
  );

  const directivesSection = showDirectivesSelector ? (
    <View style={styles.directiveBlock}>
      <View style={styles.directiveHeader}>
        <CoachText variant="caption" style={styles.directiveTitle}>
          Animation & Flèches tactiques
        </CoachText>
        {activeDirective !== 'none' ? (
          <PressableSpring onPress={() => setDirective('none')} scaleTo={0.96} haptic>
            <CoachText variant="caption" muted style={styles.resetDirectiveLink}>
              Masquer flèches
            </CoachText>
          </PressableSpring>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.directiveChipsRow}
      >
        {(
          [
            { id: 'pressing' as const, label: '⚡ Pressing' },
            { id: 'bloc' as const, label: '🛡️ Bloc' },
            { id: 'projection' as const, label: '🚀 Projection' },
          ] as const
        ).map((d) => {
          const on = activeDirective === d.id;
          return (
            <PressableSpring
              key={d.id}
              onPress={() => setDirective(on ? 'none' : d.id)}
              scaleTo={0.97}
              haptic
              style={[
                styles.directiveChip,
                on && {
                  borderColor: TACTICAL_DIRECTIVES[d.id].color,
                  backgroundColor: themeTokens.isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.12)',
                },
              ]}
            >
              <CoachText
                variant="caption"
                style={[
                  styles.directiveChipText,
                  on && { color: TACTICAL_DIRECTIVES[d.id].color, fontWeight: '800' },
                ]}
              >
                {d.label}
              </CoachText>
            </PressableSpring>
          );
        })}
      </ScrollView>

      {activeDirectiveInfo ? (
        <View
          style={[
            styles.directiveCard,
            { borderLeftColor: activeDirectiveInfo.color },
          ]}
        >
          <CoachText
            variant="caption"
            style={[styles.directiveCardTitle, { color: activeDirectiveInfo.color }]}
          >
            {activeDirectiveInfo.badge} — {activeDirectiveInfo.summary}
          </CoachText>
          <CoachText variant="caption" muted style={styles.directiveCardDetail}>
            {activeDirectiveInfo.detail}
          </CoachText>
        </View>
      ) : null}
    </View>
  ) : null;

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
            const on = pendingBenchUid === player.uid || pendingUid === player.uid;
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
        {directivesSection}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {formationChips}
      {pitchScene}
      {directivesSection}
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
      gap: spacing.xs,
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
    pitchHead: {
      alignSelf: 'stretch',
      paddingHorizontal: spacing.xs,
    },
    headerKicker: {
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      fontSize: 10,
    },
    pitch: {
      borderRadius: 10,
      overflow: 'hidden',
    },
    tokenWrap: {
      position: 'absolute',
      width: TOKEN,
      alignItems: 'center',
    },
    token: {
      width: TOKEN,
      height: TOKEN,
      borderRadius: TOKEN / 2,
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
    directiveBlock: {
      marginTop: spacing.xs,
      gap: 6,
    },
    directiveHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    directiveTitle: {
      fontWeight: '700',
      color: tokens.foreground,
    },
    resetDirectiveLink: {
      fontSize: 11,
      textDecorationLine: 'underline',
    },
    directiveChipsRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      paddingVertical: 2,
    },
    directiveChip: {
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.elevated,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
    },
    directiveChipText: {
      fontWeight: '600',
      fontSize: 12,
    },
    directiveCard: {
      borderLeftWidth: 3,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      backgroundColor: tokens.elevated,
      borderRadius: 6,
      gap: 2,
    },
    directiveCardTitle: {
      fontWeight: '800',
      fontSize: 12,
    },
    directiveCardDetail: {
      fontSize: 11,
      lineHeight: 15,
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
