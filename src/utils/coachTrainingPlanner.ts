/**
 * Planificateur de séance — **modèle pur**, extrait de l'écran pour être
 * testé sans React Native. La bibliothèque d'ateliers est reprise telle
 * quelle (le contenu pédagogique était bon) ; les dérivations d'affichage
 * (durée totale, intensité dominante) et la conversion des plans Copilote
 * sont ici, jamais dans l'écran.
 */

import type { DrillType } from '../components/coach/CoachTrainingDrillDiagram';
import type { CoachComposedPlan } from './coachTrainingRecommendation';
import type { TrainingPhase } from '../models/TrainingSession';
import { cloneDiagram, type ExerciseDiagramData, type ExerciseStage } from '../models/ExerciseDiagram';

export type SessionIntensity = 'low' | 'medium' | 'high';

export interface SessionExercise {
  id: string;
  name: string;
  durationMin: number;
  drillType: DrillType;
  intensity: SessionIntensity;
  playerCount: number;
  objective: string;
  instructions: string;
  thematic?: string;
  diagram?: ExerciseDiagramData;
  stages?: ExerciseStage[];
}

export interface ThematicDrillTemplate {
  id: string;
  theme: 'all' | 'activation' | 'rondo' | 'circuit' | 'finishing' | 'pressing' | 'set_pieces';
  themeLabel: string;
  name: string;
  durationMin: number;
  drillType: DrillType;
  intensity: SessionIntensity;
  playerCount: number;
  objective: string;
  instructions: string;
  diagram?: ExerciseDiagramData;
  stages?: ExerciseStage[];
}

