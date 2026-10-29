/**
 * Bibliothèque d'Ateliers Tactiques Pré-chargés & Pédagogiques.
 * Conforme à la section 6 du Master Engineering Prompt.
 */

import type { Drill } from './trainingWorkspaceModel';

export const PRODAY_TACTICAL_LIBRARY: Drill[] = [
  {
    id: 'lib_rondo_4v2',
    name: 'Rondo 4v2 · Circulation & Création de Lignes',
    category: 'rondo',
    objective: 'Casser les lignes de passe sous pression et assurer la transition rapide à la perte.',
    pitchConfig: 'box',
    durationMin: 20,
    playerCount: 6,
    intensity: 'medium',
    ageGroup: 'U13 à Seniors',
    instructions: 'Conservation dans le carré en 2 touches max. 4 joueurs extérieurs contre 2 récupérateurs intérieurs. Comptabiliser 10 passes consécutives.',
    coachingPoints: [
      'Orientation du corps avant réception pour voir la passe suivante.',
      'Soutien constant sur les angles de passe (ne jamais rester aligné derrière le défenseur).',
      'Changement de rythme immédiat dès que l’intervalle s’ouvre.',
    ],
    frames: [
      {
        id: 'f1',
        order: 0,
        durationMs: 2500,
        title: 'Phase 1 : Fixation et appui latéral',
        players: [
          { id: 'p1', team: 'teamA', num: 4, x: 20, y: 32, label: 'DC' },
          { id: 'p2', team: 'teamA', num: 6, x: 50, y: 12, label: 'MDF', hasBall: true },
          { id: 'p3', team: 'teamA', num: 8, x: 80, y: 32, label: 'MC' },
          { id: 'p4', team: 'teamA', num: 10, x: 50, y: 52, label: 'MO' },
          { id: 'd1', team: 'teamB', num: 9, x: 42, y: 26, label: 'DEF' },
          { id: 'd2', team: 'teamB', num: 7, x: 58, y: 36, label: 'DEF' },
        ],
        equipment: [
          { id: 'c1', type: 'disc_cone', x: 15, y: 8, color: '#FACC15' },
          { id: 'c2', type: 'disc_cone', x: 85, y: 8, color: '#FACC15' },
          { id: 'c3', type: 'disc_cone', x: 85, y: 56, color: '#FACC15' },
          { id: 'c4', type: 'disc_cone', x: 15, y: 56, color: '#FACC15' },
          { id: 'ball', type: 'ball', x: 48, y: 15 },
        ],
        drawings: [
          {
            id: 'dr1',
            type: 'pass',
            from: { x: 50, y: 12 },
            to: { x: 80, y: 32 },
            color: '#38BDF8',
          },
          {
            id: 'dr2',
            type: 'run',
            from: { x: 42, y: 26 },
            to: { x: 62, y: 28 },
            color: '#4ADE80',
          },
        ],
        zones: [],
      },
      {
        id: 'f2',
        order: 1,
        durationMs: 2500,
        title: 'Phase 2 : Passe diagonale dans l’intervalle',
        players: [
          { id: 'p1', team: 'teamA', num: 4, x: 22, y: 30, label: 'DC' },
          { id: 'p2', team: 'teamA', num: 6, x: 48, y: 14, label: 'MDF' },
          { id: 'p3', team: 'teamA', num: 8, x: 80, y: 32, label: 'MC', hasBall: true },
          { id: 'p4', team: 'teamA', num: 10, x: 46, y: 48, label: 'MO' },
          { id: 'd1', team: 'teamB', num: 9, x: 62, y: 28, label: 'DEF' },
          { id: 'd2', team: 'teamB', num: 7, x: 55, y: 38, label: 'DEF' },
        ],
        equipment: [
          { id: 'c1', type: 'disc_cone', x: 15, y: 8, color: '#FACC15' },
          { id: 'c2', type: 'disc_cone', x: 85, y: 8, color: '#FACC15' },
          { id: 'c3', type: 'disc_cone', x: 85, y: 56, color: '#FACC15' },
          { id: 'c4', type: 'disc_cone', x: 15, y: 56, color: '#FACC15' },
          { id: 'ball', type: 'ball', x: 78, y: 32 },
        ],
        drawings: [
          {
            id: 'dr3',
            type: 'pass',
            from: { x: 80, y: 32 },
            to: { x: 46, y: 48 },
            color: '#38BDF8',
          },
          {
            id: 'dr4',
            type: 'run',
            from: { x: 22, y: 30 },
            to: { x: 28, y: 44 },
            color: '#4ADE80',
          },
        ],
        zones: [],
      },
    ],
    source: 'proday_library',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'lib_build_up_back',
    name: 'Sortie Propre du Gardien & Recherche du 3e Homme',
    category: 'build_up',
    objective: 'Attirer le premier rideau de pressing adverse pour trouver le milieu libre dans le dos.',
    pitchConfig: 'half',
    durationMin: 25,
    playerCount: 11,
    intensity: 'high',
    ageGroup: 'U15 à Seniors',
    instructions: 'Le gardien relance court sur le central droit. Fixation du 9 adverse puis transmission verticale vers le décrochage du 6.',
    coachingPoints: [
      'Garder le calme sous pressing et exploiter la largeur de surface.',
      'Course de feinte du milieu relayeur pour libérer l’axe.',
    ],
    frames: [
      {
        id: 'fb1',
        order: 0,
        durationMs: 3000,
        title: 'Phase 1 : Relance courte et étirement',
        players: [
          { id: 'gk1', team: 'gk', num: 1, x: 50, y: 8, label: 'GB', hasBall: true },
          { id: 'dc1', team: 'teamA', num: 4, x: 30, y: 16, label: 'DCG' },
          { id: 'dc2', team: 'teamA', num: 5, x: 70, y: 16, label: 'DCD' },
          { id: 'mdf', team: 'teamA', num: 6, x: 50, y: 30, label: 'MDF' },
          { id: 'lat', team: 'teamA', num: 2, x: 88, y: 36, label: 'LD' },
          { id: 'adv1', team: 'teamB', num: 9, x: 50, y: 22, label: 'ATT' },
          { id: 'adv2', team: 'teamB', num: 11, x: 68, y: 28, label: 'AIL' },
        ],
        equipment: [
          { id: 'b1', type: 'ball', x: 50, y: 10 },
          { id: 'g1', type: 'goal', x: 50, y: 2 },
        ],
        drawings: [
          {
            id: 'dr_p1',
            type: 'pass',
            from: { x: 50, y: 8 },
            to: { x: 70, y: 16 },
            color: '#38BDF8',
          },
          {
            id: 'dr_r1',
            type: 'run',
            from: { x: 50, y: 22 },
            to: { x: 64, y: 18 },
            color: '#EF4444',
          },
        ],
        zones: [],
      },
      {
        id: 'fb2',
        order: 1,
        durationMs: 2800,
        title: 'Phase 2 : Fixation et passe diagonale vers le 3e homme',
        players: [
          { id: 'gk1', team: 'gk', num: 1, x: 50, y: 10, label: 'GB', hasBall: false },
          { id: 'dc1', team: 'teamA', num: 4, x: 30, y: 20, label: 'DCG' },
          { id: 'dc2', team: 'teamA', num: 5, x: 70, y: 20, label: 'DCD', hasBall: true },
          { id: 'mdf', team: 'teamA', num: 6, x: 54, y: 38, label: 'MDF' },
          { id: 'lat', team: 'teamA', num: 2, x: 90, y: 44, label: 'LD' },
          { id: 'adv1', team: 'teamB', num: 9, x: 64, y: 22, label: 'ATT' },
          { id: 'adv2', team: 'teamB', num: 11, x: 74, y: 32, label: 'AIL' },
        ],
        equipment: [
          { id: 'b1', type: 'ball', x: 70, y: 20 },
          { id: 'g1', type: 'goal', x: 50, y: 2 },
        ],
        drawings: [
          {
            id: 'dr_p2',
            type: 'pass',
            from: { x: 70, y: 20 },
            to: { x: 54, y: 38 },
            color: '#38BDF8',
          },
        ],
        zones: [],
      },
    ],
    source: 'proday_library',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'lib_finishing_wings',
    name: 'Finition Rapide · Débordement & Double Appel au But',
    category: 'finishing',
    objective: 'Attaque du premier poteau et cut-back en retrait à l’entrée des 16 mètres.',
    pitchConfig: 'attacking_third',
    durationMin: 25,
    playerCount: 8,
    intensity: 'high',
    ageGroup: 'U14 à Seniors',
    instructions: 'Le milieu lance l’ailier dans la course. Centre fort au cordeau avec croisement des trajectoires des deux attaquants.',
    coachingPoints: [
      'Le premier attaquant coupe au 1er poteau pour aspirer le défenseur central.',
      'Le second attaquant ralentit sa course pour reprendre le ballon en retrait à l’entrée de surface.',
    ],
    frames: [
      {
        id: 'ff1',
        order: 0,
        durationMs: 2500,
        title: 'Phase 1 : Débordement et appel croisé',
        players: [
          { id: 'w1', team: 'teamA', num: 7, x: 84, y: 26, label: 'Ailier', hasBall: true },
          { id: 'st1', team: 'teamA', num: 9, x: 44, y: 20, label: 'Buteur' },
          { id: 'mo1', team: 'teamA', num: 10, x: 56, y: 32, label: 'Soutien' },
          { id: 'def1', team: 'teamB', num: 4, x: 46, y: 14, label: 'DC' },
          { id: 'gk1', team: 'gk', num: 1, x: 50, y: 4, label: 'Gardien' },
        ],
        equipment: [
          { id: 'ball1', type: 'ball', x: 82, y: 24 },
          { id: 'goal1', type: 'goal', x: 50, y: 1 },
          { id: 'm1', type: 'mannequin', x: 74, y: 20 },
        ],
        drawings: [
          {
            id: 'pass_cross',
            type: 'pass',
            from: { x: 84, y: 26 },
            to: { x: 56, y: 12 },
            color: '#38BDF8',
          },
          {
            id: 'run_front',
            type: 'run',
            from: { x: 44, y: 20 },
            to: { x: 42, y: 8 },
            color: '#4ADE80',
          },
        ],
        zones: [],
      },
      {
        id: 'ff2',
        order: 1,
        durationMs: 2000,
        title: 'Phase 2 : Reprise en une touche et cadrage',
        players: [
          { id: 'w1', team: 'teamA', num: 7, x: 82, y: 14, label: 'Ailier', hasBall: false },
          { id: 'st1', team: 'teamA', num: 9, x: 42, y: 8, label: 'Buteur', hasBall: true },
          { id: 'mo1', team: 'teamA', num: 10, x: 54, y: 18, label: 'Soutien' },
          { id: 'def1', team: 'teamB', num: 4, x: 44, y: 9, label: 'DC' },
          { id: 'gk1', team: 'gk', num: 1, x: 48, y: 5, label: 'Gardien' },
        ],
        equipment: [
          { id: 'ball1', type: 'ball', x: 42, y: 8 },
          { id: 'goal1', type: 'goal', x: 50, y: 1 },
          { id: 'm1', type: 'mannequin', x: 74, y: 20 },
        ],
        drawings: [
          {
            id: 'shot_goal',
            type: 'pass',
            from: { x: 42, y: 8 },
            to: { x: 48, y: 2 },
            color: '#F43F5E',
          },
        ],
        zones: [],
      },
    ],
    source: 'proday_library',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const PRELOADED_DRILLS: Drill[] = PRODAY_TACTICAL_LIBRARY;

export function getDrillsByCategory(category: string): Drill[] {
  if (category === 'all') return PRODAY_TACTICAL_LIBRARY;
  return PRODAY_TACTICAL_LIBRARY.filter((d) => d.category === category);
}
