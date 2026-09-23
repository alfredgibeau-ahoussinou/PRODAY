jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  COACH_LINEUP_STEPS,
  coachLineupProgress,
  coachLineupStepAt,
  nextCoachLineupStep,
  previousCoachLineupStep,
  resolvePitchLines,
  stepSlotIndexes,
} from '../utils/coachLineupGuide';
import {
  buildSquadDraft,
  coachSquadDraftKey,
  loadCoachSquadDraft,
  normalizeSquadDraft,
  saveCoachSquadDraft,
  squadDraftIsEmpty,
} from '../utils/coachSquadDraft';
import {
  ALL_FORMATION_COORDINATES,
  TACTICAL_SYSTEMS_BY_ID,
} from '../constants/tacticalMatrix';

const ROSTER = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];

describe('Parcours guidé de composition — séquence approuvée', () => {
  it('suit exactement Attaquants → Milieux → Défenseurs → Gardien → Banc → Vue', () => {
    expect(COACH_LINEUP_STEPS.map((step) => step.id)).toEqual([
      'att',
      'mid',
      'def',
      'gk',
      'subs',
      'review',
    ]);
    expect(COACH_LINEUP_STEPS.map((step) => step.label)).toEqual([
      'Attaquants',
      'Milieux',
      'Défenseurs',
      'Gardien',
      'Remplaçants',
      'Vue complète',
    ]);
  });

  it('avance et recule d’une étape sans jamais sortir de la séquence', () => {
    expect(nextCoachLineupStep('att')).toBe('mid');
    expect(nextCoachLineupStep('subs')).toBe('review');
    expect(nextCoachLineupStep('review')).toBe('review');
    expect(previousCoachLineupStep('att')).toBe('att');
    expect(previousCoachLineupStep('gk')).toBe('def');
  });

  it('annonce la progression « Étape n/6 »', () => {
    expect(coachLineupProgress('att')).toEqual({ index: 1, total: 6, label: 'Attaquants' });
    expect(coachLineupProgress('gk')).toEqual({ index: 4, total: 6, label: 'Gardien' });
    expect(coachLineupProgress('review')).toEqual({ index: 6, total: 6, label: 'Vue complète' });
    expect(coachLineupStepAt(99).id).toBe('review');
  });
});

describe('Découpage du terrain en lignes', () => {
  const formation433 = ALL_FORMATION_COORDINATES['4-3-3']!;

  it('nomme les lignes du 4-3-3 du haut (attaque) vers le bas (gardien)', () => {
    const lines = resolvePitchLines(formation433, '4-3-3');
    expect(lines.map((line) => line.kind)).toEqual(['att', 'mid', 'def', 'gk']);
    expect(lines.map((line) => line.slotIndexes.length)).toEqual([3, 3, 4, 1]);

    const gk = lines.find((line) => line.kind === 'gk')!;
    const att = lines.find((line) => line.kind === 'att')!;
    expect(gk.y).toBeGreaterThan(att.y);
  });

  it('couvre les 11 crans une seule fois', () => {
    const indexes = resolvePitchLines(formation433, '4-3-3').flatMap((line) => line.slotIndexes);
    expect(indexes).toHaveLength(11);
    expect(new Set(indexes).size).toBe(11);
  });

  it('gère une formation au libellé non numérique en regroupant par ordonnée', () => {
    const wm = TACTICAL_SYSTEMS_BY_ID['WM (3-2-2-3)'];
    expect(wm).toBeDefined();
    const lines = resolvePitchLines(wm.slots, wm.id);
    const indexes = lines.flatMap((line) => line.slotIndexes);
    expect(indexes).toHaveLength(11);
    expect(new Set(indexes).size).toBe(11);
    expect(lines[lines.length - 1]!.kind).toBe('gk');
    expect(lines[0]!.kind).toBe('att');
  });

  it('renvoie les crans d’une étape, et rien pour le banc / la relecture', () => {
    expect(stepSlotIndexes('gk', formation433, '4-3-3')).toEqual(
      resolvePitchLines(formation433, '4-3-3').find((line) => line.kind === 'gk')!.slotIndexes,
    );
    expect(stepSlotIndexes(null, formation433, '4-3-3')).toEqual([]);
    const total = COACH_LINEUP_STEPS.flatMap((step) =>
      stepSlotIndexes(step.line, formation433, '4-3-3'),
    );
    expect(total).toHaveLength(11);
  });

  it('tient sur toutes les formations du format 11v11', () => {
    const systems11 = Object.values(TACTICAL_SYSTEMS_BY_ID).filter(
      (system) => system.format === '11v11',
    );
    expect(systems11.length).toBeGreaterThanOrEqual(39);
    for (const system of systems11) {
      const lines = resolvePitchLines(system.slots, system.id);
      const indexes = lines.flatMap((line) => line.slotIndexes);
      expect({ id: system.id, count: indexes.length }).toEqual({ id: system.id, count: 11 });
      expect(new Set(indexes).size).toBe(11);
      const kinds = lines.map((line) => line.kind);
      expect(kinds).toContain('gk');
      expect(kinds).toContain('att');
    }
  });
});

describe('Brouillon de composition', () => {
  it('nettoie les inconnus, les doublons et complète la longueur des crans', () => {
    const draft = normalizeSquadDraft(
      { format: '11v11', formation: '4-3-3', starterIds: ['p1', 'ghost', 'p1'], benchIds: ['p2'] },
      ROSTER,
      5,
    );
    expect(draft?.starterIds).toEqual(['p1', null, null, null, null]);
    expect(draft?.benchIds).toEqual(['p2']);
  });

  it('refuse un contenu illisible', () => {
    expect(normalizeSquadDraft(null, ROSTER, 11)).toBeNull();
    expect(normalizeSquadDraft('nope', ROSTER, 11)).toBeNull();
  });

  it('détecte un brouillon vide', () => {
    expect(squadDraftIsEmpty(null)).toBe(true);
    expect(squadDraftIsEmpty(buildSquadDraft({ format: '11v11', formation: '4-3-3', starterIds: [null, null], benchIds: [] }))).toBe(true);
    expect(squadDraftIsEmpty(buildSquadDraft({ format: '11v11', formation: '4-3-3', starterIds: ['p1', null], benchIds: [] }))).toBe(false);
  });

  it('persiste et relit le onze par équipe', async () => {
    const draft = buildSquadDraft({
      format: '11v11',
      formation: '4-4-2',
      starterIds: ['p1', 'p2', null],
      benchIds: ['p3'],
    });
    await saveCoachSquadDraft('team-u17', draft);
    expect(coachSquadDraftKey('team-u17')).toContain('team-u17');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      coachSquadDraftKey('team-u17'),
      JSON.stringify(draft),
    );

    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(draft));
    const loaded = await loadCoachSquadDraft('team-u17', ROSTER, 3);
    expect(loaded?.formation).toBe('4-4-2');
    expect(loaded?.starterIds).toEqual(['p1', 'p2', null]);
    expect(loaded?.benchIds).toEqual(['p3']);
  });

  it('retombe proprement quand le stockage échoue', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    await expect(loadCoachSquadDraft('team-x', ROSTER, 3)).resolves.toBeNull();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('{not json');
    await expect(loadCoachSquadDraft('team-x', ROSTER, 3)).resolves.toBeNull();
  });
});
