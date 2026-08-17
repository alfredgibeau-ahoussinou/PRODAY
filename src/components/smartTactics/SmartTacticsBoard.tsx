import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import type { SmartPlayerCardData, TacticalBoardSlot } from '../../models/SmartTactics';
import { SMART_TACTICS_PRESET_FORMATIONS } from '../../models/SmartTactics';
import { parseFormationLines } from '../../utils/formationPitch';
import {
  countFormationSlots,
  formationLinePositionGroup,
  isValidFormation,
} from '../../utils/smartTacticsEngine';
import {
  resolveJoueurPositionGroup,
  type JoueurPositionGroup,
} from '../../utils/joueurExperienceTheme';
import { radius, spacing } from '../../theme/designTokens';
import { SMART_PITCH, useSmartTacticsTheme } from './smartTacticsUi';
import { COACH_SITE } from '../../content/coachPageIdentity';
import { Icon } from '../ui/Icon';
import { SmartPlayerCard } from './SmartPlayerCard';
import { PitchFrame, projectPitch } from './PerspectivePitch';

type StageDef = {
  key: string;
  lineIndex: number;
  count: number;
  startIdx: number;
  group: JoueurPositionGroup;
  label: string;
  short: string;
};

const GROUP_LABEL: Record<JoueurPositionGroup, string> = {
  goalkeeper: 'Gardiens',
  defender: 'Défenseurs',
  midfielder: 'Milieux',
  forward: 'Attaquants',
  unknown: 'Effectif',
};

function stageMeta(
  group: JoueurPositionGroup,
  lineIndex: number,
  lineCount: number,
): { label: string; short: string } {
  if (group === 'midfielder' && lineCount > 4) {
    return { label: `Milieux · L${lineIndex}`, short: `M${lineIndex}` };
  }
  switch (group) {
    case 'forward':
      return { label: 'Attaquants', short: 'ATT' };
    case 'midfielder':
      return { label: 'Milieux', short: 'MIL' };
    case 'defender':
      return { label: 'Défenseurs', short: 'DEF' };
    case 'goalkeeper':
      return { label: 'Gardien', short: 'GB' };
    default:
      return { label: 'Postes', short: '—' };
  }
}

function buildStages(formation: string): StageDef[] {
  const lines = parseFormationLines(formation);
  let offset = 0;
  const forward: StageDef[] = [];
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const count = lines[lineIndex];
    const group = formationLinePositionGroup(lineIndex, lines.length);
    const meta = stageMeta(group, lineIndex, lines.length);
    forward.push({
      key: `L${lineIndex}`,
      lineIndex,
      count,
      startIdx: offset,
      group,
      label: meta.label,
      short: meta.short,
    });
    offset += count;
  }
  return [...forward].reverse();
}

const EMPTY_SLOT_PREFIX = '__slot_';

function isPlaceholderSlot(slot: TacticalBoardSlot | null | undefined): boolean {
  if (!slot) return true;
  return slot.uid.startsWith(EMPTY_SLOT_PREFIX) || !slot.display_name.trim();
}

function slotsToCells(starters: TacticalBoardSlot[], formation: string): (TacticalBoardSlot | null)[] {
  const n = countFormationSlots(formation);
  const cells: (TacticalBoardSlot | null)[] = Array.from({ length: n }, () => null);
  for (let i = 0; i < Math.min(starters.length, n); i++) {
    const s = starters[i];
    if (!isPlaceholderSlot(s)) cells[i] = s;
  }
  return cells;
}

function cellsToStarters(cells: (TacticalBoardSlot | null)[]): TacticalBoardSlot[] {
  return cells.map((c, i) =>
    c && !isPlaceholderSlot(c)
      ? { ...c, role: 'starter' as const }
      : {
          uid: `${EMPTY_SLOT_PREFIX}${i}`,
          display_name: '',
          role: 'starter' as const,
        },
  );
}

export function compactBoardStarters(slots: TacticalBoardSlot[]): TacticalBoardSlot[] {
  return slots.filter((s) => !isPlaceholderSlot(s));
}