export const THEMATIC_DRILLS_LIBRARY: ThematicDrillTemplate[] = [
  // 1. Échauffement & Activation
  {
    id: 'th-act-1',
    theme: 'activation',
    themeLabel: 'Échauffement',
    name: 'Activation Neuro-Musculaire & Appuis Dynamiques',
    durationMin: 15,
    drillType: 'generic',
    intensity: 'low',
    playerCount: 18,
    objective: 'Mise en route cardiovasculaire et gammes athlétiques progressives',
    instructions:
      'Courses progressives, déverrouillage articulaire, appuis dynamiques et étirements actifs.',
  },
  {
    id: 'th-act-2',
    theme: 'activation',
    themeLabel: 'Échauffement',
    name: 'Passe & Suit Vivacité Décisionnelle',
    durationMin: 12,
    drillType: 'circuit',
    intensity: 'medium',
    playerCount: 14,
    objective: 'Vitesse de transmission et orientation corporelle avant contrôle',
    instructions:
      'Circuit carré 12x12m. Passes courtes appuyées, changements de rythme et appels dans les intervalles.',
  },
  // 2. Rondos & Conservation
  {
    id: 'th-ron-1',
    theme: 'rondo',
    themeLabel: 'Rondos',
    name: 'Rondo 4v2 Espaces Réduits à 2 Touches',
    durationMin: 20,
    drillType: 'rondo',
    intensity: 'medium',
    playerCount: 6,
    objective: 'Conservation sous pressing et orientation du corps',
    instructions:
      'Zone 15x15m. 4 joueurs en périphérie à 2 touches max. 2 chasseurs au centre. Si interception, permutation.',
  },
  {
    id: 'th-ron-2',
    theme: 'rondo',
    themeLabel: 'Rondos',
    name: 'Rondo 5v2 avec Appui Central & Transition',
    durationMin: 18,
    drillType: 'rondo',
    intensity: 'medium',
    playerCount: 7,
    objective: 'Fixer à l’intérieur pour libérer la périphérie',
    instructions:
      'Zone 18x18m. Recherche prioritaire de la passe cassant la ligne des 2 récupérateurs.',
  },
  // 3. Sortie de Balle & Circuits
  {
    id: 'th-cir-1',
    theme: 'circuit',
    themeLabel: 'Circuits',
    name: 'Sortie de Balle depuis le 6m & Dézonage Piston',
    durationMin: 25,
    drillType: 'circuit',
    intensity: 'high',
    playerCount: 11,
    objective: 'Décrochage du milieu sentinelle et projection du latéral',
    instructions:
      'Relance gardien au pied, appel du 6 dans la boîte, relais vers le latéral lancé.',
  },
  {
    id: 'th-cir-2',
    theme: 'circuit',
    themeLabel: 'Circuits',
    name: 'Circuit Déviation Axiale & Troisième Homme',
    durationMin: 20,
    drillType: 'circuit',
    intensity: 'medium',
    playerCount: 12,
    objective: 'Combinaisons rapides en une touche sur appui-soutien',
    instructions:
      'Passe verticale vers le 9 dos au but, remise en une touche vers le milieu qui lance l’ailier opposé.',
  },
  // 4. Finition & Couloirs
  {
    id: 'th-fin-1',
    theme: 'finishing',
    themeLabel: 'Finition',
    name: 'Centres au Cordeau & Coordination 1er / 2nd Poteau',
    durationMin: 25,
    drillType: 'finishing',
    intensity: 'high',
    playerCount: 10,
    objective: 'Attaque synchronisée des zones de finition dans la surface',
    instructions:
      'Passe axiale vers l’ailier lancé. Centre fort à ras de terre ou au 2nd poteau. Attaque conjointe du BU et du MO.',
  },
  {
    id: 'th-fin-2',
    theme: 'finishing',
    themeLabel: 'Finition',
    name: 'Frappes Sous Pression en Entrée de Surface 2v1',
    durationMin: 20,
    drillType: 'finishing',
    intensity: 'high',
    playerCount: 8,
    objective: 'Spontanéité de frappe et élimination en vitesse',
    instructions:
      'Duel offensif à 20 mètres. Prise de risque rapide sous la pression d’un défenseur en retard.',
  },
  // 5. Pressing & Bloc équipe
  {
    id: 'th-pre-1',
    theme: 'pressing',
    themeLabel: 'Pressing',
    name: 'Pressing Haut Coordonné sur Passe Latérale',
    durationMin: 22,
    drillType: 'pressing',
    intensity: 'high',
    playerCount: 14,
    objective: 'Déclenchement synchronisé du pressing sur temps de passe',
    instructions:
      'Dès que le défenseur adverse joue vers son latéral, l’ailier bloque l’extérieur et le milieu cadre l’axe.',
  },
  {
    id: 'th-pre-2',
    theme: 'pressing',
    themeLabel: 'Pressing',
    name: 'Coulissement Défensif en Bloc Médian 4-4-2',
    durationMin: 20,
    drillType: 'possession',
    intensity: 'medium',
    playerCount: 16,
    objective: 'Compacité axiale et gestion de la profondeur',
    instructions:
      'Terrain réduit. L’équipe en bloc doit coulisser sans se faire traverser entre les lignes.',
  },
  // 6. Coups de Pied Arrêtés
  {
    id: 'th-set-1',
    theme: 'set_pieces',
    themeLabel: 'Coups Arrêtés',
    name: 'Corners Offensifs : Blocage Premier Poteau & Déviation',
    durationMin: 15,
    drillType: 'finishing',
    intensity: 'medium',
    playerCount: 18,
    objective: 'Création d’espace pour l’attaquant lancé au second poteau',
    instructions:
      'Tireur rentrant. Deux joueurs créent le blocage au premier poteau pour libérer le point de penalty.',
  },
];

/** Séance d'ouverture — un squelette sensé, modifiable à volonté. */
export function defaultSession(): SessionExercise[] {
  return [
    fromTemplate(THEMATIC_DRILLS_LIBRARY[0]),
    fromTemplate(THEMATIC_DRILLS_LIBRARY[2]),
    fromTemplate(THEMATIC_DRILLS_LIBRARY[6]),
    {
      id: 'ex-opposition',
      name: 'Opposition Dirigée 8v8 + 2 Jokers Flottants',
      durationMin: 20,
      drillType: 'possession',
      intensity: 'high',
      playerCount: 18,
      objective: 'Animation offensive et recherche du surnombre',
      instructions:
        'Terrain réduit (surface à surface). Obligation de passer par un couloir avant de finaliser dans l’axe.',
      thematic: 'opposition',
    },
    {
      id: 'ex-recup',
      name: 'Retour au Calme & Débriefing Collectif',
      durationMin: 10,
      drillType: 'generic',
      intensity: 'low',
      playerCount: 18,
      objective: 'Récupération active et fixation des objectifs match',
      instructions:
        'Trottinage souple, travail de respiration guidée et rappel des consignes pour dimanche.',
      thematic: 'recup',
    },
  ];
}

