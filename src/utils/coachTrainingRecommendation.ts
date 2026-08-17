import type { WellnessSignals } from '../models/SmartTactics';
import type { TeamEvent } from '../models/TeamEvent';
import type { User } from '../models/User';
import { countRsvpYes } from '../models/TeamEvent';
import type { CoachAiAction } from './coachAiInsights';
import {
  buildCoachAiStrategy,
  type CoachAiInsightsInput,
} from './coachAiInsights';
import {
  findLatestPostMatchAnalysis,
  type PostMatchAnalysis,
} from './coachPostMatchAnalysis';

export type RecommendedSessionDifficulty = 'facile' | 'moyen' | 'difficile';
export type RecommendedSessionConfidence = 'high' | 'low' | 'none';

export interface RecommendedSessionBlock {
  label: string;
  minutes: number;
  objective?: string;
  material?: string;
}

export interface RecommendedTrainingSession {
  title: string;
  totalMinutes: number;
  focus: string;
  blocks: RecommendedSessionBlock[];
  playerCount?: number;
  difficulty: RecommendedSessionDifficulty;
  dataConfidence: RecommendedSessionConfidence;
  reason: string;
}

export interface CoachTrainingRecommendationInput extends CoachAiInsightsInput {
  postMatchAnalysis?: PostMatchAnalysis | null;
}

function wellnessConcern(w?: WellnessSignals): boolean {
  if (!w) return false;
  if (w.injured || w.suspended) return true;
  if (typeof w.fatigue === 'number' && w.fatigue >= 7) return true;
  if (typeof w.recovery === 'number' && w.recovery <= 4) return true;
  if (typeof w.pain === 'number' && w.pain >= 5) return true;
  if (typeof w.wellness_score === 'number' && w.wellness_score <= 4) return true;
  return false;
}

function isMatchEvent(e: TeamEvent): boolean {
  return (
    e.event_type === 'friendly' ||
    e.event_type === 'competition' ||
    e.event_type === 'tournament'
  );
}

function hasSheetData(events: TeamEvent[]): boolean {
  return events.some(
    (e) => e.player_match_stats && Object.keys(e.player_match_stats).length > 0,
  );
}

type FocusKey =
  | 'finition'
  | 'discipline'
  | 'transitions'
  | 'collective'
  | 'recovery'
  | 'generic';

function inferFocusKey(
  postMatch: PostMatchAnalysis | null | undefined,
  improvements: string[],
  wellnessAlerts: number,
  memberCount: number,
  hasSheets: boolean,
): { key: FocusKey; reason: string; confidence: RecommendedSessionConfidence } {
  if (postMatch && postMatch.level !== 'none') {
    const all = [...postMatch.improvements, postMatch.nextMatchRecommendation].join(' ');
    if (/finition/i.test(all)) {
      return {
        key: 'finition',
        reason: `Basé sur l’analyse post-match « ${postMatch.title} » — finition à travailler.`,
        confidence: postMatch.level === 'ready' ? 'high' : 'low',
      };
    }
    if (/discipline|carton|comportement/i.test(all)) {
      return {
        key: 'discipline',
        reason: `Basé sur l’analyse post-match « ${postMatch.title} » — discipline à renforcer.`,
        confidence: postMatch.level === 'ready' ? 'high' : 'low',
      };
    }
    if (/transitions|pressing|compacité|dynamique/i.test(all)) {
      return {
        key: 'transitions',
        reason: `Basé sur l’analyse post-match « ${postMatch.title} » — ${postMatch.nextMatchRecommendation}`,
        confidence: postMatch.level === 'ready' ? 'high' : 'low',
      };
    }
    if (improvements.some((i) => /niveau collectif|note moy/i.test(i))) {
      return {
        key: 'collective',
        reason: `Basé sur l’analyse post-match « ${postMatch.title} » — remise en route collective.`,
        confidence: postMatch.level === 'ready' ? 'high' : 'low',
      };
    }
    if (postMatch.positives.length >= 2) {
      return {
        key: 'transitions',
        reason: `Capitaliser sur la dynamique du match « ${postMatch.title} » — ${postMatch.nextMatchRecommendation}`,
        confidence: 'low',
      };
    }
  }

  if (wellnessAlerts >= 2 && memberCount > 0) {
    return {
      key: 'recovery',
      reason: `${wellnessAlerts} alerte${wellnessAlerts > 1 ? 's' : ''} forme — séance adaptée à la récupération.`,
      confidence: 'low',
    };
  }

  if (hasSheets) {
    return {
      key: 'transitions',
      reason: 'Basé sur vos feuilles de match récentes — travail des transitions et du jeu réduit.',
      confidence: 'low',
    };
  }

  return {
    key: 'generic',
    reason:
      'Données limitées — séance type pour démarrer. Validez une feuille de match pour affiner le contenu.',
    confidence: 'none',
  };
}

