import type { EventLineupSlot } from '../models/TeamEvent';
import { projectPitch } from '../components/smartTactics/PerspectivePitch';
import {
  cellsByFormationLine,
  eventStartersToStadiumCells,
  eventSubsToBenchPlayers,
  perspectiveHighlightBand,
  perspectiveLineNy,
  shortPitchName,
  starterUidsToStadiumCells,
} from '../utils/coachStadiumPitchLayout';
import { pitchSlotCount } from '../utils/formationPitch';

function starter(uid: string, name = uid): EventLineupSlot {
  return { uid, display_name: name, role: 'starter' };
}

describe('coachStadiumPitchLayout', () => {
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

  it('projette ATT plus haut que GB sur le trapèze', () => {
    const w = 320;
    const h = 422;
    const att = projectPitch(0.5, perspectiveLineNy(0, 4), w, h);
    const gb = projectPitch(0.5, perspectiveLineNy(3, 4), w, h);
    expect(att.y).toBeLessThan(gb.y);
    expect(gb.scale).toBeGreaterThan(att.scale);
  });

  it('calcule une bande de surlignage par ligne', () => {
    expect(perspectiveHighlightBand(4)).toBeCloseTo(0.1625);
    expect(perspectiveHighlightBand(1)).toBe(0.65);
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