/** Instancie un atelier de la bibliothèque avec un identifiant unique. */
export function fromTemplate(template: ThematicDrillTemplate, index = Date.now()): SessionExercise {
  return {
    ...template,
    id: `drill-${index}-${template.id}`,
    diagram: template.diagram ? cloneDiagram(template.diagram) : undefined,
    stages: template.stages ? template.stages.map((st) => ({ ...st })) : undefined,
  };
}

/** Résumé dérivé de la séance — tout ce que l'en-tête affiche, rien d'inventé. */
export function sessionSummary(exercises: SessionExercise[]): {
  totalMin: number;
  count: number;
  dominant: SessionIntensity | null;
} {
  const totalMin = exercises.reduce((acc, e) => acc + e.durationMin, 0);
  const counts: Record<SessionIntensity, number> = { low: 0, medium: 0, high: 0 };
  for (const e of exercises) counts[e.intensity] += 1;
  const dominant =
    exercises.length === 0
      ? null
      : counts.high >= counts.medium && counts.high >= counts.low
        ? 'high'
        : counts.medium >= counts.low
          ? 'medium'
          : 'low';
  return { totalMin, count: exercises.length, dominant };
}

export const INTENSITY_LABELS: Record<SessionIntensity, string> = {
  low: 'Légère',
  medium: 'Modérée',
  high: 'Intense',
};

/** Devine le type d'atelier depuis un libellé de phase Copilote. */
function drillTypeFromLabel(label: string): DrillType {
  const needle = label.toLowerCase();
  if (needle.includes('rondo')) return 'rondo';
  if (needle.includes('press')) return 'pressing';
  if (needle.includes('finition') || needle.includes('frappe') || needle.includes('tir'))
    return 'finishing';
  if (needle.includes('possession') || needle.includes('conservation')) return 'possession';
  if (needle.includes('circuit') || needle.includes('parcours')) return 'circuit';
  return 'generic';
}

function intensityFromPhase(name: string): SessionIntensity {
  if (name === 'warmup' || name === 'cooldown') return 'low';
  if (name === 'game') return 'high';
  return 'medium';
}

/**
 * Séance depuis une réponse **Copilote cloud** — les phases du service
 * deviennent des ateliers modifiables ; rien n'est déduit au-delà de ce que
 * la réponse contient.
 */
export function sessionExercisesFromPhases(
  phases: TrainingPhase[],
  opts: { playerCount: number },
): SessionExercise[] {
  return phases.map((phase, i) => ({
    id: `ai-${Date.now()}-${i}`,
    name: phase.label || phase.name,
    durationMin: Math.max(5, phase.duration_min),
    drillType: drillTypeFromLabel(phase.label || phase.name),
    intensity: intensityFromPhase(phase.name),
    playerCount: opts.playerCount,
    objective:
      phase.exercises[0]?.description || phase.exercises.map((e) => e.name).join(', ') || '',
    instructions:
      phase.exercises.map((e) => e.name).join(' · ') || phase.exercises[0]?.description || '',
  }));
}

/**
 * Séance depuis un **brouillon local** du Copilote — le même fallback que le
 * reste du pôle quand le cloud n'est pas disponible.
 */
export function sessionExercisesFromPlan(
  plan: CoachComposedPlan,
  opts: { playerCount: number },
): SessionExercise[] {
  return plan.blocks.map((block, i) => ({
    id: `ai-${Date.now()}-${i}`,
    name: block.label,
    durationMin: Math.max(5, block.minutes),
    drillType: drillTypeFromLabel(block.label),
    intensity: i === 0 ? 'low' : i === plan.blocks.length - 1 ? 'low' : 'medium',
    playerCount: opts.playerCount,
    objective: block.objective || plan.focus,
    instructions: block.material || '',
  }));
}