export function padStartersForBoard(
  starters: TacticalBoardSlot[],
  formation: string,
): TacticalBoardSlot[] {
  const n = countFormationSlots(formation);
  const cells = slotsToCells(starters, formation);
  while (cells.length < n) cells.push(null);
  return cellsToStarters(cells.slice(0, n));
}

function groupMatchesSlot(
  playerPos: string | undefined,
  stageGroup: JoueurPositionGroup,
): boolean {
  const g = resolveJoueurPositionGroup(playerPos);
  return g === stageGroup || g === 'unknown';
}

function shortName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : '—';
}

function readinessTone(pct: number, coach = false): string {
  if (pct >= 75) return SMART_PITCH.ready;
  if (pct >= 50) return coach ? COACH_SITE.accent : SMART_PITCH.warm;
  return SMART_PITCH.risk;
}

function cellsByFormationLine(
  cells: (TacticalBoardSlot | null)[],
  formation: string,
): { lineIndex: number; startIdx: number; slots: (TacticalBoardSlot | null)[] }[] {
  const lines = parseFormationLines(formation);
  let idx = 0;
  return lines.map((count, lineIndex) => {
    const slots = cells.slice(idx, idx + count);
    while (slots.length < count) slots.push(null);
    const startIdx = idx;
    idx += count;
    return { lineIndex, startIdx, slots };
  });
}

/** Jeton upright (pas de rotateX) — photo + OVR + nom. */
function PitchToken({
  slot,
  card,
  selected,
  emptyActive,
  onPress,
  size,
}: {
  slot: TacticalBoardSlot | null;
  card?: SmartPlayerCardData;
  selected: boolean;
  emptyActive: boolean;
  onPress: () => void;
  size: number;
}) {
  const theme = useSmartTacticsTheme();
  if (!slot) {
    return (
      <PressableSpring onPress={onPress} scaleTo={0.94} haptic>
        <View
          style={[
            stand.empty,
            { width: size, height: size, borderRadius: size / 2 },
            emptyActive && [
              stand.emptyOn,
              theme.coach && {
                borderColor: theme.accent,
                backgroundColor: theme.accent,
              },
            ],
          ]}
        >
          <Icon name="add" size={Math.round(size * 0.38)} color={emptyActive ? theme.ctaText : '#fff'} />
        </View>
      </PressableSpring>
    );
  }

  const name = shortName(slot.display_name);
  const ovr = card?.overall ?? 70;
  const ready = card?.readiness_pct ?? 70;

  return (
    <PressableSpring onPress={onPress} scaleTo={0.94} haptic>
      <View style={[stand.wrap, { width: size + 8 }, selected && stand.wrapOn]}>
        <View style={[stand.ovr, { borderRadius: 6, backgroundColor: theme.accent }]}>
          <ProDayText variant="caption" style={[stand.ovrTxt, { color: theme.ctaText }]}>
            {ovr}
          </ProDayText>
        </View>
        <View
          style={[
            stand.avatar,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: selected ? theme.accent : readinessTone(ready, theme.coach),
            },
          ]}
        >
          {card?.photo_url ? (
            <Image source={{ uri: card.photo_url }} style={stand.photo} />
          ) : (
            <View style={stand.fallback}>
              <ProDayText variant="caption" style={[stand.initial, { fontSize: size * 0.36 }]}>
                {name.slice(0, 1).toUpperCase()}
              </ProDayText>
            </View>
          )}
        </View>
        <ProDayText variant="caption" numberOfLines={1} style={[stand.name, { maxWidth: size + 10 }]}>
          {name}
        </ProDayText>
      </View>
    </PressableSpring>
  );
}

