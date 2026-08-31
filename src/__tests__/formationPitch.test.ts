jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EventLineupSlot } from '../models/TeamEvent';
import {
  assignStartersToPitch,
  fillPitchSlots,
  layoutPitchTokens,
  parseFormationLines,
  pitchSlotCount,
} from '../utils/formationPitch';
import {
  assignUidToSlot,
  benchUidsForLineup,
  changeCoachPitchFormation,
  clearPitchSlot,
  emptyCoachPitchLineup,
  loadCoachPitchLineup,
  normalizeCoachPitchLineup,
  saveCoachPitchLineup,
  swapPitchSlots,
  autofillCoachPitchLineup,
} from '../utils/coachPitchLineup';

function starter(uid: string): EventLineupSlot {
  return { uid, display_name: uid, role: 'starter' };
}

describe('formationPitch', () => {
  it('parse 4-3-3, 4-2-3-1 et 3-4-3 avec gardien en tête', () => {
    expect(parseFormationLines('4-3-3')).toEqual([1, 4, 3, 3]);
    expect(parseFormationLines('4-2-3-1')).toEqual([1, 4, 2, 3, 1]);
    expect(parseFormationLines('3-4-3')).toEqual([1, 3, 4, 3]);
    expect(parseFormationLines('4-4-2')).toEqual([1, 4, 4, 2]);
    expect(parseFormationLines('3-5-2')).toEqual([1, 3, 5, 2]);
  });

  it('compte 11 crans pour les formations coach', () => {
    expect(pitchSlotCount('4-3-3')).toBe(11);
    expect(pitchSlotCount('4-4-2')).toBe(11);
    expect(pitchSlotCount('3-5-2')).toBe(11);
    expect(pitchSlotCount('4-2-3-1')).toBe(11);
    expect(pitchSlotCount('3-4-3')).toBe(11);
  });

  it('place les titulaires ligne par ligne (GB puis défense, milieu, attaque)', () => {
    const starters = Array.from({ length: 11 }, (_, i) => starter(`p${i}`));
    const placed = assignStartersToPitch(starters, '4-3-3');
    expect(placed).toHaveLength(11);
    expect(placed.filter((p) => p.lineIndex === 0).map((p) => p.slot.uid)).toEqual(['p0']);
    expect(placed.filter((p) => p.lineIndex === 1)).toHaveLength(4);
    expect(placed.filter((p) => p.lineIndex === 2)).toHaveLength(3);
    expect(placed.filter((p) => p.lineIndex === 3).map((p) => p.slot.uid)).toEqual([
      'p8',
      'p9',
      'p10',
    ]);
  });

  it('layout SportEasy : gardien plus bas que l’attaque, ailes étalées', () => {
    const layout = layoutPitchTokens('4-3-3');
    expect(layout).toHaveLength(11);
    const gk = layout[0];
    const attackers = layout.filter((c) => c.lineIndex === 3);
    expect(gk.y).toBeGreaterThan(attackers[0]!.y);
    expect(gk.x).toBeCloseTo(0.5);
    expect(attackers[0]!.x).toBeLessThan(attackers[1]!.x);
    expect(attackers[2]!.x).toBeGreaterThan(attackers[1]!.x);
  });

  it('4-2-3-1 empile 5 lignes et garde le 9 tout en haut', () => {
    const layout = layoutPitchTokens('4-2-3-1');
    expect(layout.map((c) => c.countInLine)).toEqual([1, 4, 4, 4, 4, 2, 2, 3, 3, 3, 1]);
    const nine = layout[layout.length - 1]!;
    expect(nine.lineIndex).toBe(4);
    expect(nine.y).toBeLessThan(layout[0]!.y);
    expect(nine.x).toBeCloseTo(0.5);
  });

  it('fillPitchSlots conserve les crans vides', () => {
    const filled = fillPitchSlots(['a', null, 'c'], '4-4-2');
    expect(filled).toHaveLength(11);
    expect(filled[0]!.player).toBe('a');
    expect(filled[1]!.player).toBeNull();
    expect(filled[2]!.player).toBe('c');
    expect(filled[3]!.player).toBeNull();
  });
});

