import type { EventLineupSlot } from '../models/TeamEvent';

export interface PitchPlacement {
  slot: EventLineupSlot;
  lineIndex: number;
  slotInLine: number;
  countInLine: number;
}

/** Lignes du terrain : [gardien, défense, milieu, attaque…] */
export function parseFormationLines(formation: string): number[] {
  const parts = formation.split('-').map((n) => parseInt(n, 10)).filter((n) => n > 0);
  if (parts.length === 0) return [1, 4, 4, 2];
  return [1, ...parts];
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
