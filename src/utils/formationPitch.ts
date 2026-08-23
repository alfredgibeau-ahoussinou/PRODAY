import type { EventLineupSlot } from '../models/TeamEvent';

export interface PitchPlacement {
  slot: EventLineupSlot;
  lineIndex: number;
  slotInLine: number;
  countInLine: number;
}

/** Formations du onze coach (SportEasy). */
export const COACH_PITCH_FORMATIONS = ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1', '3-4-3'] as const;
export type CoachPitchFormation = (typeof COACH_PITCH_FORMATIONS)[number];

export interface PitchTokenLayout {
  slotIndex: number;
  lineIndex: number;
  slotInLine: number;
  countInLine: number;
  /** 0–1 gauche → droite */
  x: number;
  /** 0–1 haut (attaque) → bas (gardien) */
  y: number;
}

/** Lignes du terrain : [gardien, défense, milieu, attaque…] */
export function parseFormationLines(formation: string): number[] {
  const parts = formation.split('-').map((n) => parseInt(n, 10)).filter((n) => n > 0);
  if (parts.length === 0) return [1, 4, 4, 2];
  return [1, ...parts];
}

export function pitchSlotCount(formation: string): number {
  return parseFormationLines(formation).reduce((sum, n) => sum + n, 0);
}

export function isCoachPitchFormation(value: string): value is CoachPitchFormation {
  return (COACH_PITCH_FORMATIONS as readonly string[]).includes(value);
}

export function assignStartersToPitch(
  starters: EventLineupSlot[],
  formation: string
): PitchPlacement[] {
  const lines = parseFormationLines(formation);
  const out: PitchPlacement[] = [];
  let idx = 0;
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const countInLine = lines[lineIndex];
    for (let slotInLine = 0; slotInLine < countInLine && idx < starters.length; slotInLine++) {
      out.push({
        slot: starters[idx],
        lineIndex,
        slotInLine,
        countInLine,
      });
      idx += 1;
    }
  }
  return out;
}

function lineX(slotInLine: number, countInLine: number): number {
  if (countInLine <= 1) return 0.5;
  const inset = countInLine >= 5 ? 0.1 : 0.14;
  return inset + (slotInLine / (countInLine - 1)) * (1 - 2 * inset);
}

/**
 * Positions 2D d’un onze : attaque en haut, gardien en bas (vue SportEasy).
 */
export function layoutPitchTokens(formation: string): PitchTokenLayout[] {
  const lines = parseFormationLines(formation);
  const lineCount = lines.length;
  const yGk = 0.9;
  const yAtt = 0.12;
  const out: PitchTokenLayout[] = [];
  let slotIndex = 0;
  for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
    const countInLine = lines[lineIndex];
    const t = lineCount <= 1 ? 0 : lineIndex / (lineCount - 1);
    const y = yGk + (yAtt - yGk) * t;
    for (let slotInLine = 0; slotInLine < countInLine; slotInLine++) {
      out.push({
        slotIndex,
        lineIndex,
        slotInLine,
        countInLine,
        x: lineX(slotInLine, countInLine),
        y,
      });
      slotIndex += 1;
    }
  }
  return out;
}

export function fillPitchSlots<T>(
  players: (T | null | undefined)[],
  formation: string,
): Array<PitchTokenLayout & { player: T | null }> {
  const layout = layoutPitchTokens(formation);
  return layout.map((cell) => ({
    ...cell,
    player: players[cell.slotIndex] ?? null,
  }));
}