const FOCUS_TEMPLATES: Record<
  FocusKey,
  { focus: string; difficulty: RecommendedSessionDifficulty; blocks: RecommendedSessionBlock[] }
> = {
  finition: {
    focus: 'Finition et dernier tiers',
    difficulty: 'moyen',
    blocks: [
      { label: 'Échauffement', minutes: 10, objective: 'Mobilité + activation', material: 'Cônes' },
      {
        label: 'Exercice technique',
        minutes: 15,
        objective: 'Contrôle orienté + finition 1 touche',
        material: 'Mini-buts, ballons',
      },
      {
        label: 'Transitions offensives',
        minutes: 20,
        objective: 'Récupération → projection rapide vers le but',
        material: 'Cônes, chasubles',
      },
      {
        label: 'Jeu réduit',
        minutes: 20,
        objective: 'Finition sous pression en 4v4+2',
        material: 'Chasubles, mini-buts',
      },
      {
        label: 'Retour au calme',
        minutes: 10,
        objective: 'Étirements + débrief court',
        material: 'Tapis (optionnel)',
      },
    ],
  },
  discipline: {
    focus: 'Discipline et gestion du contact',
    difficulty: 'moyen',
    blocks: [
      { label: 'Échauffement', minutes: 10, objective: 'Activation sans contact', material: 'Cônes' },
      {
        label: 'Exercice technique',
        minutes: 15,
        objective: 'Duels propres — timing et distance',
        material: 'Chasubles',
      },
      {
        label: 'Situations réflexes',
        minutes: 20,
        objective: 'Gestion émotionnelle après faute ou carton simulé',
        material: 'Sifflet (coach)',
      },
      {
        label: 'Jeu réduit',
        minutes: 20,
        objective: 'Match 5v5 avec règles strictes de contact',
        material: 'Chasubles, mini-buts',
      },
      { label: 'Retour au calme', minutes: 10, objective: 'Retour au calme collectif', material: '—' },
    ],
  },
  transitions: {
    focus: 'Transitions défensives',
    difficulty: 'difficile',
    blocks: [
      { label: 'Échauffement', minutes: 10, objective: 'Course + changements de direction', material: 'Cônes' },
      {
        label: 'Exercice technique',
        minutes: 15,
        objective: 'Passes sous pression + relance',
        material: 'Ballons, chasubles',
      },
      {
        label: 'Transitions',
        minutes: 20,
        objective: 'Perte de balle → repli en 5 secondes',
        material: 'Cônes, 2 buts',
      },
      {
        label: 'Jeu réduit',
        minutes: 20,
        objective: '8v8 — récupération et contre-pressing',
        material: 'Chasubles, buts',
      },
      { label: 'Retour au calme', minutes: 10, objective: 'Étirements dynamiques', material: '—' },
    ],
  },
  collective: {
    focus: 'Remise en route collective',
    difficulty: 'moyen',
    blocks: [
      { label: 'Échauffement', minutes: 12, objective: 'Rondo + mobilité', material: 'Ballons' },
      {
        label: 'Exercice technique',
        minutes: 15,
        objective: 'Conservation et passes en triangle',
        material: 'Cônes',
      },
      {
        label: 'Bloc tactique',
        minutes: 18,
        objective: 'Compacité et déplacement collectif',
        material: 'Chasubles, cônes',
      },
      {
        label: 'Jeu réduit',
        minutes: 20,
        objective: 'Opposé 7v7 — respect du bloc',
        material: 'Chasubles, buts',
      },
      { label: 'Retour au calme', minutes: 10, objective: 'Retour au calme', material: '—' },
    ],
  },
  recovery: {
    focus: 'Récupération active',
    difficulty: 'facile',
    blocks: [
      { label: 'Échauffement', minutes: 10, objective: 'Marche + mobilité articulaire', material: '—' },
      {
        label: 'Circuit léger',
        minutes: 15,
        objective: 'Technique à faible intensité',
        material: 'Ballons',
      },
      {
        label: 'Jeu réduit',
        minutes: 20,
        objective: '4v4 sans contact — plaisir et touches de balle',
        material: 'Mini-buts',
      },
      {
        label: 'Récupération',
        minutes: 15,
        objective: 'Étirements + respiration',
        material: 'Tapis (optionnel)',
      },
      { label: 'Retour au calme', minutes: 10, objective: 'Hydratation + débrief', material: '—' },
    ],
  },
  generic: {
    focus: 'Séance polyvalente',
    difficulty: 'moyen',
    blocks: [
      { label: 'Échauffement', minutes: 10, objective: 'Activation dynamique', material: 'Cônes' },
      {
        label: 'Exercice technique',
        minutes: 15,
        objective: 'Passes et contrôle orienté',
        material: 'Ballons',
      },
      {
        label: 'Transitions',
        minutes: 20,
        objective: 'Principes offensifs et défensifs',
        material: 'Chasubles, cônes',
      },
      {
        label: 'Jeu réduit',
        minutes: 20,
        objective: 'Match 5v5 ou 7v7',
        material: 'Chasubles, buts',
      },
      { label: 'Retour au calme', minutes: 10, objective: 'Étirements', material: '—' },
    ],
  },
};