export const SmartTacticsBoard: React.FC<{
  formation: string;
  starters: TacticalBoardSlot[];
  bench: TacticalBoardSlot[];
  pool: TacticalBoardSlot[];
  cards?: SmartPlayerCardData[];
  seedKey?: string;
  /** Lecture seule — joueur (pas de composition). */
  readOnly?: boolean;
  /** Met en avant le joueur connecté sur le terrain. */
  highlightUid?: string | null;
  onChangeFormation: (f: string) => void;
  onStartersChange: (slots: TacticalBoardSlot[]) => void;
  onBenchChange: (slots: TacticalBoardSlot[]) => void;
  onPoolChange: (slots: TacticalBoardSlot[]) => void;
}> = ({
  formation,
  starters,
  bench,
  pool,
  cards = [],
  seedKey = 'default',
  readOnly = false,
  highlightUid = null,
  onChangeFormation,
  onStartersChange,
  onBenchChange,
  onPoolChange,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const theme = useSmartTacticsTheme();
  const { width: winW } = useWindowDimensions();

  const cardsByUid = useMemo(() => new Map(cards.map((c) => [c.uid, c])), [cards]);
  const stages = useMemo(() => buildStages(formation), [formation]);
  const [stageIdx, setStageIdx] = useState(0);
  const [cells, setCells] = useState(() => slotsToCells(starters, formation));
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [selectedEmptyIdx, setSelectedEmptyIdx] = useState<number | null>(null);
  const [customDraft, setCustomDraft] = useState('');
  const prevFormation = React.useRef(formation);

  useEffect(() => {
    setCells(slotsToCells(starters, formation));
    setStageIdx(0);
    setSelectedUid(null);
    setSelectedEmptyIdx(null);
    prevFormation.current = formation;
  }, [seedKey]);

  useEffect(() => {
    if (readOnly) return;
    if (prevFormation.current === formation) return;
    prevFormation.current = formation;
    setCells(Array.from({ length: countFormationSlots(formation) }, () => null));
    onStartersChange([]);
    setStageIdx(0);
    setSelectedUid(null);
    setSelectedEmptyIdx(null);
  }, [formation, onStartersChange, readOnly]);

  const activeStage = stages[Math.min(stageIdx, stages.length - 1)];

  const pitchW = Math.min(winW - 20, 410);
  const pitchH = Math.round(pitchW * 1.32);
  const maxInLine = Math.max(1, ...parseFormationLines(formation));
  const tokenSize = Math.max(48, Math.min(68, Math.floor((pitchW * 0.86) / maxInLine) - 6));

  const commitCells = (next: (TacticalBoardSlot | null)[]) => {
    setCells(next);
    onStartersChange(cellsToStarters(next));
  };

  const takeFromLists = (uid: string) => {
    if (uid.startsWith(EMPTY_SLOT_PREFIX)) return null;
    return (
      cells.find((c) => c?.uid === uid) ??
      bench.find((s) => s.uid === uid) ??
      pool.find((s) => s.uid === uid) ??
      null
    );
  };

  const removeUidEverywhere = (uid: string, nextCells: (TacticalBoardSlot | null)[]) => ({
    cleanedCells: nextCells.map((c) => (c?.uid === uid ? null : c)),
    cleanedBench: bench.filter((s) => s.uid !== uid),
    cleanedPool: pool.filter((s) => s.uid !== uid),
  });

  const placeOnIndex = (absoluteIndex: number, player: TacticalBoardSlot) => {
    let next = [...cells];
    const displaced = next[absoluteIndex];
    const { cleanedCells, cleanedBench, cleanedPool } = removeUidEverywhere(player.uid, next);
    next = cleanedCells;
    next[absoluteIndex] = {
      ...player,
      role: 'starter',
      position_label:
        player.position_label ||
        cardsByUid.get(player.uid)?.position ||
        GROUP_LABEL[activeStage.group],
    };
    let nextBench = cleanedBench;
    let nextPool = cleanedPool;
    if (displaced && displaced.uid !== player.uid) {
      nextPool = [...nextPool, { ...displaced, role: 'sub' }];
    }
    commitCells(next);
    onBenchChange(nextBench);
    onPoolChange(nextPool);
    setSelectedUid(null);
    setSelectedEmptyIdx(null);

    const filled = Array.from({ length: activeStage.count }, (_, i) =>
      next[activeStage.startIdx + i],
    ).every(Boolean);
    if (filled && stageIdx < stages.length - 1) setStageIdx((s) => s + 1);
  };

  const onPressCell = (absoluteIndex: number, lineIndex: number) => {
    if (readOnly) {
      const existing = cells[absoluteIndex];
      setSelectedUid(existing?.uid ?? null);
      setSelectedEmptyIdx(null);
      return;
    }
    const stagePos = stages.findIndex((s) => s.lineIndex === lineIndex);
    if (stagePos >= 0) setStageIdx(stagePos);

    const existing = cells[absoluteIndex];
    if (selectedUid) {
      const player = takeFromLists(selectedUid);
      if (!player) {
        setSelectedUid(null);
        return;
      }
      if (existing?.uid === selectedUid) {
        setSelectedUid(null);
        return;
      }
      placeOnIndex(absoluteIndex, player);
      return;
    }
    if (existing) {
      setSelectedUid(existing.uid);
      setSelectedEmptyIdx(null);
      return;
    }
    setSelectedEmptyIdx(absoluteIndex);
    setSelectedUid(null);
  };

  const resolvePlayer = (uid: string): TacticalBoardSlot | null => {
    const from = takeFromLists(uid);
    if (from) return from;
    const card = cardsByUid.get(uid);
    if (!card) return null;
    return {
      uid: card.uid,
      display_name: card.display_name,
      role: 'sub',
      position_label: card.position,
    };
  };

  const onPickCandidate = (uid: string) => {
    if (readOnly) {
      setSelectedUid(uid);
      return;
    }
    if (selectedUid === uid) {
      setSelectedUid(null);
      return;
    }
    const player = resolvePlayer(uid);
    if (!player) return;

    if (selectedEmptyIdx != null) {
      placeOnIndex(selectedEmptyIdx, player);
      return;
    }
    for (let i = 0; i < activeStage.count; i++) {
      const idx = activeStage.startIdx + i;
      if (!cells[idx]) {
        placeOnIndex(idx, player);
        return;
      }
    }
    setSelectedUid(uid);
  };

  const moveSelectedTo = (zone: 'bench' | 'pool') => {
    if (readOnly || !selectedUid) return;
    const player = takeFromLists(selectedUid);
    if (!player) return;
    const { cleanedCells, cleanedBench, cleanedPool } = removeUidEverywhere(selectedUid, cells);
    commitCells(cleanedCells);
    if (zone === 'bench') {
      onBenchChange([...cleanedBench, { ...player, role: 'sub' }]);
      onPoolChange(cleanedPool);
    } else {
      onBenchChange(cleanedBench);
      onPoolChange([...cleanedPool, { ...player, role: 'sub' }]);
    }
    setSelectedUid(null);
  };

  const applyCustom = () => {
    const f = customDraft.trim();
    if (isValidFormation(f)) onChangeFormation(f);
  };

  const candidates = useMemo(() => {
    const available = [...pool, ...bench];
    const preferred = available.filter((s) =>
      groupMatchesSlot(s.position_label || cardsByUid.get(s.uid)?.position, activeStage.group),
    );
    const rest = available.filter((s) => !preferred.some((p) => p.uid === s.uid));
    return [...preferred, ...rest];
  }, [pool, bench, activeStage.group, cardsByUid]);

  const filledInStage = Array.from(
    { length: activeStage.count },
    (_, i) => cells[activeStage.startIdx + i],
  ).filter(Boolean).length;

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withSpring(filledInStage / Math.max(1, activeStage.count), {
      damping: 16,
      stiffness: 160,
    });
  }, [filledInStage, activeStage.count, progress]);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progress.value, [0, 1], [4, 100])}%`,
  }));

  const xiCount = cells.filter(Boolean).length;
  const xiTotal = countFormationSlots(formation);
  const pitchRows = [...cellsByFormationLine(cells, formation)].reverse();
  const lineCount = Math.max(1, pitchRows.length);
  const activeVisual = pitchRows.findIndex((r) => r.lineIndex === activeStage.lineIndex);
  const activeNy =
    lineCount === 1 || activeVisual < 0
      ? 0.5
      : 0.12 + (activeVisual / (lineCount - 1)) * 0.76;
  const bandH = Math.max(0.085, 0.65 / lineCount);

  return (
    <View style={styles.root}>
      {/* Formation */}
      <View style={styles.topBar}>
        <View style={styles.topMeta}>
          {theme.coach ? (
            <ProDayText variant="caption" style={[styles.kicker, { color: COACH_SITE.muted }]}>
              {readOnly ? 'Composition publiée' : 'Composition'}
            </ProDayText>
          ) : (
            <ProDayText variant="caption" style={styles.kicker}>
              {readOnly ? 'Composition publiée' : 'Composition'}
            </ProDayText>
          )}
          <ProDayText variant="section" style={styles.xiTitle}>
            {formation}
            <ProDayText variant="caption" muted>
              {'  '}
              XI {xiCount}/{xiTotal}
            </ProDayText>
          </ProDayText>
        </View>
        {!readOnly ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.formRow}
        >
          {SMART_TACTICS_PRESET_FORMATIONS.map((f) => {
            const on = formation === f;
            return (
              <PressableSpring
                key={f}
                onPress={() => onChangeFormation(f)}
                scaleTo={0.96}
                haptic
                style={[
                  styles.formPill,
                  {
                    borderColor: on ? theme.accent : theme.border,
                    backgroundColor: on ? theme.accentSoft : theme.surface,
                  },
                ]}
              >
                <ProDayText
                  variant="caption"
                  style={on ? { color: theme.accent, fontWeight: '900' } : { fontWeight: '700' }}
                >
                  {f}
                </ProDayText>
              </PressableSpring>
            );
          })}
        </ScrollView>
        ) : null}
        {!readOnly ? (
        <View style={[styles.customRow, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <TextInput
            value={customDraft}
            onChangeText={setCustomDraft}
            placeholder={t('smartTactics.customFormation')}
            placeholderTextColor={theme.muted}
            style={[styles.customInput, { color: theme.foreground }]}
          />
          <PressableSpring onPress={applyCustom} scaleTo={0.96} haptic style={styles.customBtn}>
            <ProDayText variant="caption" style={{ color: theme.accent, fontWeight: '800' }}>
              OK
            </ProDayText>
          </PressableSpring>
        </View>
        ) : null}
      </View>

      {/* Terrain perspective + banc */}
      <LinearGradient
        colors={[...theme.stadiumGradient]}
        style={[styles.stadium, { borderColor: theme.stadiumBorder }]}
      >
        <View style={styles.stadiumHead}>
          <ProDayText variant="caption" style={styles.kicker}>
            Terrain 3D
          </ProDayText>
          <ProDayText variant="caption" style={{ color: 'rgba(255,255,255,0.55)' }}>
            ATT ↑ · GB ↓
          </ProDayText>
        </View>

        <View style={styles.scene}>
          <PitchFrame
            width={pitchW}
            height={pitchH}
            highlightNy0={Math.max(0.02, activeNy - bandH / 2)}
            highlightNy1={Math.min(0.98, activeNy + bandH / 2)}
          >
            <View style={styles.ends} pointerEvents="none">
              <ProDayText variant="caption" style={styles.endBadge}>
                ATT
              </ProDayText>
              <ProDayText variant="caption" style={styles.endBadge}>
                GB
              </ProDayText>
            </View>

            <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
              {pitchRows.map((row, visualIndex) => {
                const ny =
                  lineCount === 1 ? 0.5 : 0.12 + (visualIndex / (lineCount - 1)) * 0.76;
                const n = Math.max(1, row.slots.length);
                const active = row.lineIndex === activeStage.lineIndex;

                return row.slots.map((slot, i) => {
                  const absoluteIndex = row.startIdx + i;
                  const nx = n === 1 ? 0.5 : 0.14 + (i / (n - 1)) * 0.72;
                  const pos = projectPitch(nx, ny, pitchW, pitchH);
                  const box = tokenSize + 28;
                  return (
                    <View
                      key={`p-${absoluteIndex}`}
                      style={{
                        position: 'absolute',
                        left: pos.x - box / 2,
                        top: pos.y - box * 0.55,
                        width: box,
                        height: box + 22,
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        transform: [{ scale: pos.scale }],
                        zIndex: Math.round(10 + pos.scale * 20) + (active ? 5 : 0),
                      }}
                    >
                      <PitchToken
                        slot={slot}
                        card={slot ? cardsByUid.get(slot.uid) : undefined}
                        selected={Boolean(
                          slot &&
                            (selectedUid === slot.uid || highlightUid === slot.uid),
                        )}
                        emptyActive={
                          !readOnly &&
                          (selectedEmptyIdx === absoluteIndex || (active && !slot))
                        }
                        size={tokenSize}
                        onPress={() => onPressCell(absoluteIndex, row.lineIndex)}
                      />
                    </View>
                  );
                });
              })}
            </View>
          </PitchFrame>
        </View>

        {/* Banc de touche */}
        <LinearGradient
          colors={[...theme.benchGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.touchBench, theme.coach && { borderColor: COACH_SITE.border }]}
        >
          <View style={[styles.benchRail, theme.coach && { backgroundColor: COACH_SITE.accent }]} />
          <View style={styles.benchHead}>
            <Icon name="people" size={14} color={theme.accent} />
            <ProDayText variant="caption" style={styles.benchTitle}>
              Banc de touche
            </ProDayText>
            <View style={styles.benchCount}>
              <ProDayText variant="caption" style={styles.benchCountTxt}>
                {bench.length} remp.
              </ProDayText>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.benchRow}
          >
            {bench.length === 0 ? (
              <ProDayText variant="caption" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Vide — sélectionne un titulaire puis « Banc de touche »
              </ProDayText>
            ) : (
              bench.map((s, bi) => {
                const card = cardsByUid.get(s.uid);
                const name = shortName(s.display_name);
                const ovr = card?.overall ?? 70;
                const ready = card?.readiness_pct ?? 70;
                const on = selectedUid === s.uid;
                return (
                  <PressableSpring
                    key={`bench-${s.uid}`}
                    onPress={() => onPickCandidate(s.uid)}
                    scaleTo={0.96}
                    haptic
                    style={[
                      styles.benchSeat,
                      on &&
                        (theme.coach
                          ? { borderColor: theme.accent, backgroundColor: theme.accentSoft }
                          : styles.benchSeatOn),
                    ]}
                  >
                    <ProDayText variant="caption" style={styles.benchNum}>
                      {bi + 12}
                    </ProDayText>
                    <View
                      style={[
                        styles.benchAvatar,
                        {
                          borderColor: on
                            ? theme.accent
                            : readinessTone(ready, theme.coach),
                        },
                      ]}
                    >
                      {card?.photo_url ? (
                        <Image source={{ uri: card.photo_url }} style={styles.benchPhoto} />
                      ) : (
                        <LinearGradient
                          colors={['#2A4A7A', '#152A4A']}
                          style={styles.benchFallback}
                        >
                          <ProDayText variant="caption" style={styles.benchInitial}>
                            {name.slice(0, 1).toUpperCase()}
                          </ProDayText>
                        </LinearGradient>
                      )}
                    </View>
                    <ProDayText variant="caption" numberOfLines={1} style={styles.benchName}>
                      {name}
                    </ProDayText>
                    <ProDayText
                      variant="caption"
                      style={[styles.benchOvr, theme.coach && { color: theme.accent }]}
                    >
                      {ovr}
                    </ProDayText>
                  </PressableSpring>
                );
              })
            )}
          </ScrollView>
        </LinearGradient>
      </LinearGradient>

      {/* Lignes + cartes */}
      {!readOnly ? (
      <View style={[styles.picker, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={{ gap: 2 }}>
          <ProDayText
            variant="caption"
            style={[styles.kicker, theme.coach && { color: COACH_SITE.muted }]}
          >
            Poser · {stageIdx + 1}/{stages.length}
          </ProDayText>
          <ProDayText variant="section" style={{ fontWeight: '900' }}>
            {activeStage.label}
          </ProDayText>
          <ProDayText variant="caption" muted>
            {filledInStage}/{activeStage.count} — tape une carte pour la poser sur le terrain
          </ProDayText>
        </View>

        <View style={[styles.track, { backgroundColor: theme.border }]}>
          <Animated.View
            style={[styles.fill, progressStyle, theme.coach && { backgroundColor: theme.accent }]}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stageRow}
        >
          {stages.map((st, i) => {
            const on = i === stageIdx;
            const done = Array.from({ length: st.count }, (_, k) => cells[st.startIdx + k]).every(
              Boolean,
            );
            return (
              <PressableSpring
                key={st.key}
                onPress={() => {
                  setStageIdx(i);
                  setSelectedUid(null);
                  setSelectedEmptyIdx(null);
                }}
                scaleTo={0.96}
                haptic
                style={[
                  styles.stageChip,
                  {
                    borderColor: on
                      ? theme.accent
                      : done
                        ? SMART_PITCH.ready
                        : theme.border,
                    backgroundColor: on
                      ? theme.accentSoft
                      : done
                        ? 'rgba(61,220,151,0.12)'
                        : theme.coach
                          ? COACH_SITE.bg
                          : colors.background,
                  },
                ]}
              >
                <ProDayText
                  variant="caption"
                  style={{
                    fontWeight: '800',
                    color: on ? theme.accent : done ? SMART_PITCH.ready : undefined,
                  }}
                >
                  {st.short} · {st.label}
                </ProDayText>
              </PressableSpring>
            );
          })}
        </ScrollView>

        {selectedUid ? (
          <View style={styles.actions}>
            <PressableSpring
              onPress={() => moveSelectedTo('bench')}
              scaleTo={0.96}
              haptic
              style={[
                styles.action,
                theme.coach && {
                  backgroundColor: theme.accentSoft,
                  borderColor: theme.accent,
                },
              ]}
            >
              <ProDayText
                variant="caption"
                style={[styles.actionTxt, theme.coach && { color: theme.accent }]}
              >
                → Banc de touche
              </ProDayText>
            </PressableSpring>
            <PressableSpring
              onPress={() => moveSelectedTo('pool')}
              scaleTo={0.96}
              haptic
              style={[
                styles.action,
                theme.coach && {
                  backgroundColor: theme.accentSoft,
                  borderColor: theme.accent,
                },
              ]}
            >
              <ProDayText
                variant="caption"
                style={[styles.actionTxt, theme.coach && { color: theme.accent }]}
              >
                → {t('smartTactics.pool')}
              </ProDayText>
            </PressableSpring>
          </View>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardRow}
        >
          {candidates.length === 0 ? (
            <ProDayText variant="caption" muted>
              Aucun joueur disponible
            </ProDayText>
          ) : (
            candidates.map((s) => {
              const card = cardsByUid.get(s.uid);
              const preferred = groupMatchesSlot(
                s.position_label || card?.position,
                activeStage.group,
              );
              if (!card) {
                return (
                  <PressableSpring
                    key={s.uid}
                    onPress={() => onPickCandidate(s.uid)}
                    scaleTo={0.97}
                    haptic
                    style={[styles.fallbackCard, !preferred && { opacity: 0.4 }]}
                  >
                    <ProDayText variant="body" style={{ fontWeight: '800' }}>
                      {s.display_name}
                    </ProDayText>
                  </PressableSpring>
                );
              }
              return (
                <View
                  key={s.uid}
                  style={[
                    styles.futWrap,
                    selectedUid === s.uid &&
                      (theme.coach
                        ? { borderColor: theme.accent, backgroundColor: theme.accentSoft, borderWidth: 2.5 }
                        : styles.futOn),
                    !preferred && { opacity: 0.4 },
                  ]}
                >
                  <SmartPlayerCard
                    card={card}
                    compact
                    fut
                    onPress={() => onPickCandidate(s.uid)}
                  />
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
      ) : highlightUid ? (
        <View style={[styles.picker, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ProDayText
            variant="caption"
            style={[styles.kicker, theme.coach && { color: COACH_SITE.muted }]}
          >
            Ton poste
          </ProDayText>
          <ProDayText variant="section" style={{ fontWeight: '900' }}>
            {cells.find((c) => c?.uid === highlightUid)?.display_name ??
              starters.find((s) => s.uid === highlightUid)?.display_name ??
              'Hors XI publié'}
          </ProDayText>
          <ProDayText variant="caption" muted>
            Terrain en lecture seule — seul le coach compose.
          </ProDayText>
        </View>
      ) : null}
    </View>
  );
};

const stand = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 4 },
  wrapOn: { transform: [{ scale: 1.07 }] },
  shadow: {
    position: 'absolute',
    bottom: 2,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  empty: {
    borderWidth: 2.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.7)',
    backgroundColor: 'rgba(0,0,0,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyOn: {
    borderColor: SMART_PITCH.warm,
    backgroundColor: SMART_PITCH.warm,
    borderStyle: 'solid',
  },
  ovr: {
    position: 'absolute',
    top: -4,
    right: 2,
    zIndex: 3,
    backgroundColor: SMART_PITCH.warm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#0B1A12',
  },
  ovrOn: {
    backgroundColor: '#fff',
  },
  ovrTxt: { color: '#0B1A12', fontWeight: '900', fontSize: 11 },
  avatar: {
    overflow: 'hidden',
    borderWidth: 3,
    backgroundColor: '#1B3A6B',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 7,
  },
  photo: { width: '100%', height: '100%' },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#F5E6A0', fontWeight: '900' },
  captain: {
    position: 'absolute',
    left: -2,
    top: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: SMART_PITCH.warm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  namePlate: {
    marginTop: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(8,16,12,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    minWidth: 52,
  },
  namePlateOn: {
    borderColor: SMART_PITCH.warm,
    backgroundColor: 'rgba(245,165,36,0.2)',
  },
  name: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 11,
    textAlign: 'center',
  },
  pos: {
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '800',
    fontSize: 9,
    marginTop: 1,
  },
});

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  topBar: { gap: spacing.xs },
  topMeta: { gap: 2 },
  kicker: {
    color: SMART_PITCH.warm,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    fontSize: 10,
  },
  xiTitle: { fontWeight: '900' },
  formRow: { gap: 8, paddingVertical: 2 },
  formPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
  },
  customInput: { flex: 1, paddingVertical: 8, fontSize: 14 },
  customBtn: { padding: 8 },
  stadium: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(245,165,36,0.28)',
    paddingBottom: spacing.sm,
    overflow: 'hidden',
    gap: spacing.sm,
  },
  stadiumHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  scene: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
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
  touchBench: {
    marginHorizontal: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,165,36,0.22)',
    padding: spacing.sm,
    gap: 10,
    overflow: 'hidden',
  },
  benchRail: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: SMART_PITCH.warm,
    opacity: 0.55,
  },
  benchHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  benchTitle: { flex: 1, color: '#fff', fontWeight: '800' },
  benchCount: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(245,165,36,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245,165,36,0.35)',
  },
  benchCountTxt: { color: SMART_PITCH.warm, fontWeight: '800', fontSize: 11 },
  benchRow: { gap: 10, paddingVertical: 2, paddingRight: 8 },
  benchSeat: {
    width: 78,
    alignItems: 'center',
    gap: 5,
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  benchSeatOn: {
    borderColor: SMART_PITCH.warm,
    backgroundColor: 'rgba(245,165,36,0.16)',
  },
  benchNum: {
    position: 'absolute',
    top: 4,
    left: 6,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '900',
    fontSize: 9,
  },
  benchAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#1B3A6B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
  },
  benchPhoto: { width: '100%', height: '100%' },
  benchFallback: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  benchInitial: { color: '#F5E6A0', fontWeight: '900', fontSize: 16 },
  benchName: { color: '#fff', fontWeight: '800', fontSize: 11, maxWidth: 68, textAlign: 'center' },
  benchOvr: { color: SMART_PITCH.warm, fontWeight: '900', fontSize: 12 },
  picker: {
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2, backgroundColor: SMART_PITCH.warm },
  stageRow: { gap: 8, paddingVertical: 2 },
  stageChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  actions: { flexDirection: 'row', gap: spacing.xs },
  action: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: SMART_PITCH.warmSoft,
    borderWidth: 1,
    borderColor: SMART_PITCH.warm,
  },
  actionTxt: { color: SMART_PITCH.warm, fontWeight: '800' },
  cardRow: { gap: 14, paddingVertical: 6, paddingRight: 12, alignItems: 'flex-start' },
  futWrap: { width: 168, borderRadius: 16, padding: 4 },
  futOn: {
    borderWidth: 2.5,
    borderColor: SMART_PITCH.warm,
    backgroundColor: SMART_PITCH.warmSoft,
  },
  fallbackCard: {
    width: 200,
    padding: 16,
    borderRadius: 14,
    backgroundColor: SMART_PITCH.warmSoft,
    borderWidth: 1,
    borderColor: SMART_PITCH.warm,
  },
});
