import type { EventLineupSlot } from '../models/TeamEvent';
import { layoutPitchTokens } from '../utils/formationPitch';
import {
  cellsByFormationLine,
  eventStartersToStadiumCells,
  eventSubsToBenchPlayers,
  shortPitchName,
  starterUidsToStadiumCells,
} from '../utils/coachStadiumPitchLayout';
import { pitchSlotCount } from '../utils/formationPitch';

function starter(uid: string, name = uid): EventLineupSlot {
  return { uid, display_name: name, role: 'starter' };
}

describe('coachSportEasyPitchLayout', () => {
  it('raccourcit les noms pour les jetons', () => {
    expect(shortPitchName('Jean Dupont')).toBe('J. Dupont');
    expect(shortPitchName('Mbappé')).toBe('Mbappé');
  });

  it('aligne les lignes sur parseFormationLines (GB en bas visuel)', () => {
    const cells = eventStartersToStadiumCells(
      Array.from({ length: 11 }, (_, i) => starter(`p${i}`)),
      '4-3-3',
    );
    const rows = cellsByFormationLine(cells, '4-3-3');
    expect(rows).toHaveLength(4);
    expect(rows[0]?.lineIndex).toBe(0);
    expect(rows[3]?.lineIndex).toBe(3);
    expect(pitchSlotCount('4-3-3')).toBe(11);
  });

  it('layout plat SportEasy : gardien plus bas que l’attaque', () => {
    const layout = layoutPitchTokens('4-3-3');
    const gk = layout[0]!;
    const attackers = layout.filter((c) => c.lineIndex === 3);
    expect(gk.y).toBeGreaterThan(attackers[0]!.y);
    expect(gk.x).toBeCloseTo(0.5);
  });

  it('mappe les titulaires coach avec maillot et banc match', () => {
    const cells = starterUidsToStadiumCells(
      ['gk', 'd1', null],
      '4-3-3',
      (uid) =>
        uid === 'gk'
          ? { jerseyNumber: 1, shortName: 'Gardien' }
          : { jerseyNumber: 4, shortName: 'Def' },
    );
    expect(cells[0]).toMatchObject({ uid: 'gk', jerseyNumber: 1 });
    expect(cells[2]).toMatchObject({ uid: null });

    const bench = eventSubsToBenchPlayers([
      { uid: 's1', display_name: 'Remplaçant Un', role: 'sub' },
    ]);
    expect(bench[0]).toMatchObject({ uid: 's1', jerseyNumber: 12, shortName: 'R. Un' });
  });
});