function estimatePlayerCount(
  events: TeamEvent[],
  members: User[],
): number | undefined {
  const now = Date.now();
  const nextTraining = [...events]
    .filter((e) => e.starts_at.getTime() > now && e.event_type === 'training')
    .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime())[0];
  if (nextTraining) {
    const yes = countRsvpYes(nextTraining);
    if (yes > 0) return yes;
  }
  return members.length > 0 ? members.length : undefined;
}

/** Prochain créneau d’entraînement par défaut (lendemain 18h30, évite le dimanche). */
export function defaultRecommendedSessionStart(from = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + 1);
  d.setHours(18, 30, 0, 0);
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d;
}

/** Notes structurées pour session_plan.notes. */
export function formatRecommendedSessionNotes(session: RecommendedTrainingSession): string {
  const header = `Focus : ${session.focus}\n${session.reason}\n`;
  const lines = session.blocks.map((b) => {
    const parts = [`• ${b.label} (${b.minutes} min)`];
    if (b.objective) parts.push(` — ${b.objective}`);
    if (b.material && b.material !== '—') parts.push(` [${b.material}]`);
    return parts.join('');
  });
  return `${header}\n${lines.join('\n')}`;
}

/** Séance recommandée — déterministe, jamais inventée sans signal réel. */
export function buildRecommendedSession(
  input: CoachTrainingRecommendationInput,
): RecommendedTrainingSession {
  const { events, members, wellnessByUid = {}, hasClub } = input;
  const postMatch =
    input.postMatchAnalysis ??
    (hasClub ? findLatestPostMatchAnalysis(events, members) : null);

  const wellnessAlerts = members.filter((m) => wellnessConcern(wellnessByUid[m.uid])).length;
  const sheets = hasSheetData(events.filter((e) => isMatchEvent(e) && e.starts_at.getTime() < Date.now()));

  const { key, reason, confidence } = inferFocusKey(
    postMatch,
    postMatch?.improvements ?? [],
    wellnessAlerts,
    members.length,
    sheets,
  );

  const template = FOCUS_TEMPLATES[key];
  const totalMinutes = template.blocks.reduce((n, b) => n + b.minutes, 0);
  const playerCount = estimatePlayerCount(events, members);

  let difficulty = template.difficulty;
  if (wellnessAlerts >= 3) difficulty = 'facile';
  else if (playerCount != null && playerCount >= 16 && key === 'transitions') difficulty = 'difficile';

  const strategy = buildCoachAiStrategy(input);
  if (confidence === 'none' && strategy.trainingFocus) {
    return {
      title: `Séance recommandée — ${totalMinutes} min`,
      totalMinutes,
      focus: strategy.trainingFocus,
      blocks: FOCUS_TEMPLATES.generic.blocks,
      playerCount,
      difficulty: 'moyen',
      dataConfidence: 'low',
      reason: `Basé sur la prochaine convocation — ${strategy.trainingFocus}.`,
    };
  }

  return {
    title: `Séance recommandée — ${totalMinutes} min`,
    totalMinutes,
    focus: template.focus,
    blocks: template.blocks,
    playerCount,
    difficulty,
    dataConfidence: confidence,
    reason,
  };
}

/** Indique si une action « planifier séance » est pertinente. */
export function shouldSurfaceRecommendedSession(
  actions: CoachAiAction[],
  events: TeamEvent[],
): boolean {
  const now = Date.now();
  const upcomingTraining = events.some(
    (e) => e.event_type === 'training' && e.starts_at.getTime() > now,
  );
  if (!upcomingTraining) return true;
  return actions.some((a) => a.id === 'plan-session');
}
