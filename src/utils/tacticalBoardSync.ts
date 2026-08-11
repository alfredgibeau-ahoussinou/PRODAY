import type { EventLineup, EventLineupSlot, TeamEvent } from '../models/TeamEvent';
import type { TacticalBoardSlot } from '../models/SmartTactics';

export function boardSlotsToEventLineup(
  formation: string,
  starters: TacticalBoardSlot[],
  bench: TacticalBoardSlot[],
): EventLineup {
  const slots: EventLineupSlot[] = [
    ...starters.map((s) => ({
      uid: s.uid,
      display_name: s.display_name,
      role: 'starter' as const,
      position_label: s.position_label,
    })),
    ...bench.map((s) => ({
      uid: s.uid,
      display_name: s.display_name,
      role: 'sub' as const,
      position_label: s.position_label,
    })),
  ];
  return { formation, slots };
}

export function eventLineupToBoardSlots(lineup: EventLineup): {
  formation: string;
  starters: TacticalBoardSlot[];
  bench: TacticalBoardSlot[];
} {
  return {
    formation: lineup.formation,
    starters: lineup.slots
      .filter((s) => s.role === 'starter')
      .map((s) => ({ ...s, role: 'starter' as const })),
    bench: lineup.slots
      .filter((s) => s.role === 'sub')
      .map((s) => ({ ...s, role: 'sub' as const })),
  };
}

/** Prefer next match/friendly/competition event with optional existing lineup. */
export function pickLineupTargetEvent(events: TeamEvent[]): TeamEvent | null {
  const now = Date.now();
  const upcoming = [...events]
    .filter(
      (e) =>
        e.starts_at.getTime() >= now - 3 * 60 * 60 * 1000 &&
        (e.event_type === 'friendly' ||
          e.event_type === 'competition' ||
          e.event_type === 'tournament' ||
          Boolean(e.live_state)),
    )
    .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
  return upcoming[0] ?? null;
}
