import type { EventLineupSlot } from '../models/TeamEvent';
import {
  fillPitchSlots,
  parseFormationLines,
  pitchSlotCount,
} from './formationPitch';

export type CoachStadiumCell = {
  uid: string | null;
  jerseyNumber?: number | null;
  shortName?: string;
};

export type CoachStadiumBenchPlayer = {
  uid: string;
  jerseyNumber: number;
  shortName: string;
};

export function shortPitchName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0].slice(0, 10);
  return `${parts[0].slice(0, 1)}. ${parts[parts.length - 1]}`.slice(0, 12);
}

export function cellsByFormationLine<T>(
  cells: (T | null)[],
  formation: string,
): { lineIndex: number; startIdx: number; slots: (T | null)[] }[] {
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

/** ny normalisé pour la projection perspective (ATT haut → GB bas). */
export function perspectiveLineNy(visualIndex: number, lineCount: number): number {
  if (lineCount <= 1) return 0.5;
  return 0.12 + (visualIndex / (lineCount - 1)) * 0.76;
}

export function perspectiveHighlightBand(lineCount: number): number {
  return Math.max(0.085, 0.65 / Math.max(1, lineCount));
}

export function starterUidsToStadiumCells(
  starterUids: (string | null | undefined)[],
  formation: string,
  resolve: (uid: string) => { jerseyNumber: number; shortName: string } | undefined,
): (CoachStadiumCell | null)[] {
  return fillPitchSlots(starterUids, formation).map((cell) => {
    if (!cell.player) return { uid: null };
    const info = resolve(cell.player);
    return {
      uid: cell.player,
      jerseyNumber: info?.jerseyNumber ?? null,
      shortName: info?.shortName,
    };
  });
}

export function eventStartersToStadiumCells(
  starters: EventLineupSlot[],
  formation: string,
): (CoachStadiumCell | null)[] {
  const n = pitchSlotCount(formation);
  const cells: (CoachStadiumCell | null)[] = Array.from({ length: n }, () => ({ uid: null }));
  starters.slice(0, n).forEach((s, i) => {
    cells[i] = {
      uid: s.uid,
      shortName: shortPitchName(s.display_name),
      jerseyNumber: null,
    };
  });
  return cells;
}

export function eventSubsToBenchPlayers(
  subs: EventLineupSlot[],
  startIndex = 12,
): CoachStadiumBenchPlayer[] {
  return subs.map((s, i) => ({
    uid: s.uid,
    shortName: shortPitchName(s.display_name),
    jerseyNumber: startIndex + i,
  }));
}
