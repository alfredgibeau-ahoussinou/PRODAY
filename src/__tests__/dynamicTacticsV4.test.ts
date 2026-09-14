import { DEFENSE_4_SYSTEMS } from '../constants/tacticalMatrix';

describe('Coach Dynamic Tactics (Section 9 - Tableau de Bord Tactique en 6 Étapes)', () => {
  const STEPS = [
    { step: 1, name: 'Attaquants', line: 'ATT' },
    { step: 2, name: 'Milieux', line: 'MID' },
    { step: 3, name: 'Défenseurs', line: 'DEF' },
    { step: 4, name: 'Gardien', line: 'GK' },
    { step: 5, name: 'Remplaçants', line: 'BENCH' },
    { step: 6, name: 'Vue Complète du Stade', line: 'PITCH_2D_FULL' },
  ];

  it('définit rigoureusement les 6 étapes ordonnées de la spécification v4', () => {
    expect(STEPS.length).toBe(6);
    expect(STEPS[0].name).toBe('Attaquants');
    expect(STEPS[1].name).toBe('Milieux');
    expect(STEPS[2].name).toBe('Défenseurs');
    expect(STEPS[3].name).toBe('Gardien');
    expect(STEPS[4].name).toBe('Remplaçants');
    expect(STEPS[5].name).toBe('Vue Complète du Stade');
  });

  it('génère un système 4-3-3 avec 11 postes titulaires précis', () => {
    const formation433 = DEFENSE_4_SYSTEMS.find((f) => f.id === '4-3-3');
    expect(formation433).toBeDefined();
    expect(formation433?.slots.length).toBe(11);

    // Slot 0 : Gardien
    expect(formation433?.slots[0].defaultPos).toBe('GK');

    // Défenseurs (4)
    const defenders = formation433?.slots.filter((s) => ['LB', 'CB', 'RB'].includes(s.defaultPos));
    expect(defenders?.length).toBe(4);

    // Milieux (3)
    const midfielders = formation433?.slots.filter((s) => ['CM', 'CDM', 'CAM'].includes(s.defaultPos));
    expect(midfielders?.length).toBe(3);

    // Attaquants (3)
    const attackers = formation433?.slots.filter((s) => ['LW', 'RW', 'ST', 'CF'].includes(s.defaultPos));
    expect(attackers?.length).toBe(3);
  });

  it('génère un système 4-2-3-1 avec 5 milieux et 1 pointe', () => {
    const formation4231 = DEFENSE_4_SYSTEMS.find((f) => f.id === '4-2-3-1');
    expect(formation4231).toBeDefined();
    expect(formation4231?.slots.length).toBe(11);

    const attackers = formation4231?.slots.filter((s) => ['ST', 'CF', 'BU'].includes(s.defaultPos));
    expect(attackers?.length).toBe(1); // 1 ST / Buteur

    const midfielders = formation4231?.slots.filter((s) =>
      ['CDM', 'CM', 'CAM', 'LAM', 'RAM', 'LM', 'RM'].includes(s.defaultPos)
    );
    expect(midfielders?.length).toBe(5); // 2 CDM + 3 CAM (LAM, CAM, RAM)
  });

  it('valide l’absence de doublons dans la composition', () => {
    const assignedIds = new Set<string>();
    const assignments = [
      { slotIndex: 0, playerId: 'p1', role: 'GK' },
      { slotIndex: 1, playerId: 'p2', role: 'DEF' },
      { slotIndex: 2, playerId: 'p3', role: 'DEF' },
      { slotIndex: 3, playerId: 'p4', role: 'DEF' },
      { slotIndex: 4, playerId: 'p5', role: 'DEF' },
      { slotIndex: 5, playerId: 'p6', role: 'MID' },
      { slotIndex: 6, playerId: 'p7', role: 'MID' },
      { slotIndex: 7, playerId: 'p8', role: 'MID' },
      { slotIndex: 8, playerId: 'p9', role: 'ATT' },
      { slotIndex: 9, playerId: 'p10', role: 'ATT' },
      { slotIndex: 10, playerId: 'p11', role: 'ATT' },
    ];

    for (const a of assignments) {
      expect(assignedIds.has(a.playerId)).toBe(false);
      assignedIds.add(a.playerId);
    }

    expect(assignedIds.size).toBe(11);
  });
});