describe('coachPitchLineup', () => {
  const roster = ['a', 'b', 'c', 'd', 'e'];

  it('place un joueur du banc puis échange deux titulaires', () => {
    let lineup = emptyCoachPitchLineup('4-3-3');
    lineup = assignUidToSlot(lineup, 'a', 0);
    lineup = assignUidToSlot(lineup, 'b', 1);
    expect(lineup.starterUids[0]).toBe('a');
    expect(lineup.starterUids[1]).toBe('b');
    lineup = assignUidToSlot(lineup, 'a', 1);
    expect(lineup.starterUids[0]).toBe('b');
    expect(lineup.starterUids[1]).toBe('a');
    expect(benchUidsForLineup(lineup, roster)).toEqual(['c', 'd', 'e']);
  });

  it('retire un cran et ignore les uid hors effectif', () => {
    let lineup = assignUidToSlot(emptyCoachPitchLineup(), 'a', 0);
    lineup = clearPitchSlot(lineup, 0);
    expect(lineup.starterUids[0]).toBeNull();
    const dirty = normalizeCoachPitchLineup(
      { formation: '4-3-3', starterUids: ['a', 'ghost', 'a'] },
      roster,
    );
    expect(dirty.starterUids[0]).toBe('a');
    expect(dirty.starterUids[1]).toBeNull();
    expect(dirty.starterUids[2]).toBeNull();
  });

  it('swap et changement de formation conservent le onze dans l’ordre', () => {
    let lineup = emptyCoachPitchLineup('4-3-3');
    lineup = assignUidToSlot(lineup, 'a', 0);
    lineup = assignUidToSlot(lineup, 'b', 10);
    lineup = swapPitchSlots(lineup, 0, 10);
    expect(lineup.starterUids[0]).toBe('b');
    expect(lineup.starterUids[10]).toBe('a');
    lineup = changeCoachPitchFormation(lineup, '3-5-2');
    expect(lineup.formation).toBe('3-5-2');
    expect(lineup.starterUids[0]).toBe('b');
    expect(lineup.starterUids[10]).toBe('a');
    expect(pitchSlotCount(lineup.formation)).toBe(11);
  });

  it('persiste la compo par id d’équipe', async () => {
    const lineup = assignUidToSlot(emptyCoachPitchLineup('4-4-2'), 'a', 0);
    await saveCoachPitchLineup('team-u17', lineup);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'proday.coach.sporteasy.lineup.v1:team-u17',
      JSON.stringify(lineup),
    );
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(lineup));
    const loaded = await loadCoachPitchLineup('team-u17');
    expect(loaded?.formation).toBe('4-4-2');
    expect(loaded?.starterUids?.[0]).toBe('a');
  });

  it('auto-remplit le XI depuis l’effectif si la compo est vide', () => {
    const roster11 = Array.from({ length: 14 }, (_, i) => `p${i}`);
    const filled = autofillCoachPitchLineup(emptyCoachPitchLineup('4-3-3'), roster11);
    expect(filled.formation).toBe('4-3-3');
    expect(filled.starterUids).toEqual(roster11.slice(0, 11));
    expect(benchUidsForLineup(filled, roster11)).toEqual(['p11', 'p12', 'p13']);
    const already = assignUidToSlot(emptyCoachPitchLineup(), 'p0', 0);
    expect(autofillCoachPitchLineup(already, roster11).starterUids[0]).toBe('p0');
    expect(autofillCoachPitchLineup(already, roster11).starterUids[1]).toBeNull();
    expect(autofillCoachPitchLineup(emptyCoachPitchLineup(), []).starterUids[0]).toBeNull();
  });
});
