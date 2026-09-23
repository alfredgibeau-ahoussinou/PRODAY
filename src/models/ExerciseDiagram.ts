/**
 * Modèle unifié pour les schémas d'exercice d'entraînement du pôle Coach.
 *
 * Supporte :
 * - Gabarits de terrain : complet, demi-terrain, zone/cage réduite, espace libre.
 * - Éléments vectoriels éditables : joueurs, gardiens, matériel (plots, ballons, buts,
 *   mini-buts, mannequins, échelles), flèches (courses, passes, dribbles, droites ou courbées),
 *   zones d'exercice et annotations textuelles.
 * - Séquences et étapes multiples d'atelier avec consignes propres par étape.
 * - Confidentialité et partage (privé, équipe, club).
 */

import { proSemantic } from '../theme/professionalDesign';
import type { ExerciseDiagramAnimationData } from './ExerciseDiagramAnimation';

export type PitchTemplate = 'full' | 'half' | 'box' | 'blank';

export type TeamSide = 'home' | 'away' | 'neutral' | 'gk';

export type EquipmentType =
  | 'cone'
  | 'disc_cone'
  | 'ball'
  | 'goal'
  | 'mini_goal'
  | 'mannequin'
  | 'ladder'
  | 'hurdle';

export type ArrowKind = 'movement' | 'pass' | 'dribble' | 'shot';

export type ZoneStyle = 'dashed' | 'solid';

export interface DiagramPlayerElement {
  id: string;
  type: 'player';
  x: number;
  y: number;
  num?: number;
  label?: string;
  team: TeamSide;
  role?: string;
  color?: string;
  hasBall?: boolean;
}

export interface DiagramEquipmentElement {
  id: string;
  type: 'equipment';
  equipmentType: EquipmentType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number; // degrés (ex: 0, 45, 90, 180)
  color?: string;
}

export interface DiagramArrowElement {
  id: string;
  type: 'arrow';
  kind: ArrowKind;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  controlX?: number; // pour flèche courbée Bézier quadratique
  controlY?: number;
  color?: string;
}

export interface DiagramZoneElement {
  id: string;
  type: 'zone';
  x: number;
  y: number;
  width: number;
  height: number;
  style?: ZoneStyle;
  label?: string;
  color?: string;
  fillOpacity?: number;
}

export interface DiagramTextElement {
  id: string;
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  color?: string;
}

export type DiagramElement =
  | DiagramPlayerElement
  | DiagramEquipmentElement
  | DiagramArrowElement
  | DiagramZoneElement
  | DiagramTextElement;

export interface DiagramLegendItem {
  id: string;
  label: string;
  color: string;
  kind?: string;
}

export interface ExerciseStage {
  id: string;
  name: string;
  instructions?: string;
  elements: DiagramElement[];
  legend?: DiagramLegendItem[];
}

export interface ExerciseDiagramData {
  id: string;
  name: string;
  objective?: string;
  instructions?: string;
  pitchTemplate: PitchTemplate;
  width: number; // Coordonnée max X (ex: 100)
  height: number; // Coordonnée max Y (ex: 64)
  elements: DiagramElement[];
  legend?: DiagramLegendItem[];
  stages?: ExerciseStage[];
  currentStageIndex?: number;
  ownerUid: string;
  ownerName?: string;
  clubId?: string;
  teamId?: string;
  isSharedWithClub?: boolean;
  isSharedWithTeam?: boolean;
  isTemplate?: boolean;
  drillType?: string;
  animation?: ExerciseDiagramAnimationData;
  backgroundImageUri?: string;
  backgroundImageOpacity?: number;
  createdAt: string;
  updatedAt: string;
}

export const DIAGRAM_VIEWBOX = {
  full: { width: 100, height: 64 },
  half: { width: 100, height: 64 },
  box: { width: 100, height: 64 },
  blank: { width: 100, height: 64 },
} as const;

export const DEFAULT_TEAM_COLORS: Record<TeamSide, string> = {
  home: proSemantic.info, // Bleu pro
  away: proSemantic.danger, // Rouge pro
  neutral: proSemantic.warning, // Jaune/Orange neutre ou joker
  gk: '#F59E0B', // Ambre gardien
};

export const DEFAULT_EQUIPMENT_COLORS: Record<EquipmentType, string> = {
  cone: proSemantic.warning,
  disc_cone: proSemantic.warning,
  ball: '#FFFFFF',
  goal: '#FFFFFF',
  mini_goal: '#FFFFFF',
  mannequin: '#E2E8F0',
  ladder: '#F59E0B',
  hurdle: '#F59E0B',
};

export const DEFAULT_ARROW_COLORS: Record<ArrowKind, string> = {
  movement: proSemantic.success, // Vert course
  pass: '#38BDF8', // Cyan passe
  dribble: '#F59E0B', // Ambre conduite
  shot: proSemantic.danger, // Rouge tir
};

/**
 * Crée un schéma d'entraînement vide avec son repère normalisé.
 */
export function createEmptyDiagram(
  name = 'Nouveau schéma',
  pitchTemplate: PitchTemplate = 'half',
  ownerUid = 'coach-local',
  clubId?: string,
  teamId?: string,
): ExerciseDiagramData {
  const vb = DIAGRAM_VIEWBOX[pitchTemplate];
  const now = new Date().toISOString();
  return {
    id: `diag-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    pitchTemplate,
    width: vb.width,
    height: vb.height,
    elements: [],
    legend: [
      { id: 'leg-home', label: 'Porteurs / Attaque', color: DEFAULT_TEAM_COLORS.home },
      { id: 'leg-away', label: 'Défense / Pressing', color: DEFAULT_TEAM_COLORS.away },
      { id: 'leg-mat', label: 'Plots & Matériel', color: proSemantic.warning },
    ],
    stages: [],
    ownerUid,
    clubId,
    teamId,
    isSharedWithClub: false,
    isSharedWithTeam: false,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Convertit un drillType en un schéma éditable complet, permettant au coach
 * de modifier individuellement chaque joueur, plot, flèche ou consigne.
 */
export function createPresetDiagram(
  drillType: string,
  title?: string,
  ownerUid = 'system',
): ExerciseDiagramData {
  const now = new Date().toISOString();
  const id = `preset-${drillType}-${Date.now()}`;

  switch (drillType) {
    case 'rondo':
      return {
        id,
        name: title || 'Rondo 4v2 & Conservation Rapide',
        objective: 'Conservation sous pressing et orientation du corps à deux touches max',
        instructions:
          'Zone 16x16m délimitée par 4 cônes. 4 joueurs extérieurs font tourner le ballon. 2 récupérateurs au centre chassent. Permutation à la perte.',
        pitchTemplate: 'box',
        width: 100,
        height: 64,
        elements: [
          // Zone délimitée
          {
            id: 'z1',
            type: 'zone',
            x: 20,
            y: 8,
            width: 60,
            height: 48,
            style: 'dashed',
            color: proSemantic.success,
            fillOpacity: 0.08,
            label: 'Zone 4v2 (16x16m)',
          },
          // 4 Cônes
          { id: 'c1', type: 'equipment', equipmentType: 'cone', x: 20, y: 8 },
          { id: 'c2', type: 'equipment', equipmentType: 'cone', x: 80, y: 8 },
          { id: 'c3', type: 'equipment', equipmentType: 'cone', x: 20, y: 56 },
          { id: 'c4', type: 'equipment', equipmentType: 'cone', x: 80, y: 56 },
          // 4 Joueurs en possession (Bleus)
          { id: 'p1', type: 'player', x: 25, y: 32, num: 2, label: 'Latéral', team: 'home' },
          { id: 'p2', type: 'player', x: 50, y: 14, num: 6, label: 'Milieu', team: 'home' },
          { id: 'p3', type: 'player', x: 75, y: 32, num: 8, label: 'Relayeur', team: 'home' },
          { id: 'p4', type: 'player', x: 50, y: 50, num: 10, label: 'Meneur', team: 'home' },
          // 2 Défenseurs (Rouges)
          { id: 'd1', type: 'player', x: 44, y: 30, num: 4, label: 'Déf. 1', team: 'away' },
          { id: 'd2', type: 'player', x: 56, y: 34, num: 5, label: 'Déf. 2', team: 'away' },
          // Flèches de pressing
          { id: 'a1', type: 'arrow', kind: 'movement', fromX: 44, fromY: 30, toX: 34, toY: 31, color: proSemantic.danger },
          { id: 'a2', type: 'arrow', kind: 'movement', fromX: 56, fromY: 34, toX: 66, toY: 33, color: proSemantic.danger },
          // Flèches de passe
          { id: 'pass1', type: 'arrow', kind: 'pass', fromX: 25, fromY: 32, toX: 48, toY: 16, color: proSemantic.info },
          { id: 'pass2', type: 'arrow', kind: 'pass', fromX: 52, fromY: 16, toX: 75, toY: 30, color: proSemantic.info },
          // Ballon
          { id: 'b1', type: 'equipment', equipmentType: 'ball', x: 28, y: 29 },
        ],
        legend: [
          { id: 'leg-1', label: 'Conservation (4 joueurs)', color: proSemantic.info },
          { id: 'leg-2', label: 'Chasseurs (2 récupérateurs)', color: proSemantic.danger },
          { id: 'leg-3', label: 'Trajectoire de passe', color: proSemantic.info },
          { id: 'leg-4', label: 'Pressing défensif', color: proSemantic.danger },
        ],
        stages: [
          {
            id: 'st-1',
            name: 'Étape 1 : 2 touches max',
            instructions: '4 extérieurs contre 2 axiaux. Circulation fluide à 2 touches obligatoires.',
            elements: [],
          },
          {
            id: 'st-2',
            name: 'Étape 2 : Jeu en 1 touche',
            instructions: 'Évolution : 1 touche obligatoire après 3 passes consécutives.',
            elements: [],
          },
        ],
        ownerUid,
        isTemplate: true,
        drillType: 'rondo',
        createdAt: now,
        updatedAt: now,
      };

    case 'finishing':
      return {
        id,
        name: title || 'Finition Face au But & Centres Couloirs',
        objective: 'Coordination offensive du 1er et 2nd poteau sur centre fort',
        instructions:
          'Appel de l’ailier couloir gauche, centre appuyé à ras de terre. Décrochage du numéro 9 au 1er poteau et arrivée du numéro 7 en retrait.',
        pitchTemplate: 'half',
        width: 100,
        height: 64,
        elements: [
          // But officiel
          { id: 'g1', type: 'equipment', equipmentType: 'goal', x: 38, y: 2, width: 24, height: 5, rotation: 0 },
          // Gardien
          { id: 'gk', type: 'player', x: 50, y: 6, num: 1, label: 'Gardien', team: 'gk', role: 'GB' },
          // Mannequins défensifs
          { id: 'm1', type: 'equipment', equipmentType: 'mannequin', x: 42, y: 22 },
          { id: 'm2', type: 'equipment', equipmentType: 'mannequin', x: 58, y: 22 },
          // Ailier gauche
          { id: 'w1', type: 'player', x: 18, y: 36, num: 11, label: 'Ailier G', team: 'home' },
          // Attaquant de pointe
          { id: 'st1', type: 'player', x: 50, y: 48, num: 9, label: 'Buteur', team: 'home' },
          // Milieu offensif arrivant
          { id: 'mo1', type: 'player', x: 68, y: 52, num: 7, label: 'Ailier D', team: 'home' },
          // Ballon à l'ailier
          { id: 'b1', type: 'equipment', equipmentType: 'ball', x: 19, y: 34 },
          // Course de l'ailier vers la ligne de fond
          { id: 'arr1', type: 'arrow', kind: 'dribble', fromX: 18, fromY: 36, toX: 20, toY: 18, color: '#F59E0B' },
          // Centre courbé vers le point de penalty
          { id: 'arr2', type: 'arrow', kind: 'pass', fromX: 20, fromY: 18, toX: 47, toY: 15, controlX: 32, controlY: 14, color: proSemantic.info },
          // Course du 9 vers le premier poteau
          { id: 'arr3', type: 'arrow', kind: 'movement', fromX: 50, fromY: 48, toX: 46, toY: 16, color: proSemantic.success },
          // Tir au but
          { id: 'arr4', type: 'arrow', kind: 'shot', fromX: 46, fromY: 16, toX: 42, toY: 4, color: proSemantic.danger },
        ],
        legend: [
          { id: 'leg-1', label: 'Attaquants', color: proSemantic.info },
          { id: 'leg-2', label: 'Gardien de but', color: '#F59E0B' },
          { id: 'leg-3', label: 'Centre courbé', color: proSemantic.info },
          { id: 'leg-4', label: 'Course d’appel', color: proSemantic.success },
        ],
        ownerUid,
        isTemplate: true,
        drillType: 'finishing',
        createdAt: now,
        updatedAt: now,
      };

    case 'circuit':
      return {
        id,
        name: title || 'Circuit Technique, Slalom & Vivacité',
        objective: 'Coordination motrice, changement d’appui et passe appuyée',
        instructions:
          'Slalom dynamique entre les plots, accélération axiale puis passe au sol vers le partenaire en relais.',
        pitchTemplate: 'half',
        width: 100,
        height: 64,
        elements: [
          // Cones de slalom
          { id: 'c1', type: 'equipment', equipmentType: 'cone', x: 25, y: 24 },
          { id: 'c2', type: 'equipment', equipmentType: 'cone', x: 35, y: 38 },
          { id: 'c3', type: 'equipment', equipmentType: 'cone', x: 45, y: 24 },
          { id: 'c4', type: 'equipment', equipmentType: 'cone', x: 55, y: 38 },
          // Mini but en sortie
          { id: 'mg1', type: 'equipment', equipmentType: 'mini_goal', x: 88, y: 26, width: 6, height: 12 },
          // Joueur début
          { id: 'p1', type: 'player', x: 14, y: 31, num: 6, label: 'Départ', team: 'home' },
          // Joueur relais
          { id: 'p2', type: 'player', x: 80, y: 32, num: 10, label: 'Relais', team: 'home' },
          // Ballon
          { id: 'b1', type: 'equipment', equipmentType: 'ball', x: 16, y: 29 },
          // Slalom courbé
          { id: 'arr1', type: 'arrow', kind: 'dribble', fromX: 14, fromY: 31, toX: 30, toY: 30, controlX: 23, controlY: 17, color: proSemantic.success },
          { id: 'arr2', type: 'arrow', kind: 'dribble', fromX: 30, fromY: 30, toX: 50, toY: 30, controlX: 42, controlY: 42, color: proSemantic.success },
          { id: 'arr3', type: 'arrow', kind: 'pass', fromX: 52, fromY: 30, toX: 78, toY: 32, color: proSemantic.info },
          { id: 'arr4', type: 'arrow', kind: 'shot', fromX: 80, fromY: 32, toX: 88, toY: 32, color: proSemantic.danger },
        ],
        legend: [
          { id: 'leg-1', label: 'Parcours de slalom', color: proSemantic.success },
          { id: 'leg-2', label: 'Transmission relais', color: proSemantic.info },
          { id: 'leg-3', label: 'Plots de vivacité', color: proSemantic.warning },
        ],
        ownerUid,
        isTemplate: true,
        drillType: 'circuit',
        createdAt: now,
        updatedAt: now,
      };

    case 'pressing':
      return {
        id,
        name: title || 'Déclenchement du Pressing Haut en Bloc',
        objective: 'Cadrage immédiat du porteur et fermeture des axes intérieurs',
        instructions:
          'Sur temps de passe du gardien vers le défenseur central gauche, l’ailier déclenche le pressing en incurvant sa course.',
        pitchTemplate: 'half',
        width: 100,
        height: 64,
        elements: [
          // But adverse
          { id: 'g1', type: 'equipment', equipmentType: 'goal', x: 38, y: 2, width: 24, height: 5 },
          // Gardien adverse
          { id: 'gk', type: 'player', x: 50, y: 6, num: 1, label: 'GB Adv', team: 'away' },
          // Défenseurs adverses
          { id: 'd1', type: 'player', x: 26, y: 18, num: 3, label: 'DC Gauche', team: 'away' },
          { id: 'd2', type: 'player', x: 74, y: 18, num: 4, label: 'DC Droit', team: 'away' },
          { id: 'd3', type: 'player', x: 50, y: 24, num: 6, label: '6 Relance', team: 'away' },
          // Nos attaquants en pressing (Bleus)
          { id: 'p1', type: 'player', x: 32, y: 34, num: 7, label: 'Ailier D', team: 'home' },
          { id: 'p2', type: 'player', x: 50, y: 38, num: 9, label: 'Buteur', team: 'home' },
          { id: 'p3', type: 'player', x: 68, y: 34, num: 11, label: 'Ailier G', team: 'home' },
          // Passe relance gardien vers défenseur
          { id: 'pass1', type: 'arrow', kind: 'pass', fromX: 50, fromY: 8, toX: 28, toY: 18, color: proSemantic.danger },
          // Course de pressing incurvée de l'ailier
          { id: 'arr1', type: 'arrow', kind: 'movement', fromX: 32, fromY: 34, toX: 27, toY: 20, controlX: 36, controlY: 24, color: proSemantic.success },
          // Cadrage de l'axe par le 9
          { id: 'arr2', type: 'arrow', kind: 'movement', fromX: 50, fromY: 38, toX: 49, toY: 26, color: proSemantic.success },
        ],
        legend: [
          { id: 'leg-1', label: 'Équipe en pressing', color: proSemantic.info },
          { id: 'leg-2', label: 'Adversaire en relance', color: proSemantic.danger },
          { id: 'leg-3', label: 'Déclenchement du pressing', color: proSemantic.success },
        ],
        ownerUid,
        isTemplate: true,
        drillType: 'pressing',
        createdAt: now,
        updatedAt: now,
      };

    case 'possession':
    default:
      return {
        id,
        name: title || 'Jeu de Position & Transition Défense-Attaque',
        objective: 'Recherche de la supériorité numérique et création d’intervalles',
        instructions:
          'Conservation 5v3 en zone axiale avec 2 jokers en soutien. Transition rapide dès la récupération.',
        pitchTemplate: 'full',
        width: 100,
        height: 64,
        elements: [
          // Zone tactique centrale
          {
            id: 'z1',
            type: 'zone',
            x: 18,
            y: 10,
            width: 64,
            height: 44,
            style: 'dashed',
            color: '#FFFFFF',
            fillOpacity: 0.05,
            label: 'Zone de possession 64x44m',
          },
          // Équipe Bleue (5 joueurs)
          { id: 'p1', type: 'player', x: 22, y: 16, num: 2, label: 'Lat D', team: 'home' },
          { id: 'p2', type: 'player', x: 22, y: 48, num: 3, label: 'Lat G', team: 'home' },
          { id: 'p3', type: 'player', x: 40, y: 32, num: 6, label: 'MDC', team: 'home' },
          { id: 'p4', type: 'player', x: 78, y: 18, num: 7, label: 'Ail D', team: 'home' },
          { id: 'p5', type: 'player', x: 78, y: 46, num: 11, label: 'Ail G', team: 'home' },
          // Équipe Rouge (3 presseurs)
          { id: 'r1', type: 'player', x: 36, y: 26, num: 4, label: 'Bloc', team: 'away' },
          { id: 'r2', type: 'player', x: 36, y: 38, num: 5, label: 'Bloc', team: 'away' },
          { id: 'r3', type: 'player', x: 56, y: 32, num: 9, label: 'Pointe', team: 'away' },
          // Jokers Jaunes
          { id: 'j1', type: 'player', x: 50, y: 12, num: 8, label: 'Joker 1', team: 'neutral' },
          { id: 'j2', type: 'player', x: 50, y: 52, num: 10, label: 'Joker 2', team: 'neutral' },
          // Ballon
          { id: 'b1', type: 'equipment', equipmentType: 'ball', x: 41, y: 31 },
          // Passe
          { id: 'pass1', type: 'arrow', kind: 'pass', fromX: 40, fromY: 32, toX: 50, toY: 14, color: proSemantic.info },
        ],
        legend: [
          { id: 'leg-1', label: 'Possession (Bleus)', color: proSemantic.info },
          { id: 'leg-2', label: 'Bloc Pressant (Rouges)', color: proSemantic.danger },
          { id: 'leg-3', label: 'Jokers d’appui (Jaunes)', color: proSemantic.warning },
        ],
        ownerUid,
        isTemplate: true,
        drillType: 'possession',
        createdAt: now,
        updatedAt: now,
      };
  }
}

/**
 * Duplique un schéma existant en générant de nouveaux identifiants uniques
 * pour le schéma et l'ensemble de ses éléments. Garantit qu'une modification
 * n'impacte jamais l'original.
 */
export function cloneDiagram(
  diagram: ExerciseDiagramData,
  newName?: string,
  newOwnerUid?: string,
): ExerciseDiagramData {
  const now = new Date().toISOString();
  const newId = `diag-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const clonedElements: DiagramElement[] = (diagram.elements || []).map((el, i) => ({
    ...el,
    id: `${el.id}_c${Date.now()}_${i}`,
  }));
  const clonedStages: ExerciseStage[] = (diagram.stages || []).map((st, i) => ({
    ...st,
    id: `stage-${Date.now()}-${i}`,
    elements: (st.elements || []).map((el, j) => ({
      ...el,
      id: `${el.id}_c${Date.now()}_${j}`,
    })),
    legend: st.legend ? st.legend.map((l) => ({ ...l })) : undefined,
  }));

  const clonedAnimation: ExerciseDiagramAnimationData | undefined = diagram.animation
    ? {
        ...diagram.animation,
        stages: (diagram.animation.stages || []).map((st, i) => ({
          ...st,
          id: `anim-st-${Date.now()}-${i}`,
          movements: (st.movements || []).map((m, j) => ({
            ...m,
            id: `anim-mv-${Date.now()}-${j}`,
            from: { ...m.from },
            to: { ...m.to },
            controlPoint: m.controlPoint ? { ...m.controlPoint } : undefined,
          })),
          initialPositions: st.initialPositions
            ? Object.fromEntries(
                Object.entries(st.initialPositions).map(([k, v]) => [k, { ...v }]),
              )
            : undefined,
        })),
      }
    : undefined;

  return {
    ...diagram,
    id: newId,
    name: newName || `${diagram.name} (Copie)`,
    ownerUid: newOwnerUid || diagram.ownerUid,
    isTemplate: false,
    elements: clonedElements,
    stages: clonedStages,
    animation: clonedAnimation,
    backgroundImageUri: diagram.backgroundImageUri,
    backgroundImageOpacity: diagram.backgroundImageOpacity,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Assainit et normalise un schéma brut provenant du stockage ou d'un réseau.
 */
export function normalizeDiagramData(raw: unknown): ExerciseDiagramData {
  if (typeof raw !== 'object' || raw === null) {
    return createEmptyDiagram();
  }
  const r = raw as Partial<ExerciseDiagramData>;
  const template: PitchTemplate =
    r.pitchTemplate === 'full' ||
    r.pitchTemplate === 'half' ||
    r.pitchTemplate === 'box' ||
    r.pitchTemplate === 'blank'
      ? r.pitchTemplate
      : 'half';

  const vb = DIAGRAM_VIEWBOX[template];
  const now = new Date().toISOString();

  const rawElements = Array.isArray(r.elements) ? r.elements : [];
  const elements: DiagramElement[] = rawElements
    .filter((el): el is DiagramElement => typeof el === 'object' && el !== null && typeof (el as DiagramElement).id === 'string')
    .map((el) => {
      // Garantit que les coordonnées sont numériques et bornées
      return {
        ...el,
        x: typeof (el as any).x === 'number' ? Math.max(0, Math.min(vb.width, (el as any).x)) : 50,
        y: typeof (el as any).y === 'number' ? Math.max(0, Math.min(vb.height, (el as any).y)) : 30,
      } as DiagramElement;
    });

  const stages = Array.isArray(r.stages)
    ? r.stages.map((st, i) => ({
        id: String(st?.id || `stage-${i}`),
        name: String(st?.name || `Étape ${i + 1}`),
        instructions: st?.instructions ? String(st.instructions) : undefined,
        elements: Array.isArray(st?.elements) ? (st.elements as DiagramElement[]) : [],
        legend: Array.isArray(st?.legend) ? st.legend : undefined,
      }))
    : [];

  const rawAnim = r.animation;
  const animation: ExerciseDiagramAnimationData | undefined =
    rawAnim && typeof rawAnim === 'object' && Array.isArray(rawAnim.stages)
      ? {
          version: 1,
          loop: rawAnim.loop !== false,
          playbackSpeed: typeof rawAnim.playbackSpeed === 'number' ? rawAnim.playbackSpeed : 1.0,
          autoPauseBetweenStages: Boolean(rawAnim.autoPauseBetweenStages),
          stages: rawAnim.stages.map((st, idx) => ({
            id: String(st?.id || `anim-stage-${idx}`),
            stageIndex: typeof st?.stageIndex === 'number' ? st.stageIndex : idx,
            title: String(st?.title || `Phase ${idx + 1}`),
            instruction: st?.instruction ? String(st.instruction) : undefined,
            durationMs: typeof st?.durationMs === 'number' && st.durationMs > 0 ? st.durationMs : 3000,
            pauseAfterMs: typeof st?.pauseAfterMs === 'number' ? st.pauseAfterMs : 600,
            movements: Array.isArray(st?.movements)
              ? st.movements.map((m, mIdx) => ({
                  id: String(m?.id || `mv-${mIdx}`),
                  elementId: String(m?.elementId || ''),
                  actionType: (m?.actionType || 'run') as any,
                  from: {
                    x: typeof m?.from?.x === 'number' ? m.from.x : 50,
                    y: typeof m?.from?.y === 'number' ? m.from.y : 32,
                  },
                  to: {
                    x: typeof m?.to?.x === 'number' ? m.to.x : 50,
                    y: typeof m?.to?.y === 'number' ? m.to.y : 32,
                  },
                  controlPoint:
                    m?.controlPoint && typeof m.controlPoint.x === 'number' && typeof m.controlPoint.y === 'number'
                      ? { x: m.controlPoint.x, y: m.controlPoint.y }
                      : undefined,
                  startDelayMs: typeof m?.startDelayMs === 'number' ? m.startDelayMs : 0,
                  durationMs: typeof m?.durationMs === 'number' && m.durationMs > 0 ? m.durationMs : 1500,
                  hasBall: Boolean(m?.hasBall),
                  targetElementId: m?.targetElementId ? String(m.targetElementId) : undefined,
                  label: m?.label ? String(m.label) : undefined,
                }))
              : [],
            initialPositions: st?.initialPositions && typeof st.initialPositions === 'object'
              ? st.initialPositions
              : {},
          })),
        }
      : undefined;

  return {
    id: String(r.id || `diag-${Date.now()}`),
    name: String(r.name || 'Schéma d’atelier').trim().slice(0, 100),
    objective: r.objective ? String(r.objective).slice(0, 300) : undefined,
    instructions: r.instructions ? String(r.instructions).slice(0, 1000) : undefined,
    pitchTemplate: template,
    width: vb.width,
    height: vb.height,
    elements,
    legend: Array.isArray(r.legend) ? r.legend : [],
    stages,
    animation,
    backgroundImageUri: r.backgroundImageUri ? String(r.backgroundImageUri) : undefined,
    backgroundImageOpacity: typeof r.backgroundImageOpacity === 'number' ? r.backgroundImageOpacity : undefined,
    currentStageIndex: typeof r.currentStageIndex === 'number' ? r.currentStageIndex : 0,
    ownerUid: String(r.ownerUid || 'coach-local'),
    ownerName: r.ownerName ? String(r.ownerName) : undefined,
    clubId: r.clubId ? String(r.clubId) : undefined,
    teamId: r.teamId ? String(r.teamId) : undefined,
    isSharedWithClub: Boolean(r.isSharedWithClub),
    isSharedWithTeam: Boolean(r.isSharedWithTeam),
    isTemplate: Boolean(r.isTemplate),
    drillType: r.drillType ? String(r.drillType) : undefined,
    createdAt: String(r.createdAt || now),
    updatedAt: String(r.updatedAt || now),
  };
}

export interface UserContextForDiagramPermissions {
  uid: string;
  clubId?: string;
  teamId?: string;
  isAdmin?: boolean;
}

/**
 * Vérifie si l'utilisateur a le droit de visualiser le schéma.
 */
export function canViewDiagram(
  diagram: ExerciseDiagramData,
  user: UserContextForDiagramPermissions,
): boolean {
  if (user.isAdmin) return true;
  if (diagram.isTemplate) return true;
  if (diagram.ownerUid === user.uid) return true;
  if (diagram.isSharedWithClub && diagram.clubId && diagram.clubId === user.clubId) return true;
  if (diagram.isSharedWithTeam && diagram.teamId && diagram.teamId === user.teamId) return true;
  return false;
}

/**
 * Vérifie si l'utilisateur a le droit de modifier le schéma.
 */
export function canEditDiagram(
  diagram: ExerciseDiagramData,
  user: UserContextForDiagramPermissions,
): boolean {
  if (user.isAdmin) return true;
  // Les templates système sont en lecture seule : il faut les dupliquer pour les modifier.
  if (diagram.isTemplate && diagram.ownerUid !== user.uid) return false;
  return diagram.ownerUid === user.uid;
}
