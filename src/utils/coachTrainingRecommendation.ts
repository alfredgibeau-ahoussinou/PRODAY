import type { WellnessSignals } from '../models/SmartTactics';
import type { TeamEvent } from '../models/TeamEvent';
import type { User } from '../models/User';
import { countRsvpYes } from '../models/TeamEvent';
import type { CoachAiInsightsInput } from './coachAiInsights';
import {
  findLatestPostMatchAnalysis,
  type PostMatchAnalysis,
} from './coachPostMatchAnalysis';

export type CoachSessionContext = 'training' | 'match';
export type CoachTrainingArchetype =
  | 'technical'
  | 'tactical'
  | 'physical'
  | 'recovery'
  | 'collective';
export type CoachMatchPrepArchetype =
  | 'activation'
  | 'tactical_brief'
  | 'set_pieces'
  | 'opponent_focus';

export type RecommendedSessionDifficulty = 'facile' | 'moyen' | 'difficile';
export type RecommendedSessionConfidence = 'high' | 'low' | 'none';

export interface CoachComposedPlanBlock {
  label: string;
  minutes: number;
  objective?: string;
  material?: string;
}

export interface CoachComposedPlan {
  context: CoachSessionContext;
  archetype: CoachTrainingArchetype | CoachMatchPrepArchetype | 'empty';
  title: string;
  focus: string;
  reason: string;
  totalMinutes: number;
  blocks: CoachComposedPlanBlock[];
  difficulty: RecommendedSessionDifficulty;
  dataConfidence: RecommendedSessionConfidence;
  playerCount?: number;
  targetEventId?: string;
}

export interface CoachCalendarContext {
  nextTraining: TeamEvent | null;
  nextMatch: TeamEvent | null;
  primary: CoachSessionContext;
  primaryEvent: TeamEvent | null;
}

export interface CoachComposedPlanInput extends CoachAiInsightsInput {
  postMatchAnalysis?: PostMatchAnalysis | null;
  /** Événement cible explicite (planning) — sinon déduit du calendrier. */
  targetEvent?: TeamEvent | null;
}

const MATCH_PREP_HOURS = 72;
const RECOVERY_AFTER_MATCH_HOURS = 48;

function isMatchEvent(e: TeamEvent): boolean {
  return (
    e.event_type === 'friendly' ||
    e.event_type === 'competition' ||
    e.event_type === 'tournament'
  );
}

function isTrainingEvent(e: TeamEvent): boolean {
  return e.event_type === 'training' || e.event_type === 'other';
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

function hasSheetData(events: TeamEvent[]): boolean {
  return events.some(
    (e) => e.player_match_stats && Object.keys(e.player_match_stats).length > 0,
  );
}

function lastPastMatch(events: TeamEvent[]): TeamEvent | null {
  const now = Date.now();
  return (
    [...events]
      .filter((e) => isMatchEvent(e) && e.starts_at.getTime() < now)
      .sort((a, b) => b.starts_at.getTime() - a.starts_at.getTime())[0] ?? null
  );
}

function hoursUntil(date: Date, from = Date.now()): number {
  return (date.getTime() - from) / 3_600_000;
}

function hoursSince(date: Date, from = Date.now()): number {
  return (from - date.getTime()) / 3_600_000;
}

function opponentLabel(event: TeamEvent | null): string | undefined {
  if (!event) return undefined;
  return event.live_state?.opponent_name?.trim() || event.title?.trim() || undefined;
}

function estimatePlayerCount(events: TeamEvent[], members: User[]): number | undefined {
  const now = Date.now();
  const ctx = resolveCoachCalendarContext(events);
  const ref = ctx.primaryEvent ?? ctx.nextTraining ?? ctx.nextMatch;
  if (ref) {
    const yes = countRsvpYes(ref);
    if (yes > 0) return yes;
  }
  const nextTraining = [...events]
    .filter((e) => e.starts_at.getTime() > now && isTrainingEvent(e))
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

/** Calendrier coach — primary = le plus proche ; égalité → match prioritaire. */
export function resolveCoachCalendarContext(events: TeamEvent[]): CoachCalendarContext {
  const now = Date.now();
  const upcoming = events.filter((e) => e.starts_at.getTime() > now);

  const nextTraining =
    [...upcoming]
      .filter(isTrainingEvent)
      .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime())[0] ?? null;

  const nextMatch =
    [...upcoming]
      .filter(isMatchEvent)
      .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime())[0] ?? null;

  if (!nextTraining && !nextMatch) {
    return {
      nextTraining: null,
      nextMatch: null,
      primary: 'training',
      primaryEvent: null,
    };
  }
  if (!nextTraining) {
    return {
      nextTraining: null,
      nextMatch,
      primary: 'match',
      primaryEvent: nextMatch,
    };
  }
  if (!nextMatch) {
    return {
      nextTraining,
      nextMatch: null,
      primary: 'training',
      primaryEvent: nextTraining,
    };
  }

  const tTrain = nextTraining.starts_at.getTime();
  const tMatch = nextMatch.starts_at.getTime();
  if (tMatch < tTrain) {
    return { nextTraining, nextMatch, primary: 'match', primaryEvent: nextMatch };
  }
  if (tTrain < tMatch) {
    return { nextTraining, nextMatch, primary: 'training', primaryEvent: nextTraining };
  }
  return { nextTraining, nextMatch, primary: 'match', primaryEvent: nextMatch };
}

const TRAINING_TEMPLATES: Record<
  CoachTrainingArchetype,
  {
    focus: string;
    difficulty: RecommendedSessionDifficulty;
    blocks: CoachComposedPlanBlock[];
  }
> = {
  technical: {
    focus: 'Technique individuelle et finition',
    difficulty: 'moyen',
    blocks: [
      { label: 'Échauffement', minutes: 10, objective: 'Mobilité + touches de balle', material: 'Cônes' },
      {
        label: 'Atelier technique',
        minutes: 18,
        objective: 'Contrôle orienté, passes courtes sous pression',
        material: 'Ballons, mini-buts',
      },
      {
        label: 'Finition',
        minutes: 20,
        objective: 'Dernier tiers — 1 touche et reprise',
        material: 'Mini-buts, chasubles',
      },
      {
        label: 'Jeu réduit',
        minutes: 18,
        objective: '4v4+2 — finition sous pression',
        material: 'Chasubles',
      },
      { label: 'Retour au calme', minutes: 10, objective: 'Étirements + débrief', material: '—' },
    ],
  },
  tactical: {
    focus: 'Bloc tactique et organisation',
    difficulty: 'difficile',
    blocks: [
      { label: 'Échauffement', minutes: 10, objective: 'Activation + consignes du jour', material: 'Cônes' },
      {
        label: 'Situations tactiques',
        minutes: 22,
        objective: 'Compacité, déplacements et couvertures',
        material: 'Chasubles, cônes',
      },
      {
        label: 'Opposé réduit',
        minutes: 22,
        objective: '8v8 — respect du plan collectif',
        material: 'Chasubles, buts',
      },
      {
        label: 'Consignes match',
        minutes: 12,
        objective: 'Reprise des principes pour le prochain match',
        material: 'Tableau (optionnel)',
      },
      { label: 'Retour au calme', minutes: 10, objective: 'Retour au calme', material: '—' },
    ],
  },
  physical: {
    focus: 'Charge physique contrôlée',
    difficulty: 'moyen',
    blocks: [
      { label: 'Échauffement', minutes: 12, objective: 'Course progressive + mobilité', material: 'Cônes' },
      {
        label: 'Circuit athlétique',
        minutes: 20,
        objective: 'Intermittent court, changements de direction',
        material: 'Cônes, plots',
      },
      {
        label: 'Duels et transitions',
        minutes: 18,
        objective: 'Efforts répétés avec récupération active',
        material: 'Chasubles',
      },
      {
        label: 'Jeu réduit intensif',
        minutes: 15,
        objective: '5v5 — rythme élevé',
        material: 'Mini-buts',
      },
      { label: 'Retour au calme', minutes: 10, objective: 'Étirements dynamiques', material: '—' },
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
        objective: '4v4 sans contact — plaisir et touches',
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
  collective: {
    focus: 'Remise en route collective',
    difficulty: 'moyen',
    blocks: [
      { label: 'Échauffement', minutes: 12, objective: 'Rondo + mobilité', material: 'Ballons' },
      {
        label: 'Conservation',
        minutes: 15,
        objective: 'Passes en triangle et third man',
        material: 'Cônes',
      },
      {
        label: 'Bloc collectif',
        minutes: 18,
        objective: 'Compacité et déplacements synchronisés',
        material: 'Chasubles, cônes',
      },
      {
        label: 'Opposé',
        minutes: 20,
        objective: '7v7 — respect du bloc',
        material: 'Chasubles, buts',
      },
      { label: 'Retour au calme', minutes: 10, objective: 'Retour au calme', material: '—' },
    ],
  },
};

const MATCH_PREP_TEMPLATES: Record<
  CoachMatchPrepArchetype,
  {
    focus: string;
    difficulty: RecommendedSessionDifficulty;
    blocks: CoachComposedPlanBlock[];
  }
> = {
  activation: {
    focus: 'Activation pré-match',
    difficulty: 'facile',
    blocks: [
      { label: 'Activation légère', minutes: 12, objective: 'Mobilité, passes courtes, montée progressive', material: 'Ballons' },
      {
        label: 'Rondo dynamique',
        minutes: 10,
        objective: 'Prise de confiance collective',
        material: 'Cônes',
      },
      {
        label: 'Finitions courtes',
        minutes: 10,
        objective: '2–3 séries rapides vers le but',
        material: 'Mini-buts',
      },
      {
        label: 'Échauffement gardien',
        minutes: 8,
        objective: 'Réflexes et relances si GB présent',
        material: 'Gants (optionnel)',
      },
      { label: 'Brief collectif', minutes: 10, objective: 'Consignes finales avant le vestiaire', material: '—' },
    ],
  },
  tactical_brief: {
    focus: 'Causerie et consignes collectives',
    difficulty: 'moyen',
    blocks: [
      { label: 'Activation', minutes: 10, objective: 'Échauffement court sans fatigue', material: 'Ballons' },
      {
        label: 'Causerie tactique',
        minutes: 15,
        objective: 'Schéma, rôles et déclencheurs du plan',
        material: 'Tableau / tablette',
      },
      {
        label: 'Situations clés',
        minutes: 15,
        objective: 'Pressing, relance, couvertures — sans jeu réduit long',
        material: 'Chasubles, cônes',
      },
      {
        label: 'Consignes individuelles',
        minutes: 10,
        objective: 'Marquage, couloirs, consignes par poste',
        material: '—',
      },
      { label: 'Mental & focus', minutes: 8, objective: 'Objectifs du match et rituels', material: '—' },
    ],
  },
  set_pieces: {
    focus: 'Coups de pied arrêtés',
    difficulty: 'moyen',
    blocks: [
      { label: 'Activation', minutes: 10, objective: 'Passes et centres à faible intensité', material: 'Ballons' },
      {
        label: 'Corners offensifs',
        minutes: 12,
        objective: 'Trajectoires, écrans, 2e ballon',
        material: 'Cônes',
      },
      {
        label: 'Coups francs',
        minutes: 12,
        objective: 'Frappes directes et combinaisons',
        material: 'Mur factice (plots)',
      },
      {
        label: 'CPA défensifs',
        minutes: 12,
        objective: 'Marquage zone / individuel, sorties',
        material: 'Chasubles',
      },
      { label: 'Revue consignes', minutes: 8, objective: 'Responsables et déclencheurs CPA', material: '—' },
    ],
  },
  opponent_focus: {
    focus: 'Adaptation adversaire',
    difficulty: 'moyen',
    blocks: [
      { label: 'Activation', minutes: 10, objective: 'Montée en intensité progressive', material: 'Ballons' },
      {
        label: 'Analyse adverse',
        minutes: 12,
        objective: 'Forces, faiblesses et déclencheurs à exploiter',
        material: 'Tableau',
      },
      {
        label: 'Situations ciblées',
        minutes: 18,
        objective: 'Scénarios liés au profil adverse (transitions, CPA…)',
        material: 'Chasubles, cônes',
      },
      {
        label: 'Consignes pressing',
        minutes: 10,
        objective: 'Où presser, quand reculer',
        material: '—',
      },
      { label: 'Brief final', minutes: 8, objective: 'Plan A / plan B et rôles clés', material: '—' },
    ],
  },
};

function inferTrainingArchetype(input: {
  postMatch: PostMatchAnalysis | null;
  wellnessAlerts: number;
  memberCount: number;
  hasSheets: boolean;
  hoursSinceLastMatch: number | null;
  nextMatchKnown: boolean;
}): { archetype: CoachTrainingArchetype; reason: string; confidence: RecommendedSessionConfidence } {
  const { postMatch, wellnessAlerts, memberCount, hasSheets, hoursSinceLastMatch, nextMatchKnown } =
    input;

  if (hoursSinceLastMatch != null && hoursSinceLastMatch < RECOVERY_AFTER_MATCH_HOURS) {
    return {
      archetype: 'recovery',
      reason: `Match il y a ${Math.round(hoursSinceLastMatch)} h — séance de récupération active.`,
      confidence: 'high',
    };
  }

  if (wellnessAlerts >= 2 && memberCount > 0) {
    return {
      archetype: 'recovery',
      reason: `${wellnessAlerts} alerte${wellnessAlerts > 1 ? 's' : ''} forme — charge réduite.`,
      confidence: 'low',
    };
  }

  if (postMatch && postMatch.level !== 'none') {
    const all = [...postMatch.improvements, postMatch.nextMatchRecommendation].join(' ');
    if (/finition|dernier tiers/i.test(all)) {
      return {
        archetype: 'technical',
        reason: `Après « ${postMatch.title} » — finition et technique à travailler.`,
        confidence: postMatch.level === 'ready' ? 'high' : 'low',
      };
    }
    if (/transitions|pressing|compacité|tactique/i.test(all)) {
      return {
        archetype: 'tactical',
        reason: `Après « ${postMatch.title} » — ${postMatch.nextMatchRecommendation}`,
        confidence: postMatch.level === 'ready' ? 'high' : 'low',
      };
    }
    if (improvementsCollective(postMatch)) {
      return {
        archetype: 'collective',
        reason: `Après « ${postMatch.title} » — remise en route collective.`,
        confidence: postMatch.level === 'ready' ? 'high' : 'low',
      };
    }
  }

  if (nextMatchKnown) {
    return {
      archetype: 'tactical',
      reason: 'Match à venir — séance orientée organisation et consignes collectives.',
      confidence: hasSheets ? 'low' : 'none',
    };
  }

  if (hasSheets) {
    return {
      archetype: 'physical',
      reason: 'Feuilles de match disponibles — travail athlétique et transitions.',
      confidence: 'low',
    };
  }

  return {
    archetype: 'collective',
    reason: 'Données limitées — séance collective type pour démarrer.',
    confidence: 'none',
  };
}

function improvementsCollective(postMatch: PostMatchAnalysis): boolean {
  return postMatch.improvements.some((i) => /niveau collectif|note moy/i.test(i));
}

function inferMatchPrepArchetype(input: {
  hoursUntilMatch: number;
  opponentKnown: boolean;
  postMatch: PostMatchAnalysis | null;
}): { archetype: CoachMatchPrepArchetype; reason: string; confidence: RecommendedSessionConfidence } {
  const { hoursUntilMatch, opponentKnown, postMatch } = input;

  if (hoursUntilMatch <= 24) {
    return {
      archetype: 'activation',
      reason: 'Match dans moins de 24 h — activation légère, pas de séance d’entraînement classique.',
      confidence: 'high',
    };
  }

  if (/CPA|corner|coups? franc|arrêt/i.test(postMatch?.nextMatchRecommendation ?? '')) {
    return {
      archetype: 'set_pieces',
      reason: 'Dernière analyse — insister sur les coups de pied arrêtés.',
      confidence: postMatch?.level === 'ready' ? 'high' : 'low',
    };
  }

  if (opponentKnown) {
    return {
      archetype: 'opponent_focus',
      reason: 'Adversaire identifié — briefing et situations ciblées.',
      confidence: 'low',
    };
  }

  if (hoursUntilMatch <= MATCH_PREP_HOURS) {
    return {
      archetype: 'tactical_brief',
      reason: 'Match proche — causerie tactique et consignes collectives.',
      confidence: 'low',
    };
  }

  return {
    archetype: 'tactical_brief',
    reason: 'Préparation match — plan de briefing sans blocs d’entraînement générique.',
    confidence: 'none',
  };
}

function finalizePlan(
  partial: Omit<CoachComposedPlan, 'totalMinutes'>,
  playerCount?: number,
  wellnessAlerts = 0,
): CoachComposedPlan {
  const totalMinutes = partial.blocks.reduce((n, b) => n + b.minutes, 0);
  let difficulty = partial.difficulty;
  if (wellnessAlerts >= 3 && partial.context === 'training') difficulty = 'facile';
  return {
    ...partial,
    totalMinutes,
    playerCount,
    difficulty,
  };
}

function buildEmptyPlan(input: CoachComposedPlanInput, calendar: CoachCalendarContext): CoachComposedPlan {
  const { events, members, wellnessByUid = {} } = input;
  const wellnessAlerts = members.filter((m) => wellnessConcern(wellnessByUid[m.uid])).length;
  const playerCount = estimatePlayerCount(events, members);

  if (!calendar.nextMatch && !calendar.nextTraining) {
    return finalizePlan(
      {
        context: 'training',
        archetype: 'empty',
        title: 'Aucun créneau planifié',
        focus: 'Planifier le calendrier',
        reason:
          'Aucun entraînement ni match à venir — créez un créneau ou planifiez votre prochain match.',
        blocks: [
          {
            label: 'Étape 1',
            minutes: 0,
            objective: 'Ajouter un entraînement dans Entraînements',
          },
          {
            label: 'Étape 2',
            minutes: 0,
            objective: 'Ou convoquer un match dans Matchs',
          },
        ],
        difficulty: 'facile',
        dataConfidence: 'none',
      },
      playerCount,
      wellnessAlerts,
    );
  }

  if (!calendar.nextMatch) {
    return finalizePlan(
      {
        context: 'match',
        archetype: 'empty',
        title: 'Aucun match planifié',
        focus: 'Convoquer un match',
        reason: 'Entraînements prévus mais pas de match — pensez à planifier la prochaine convocation.',
        blocks: [
          {
            label: 'Rappel',
            minutes: 0,
            objective: 'Créer une convocation match dans Matchs',
          },
        ],
        difficulty: 'facile',
        dataConfidence: 'none',
      },
      playerCount,
      wellnessAlerts,
    );
  }

  return finalizePlan(
    {
      context: 'training',
      archetype: 'empty',
      title: 'Aucun entraînement planifié',
      focus: 'Créer un créneau',
      reason: 'Match à venir sans entraînement intermédiaire — ajoutez une séance dans Entraînements.',
      blocks: [
        {
          label: 'Rappel',
          minutes: 0,
          objective: 'Planifier un entraînement avant le match',
        },
      ],
      difficulty: 'facile',
      dataConfidence: 'none',
    },
    playerCount,
    wellnessAlerts,
  );
}

function buildMatchPlan(
  input: CoachComposedPlanInput,
  event: TeamEvent,
  postMatch: PostMatchAnalysis | null,
  wellnessAlerts: number,
  playerCount?: number,
): CoachComposedPlan {
  const opp = opponentLabel(event);
  const hoursLeft = hoursUntil(event.starts_at);
  const { archetype, reason, confidence } = inferMatchPrepArchetype({
    hoursUntilMatch: hoursLeft,
    opponentKnown: Boolean(opp && opp !== event.title),
    postMatch,
  });
  const template = MATCH_PREP_TEMPLATES[archetype];
  const title = opp
    ? `Préparation match · ${opp}`
    : `Préparation match · ${event.title}`;

  return finalizePlan(
    {
      context: 'match',
      archetype,
      title,
      focus: template.focus,
      reason,
      blocks: template.blocks,
      difficulty: template.difficulty,
      dataConfidence: confidence,
      targetEventId: event.id,
    },
    playerCount,
    wellnessAlerts,
  );
}

function buildTrainingPlan(
  input: CoachComposedPlanInput,
  event: TeamEvent | null,
  postMatch: PostMatchAnalysis | null,
  wellnessAlerts: number,
  playerCount?: number,
): CoachComposedPlan {
  const { events } = input;
  const lastMatch = lastPastMatch(events);
  const hoursSinceMatch = lastMatch ? hoursSince(lastMatch.starts_at) : null;
  const calendar = resolveCoachCalendarContext(events);

  const { archetype, reason, confidence } = inferTrainingArchetype({
    postMatch,
    wellnessAlerts,
    memberCount: input.members.length,
    hasSheets: hasSheetData(events.filter((e) => isMatchEvent(e) && e.starts_at.getTime() < Date.now())),
    hoursSinceLastMatch: hoursSinceMatch,
    nextMatchKnown: Boolean(calendar.nextMatch),
  });

  const template = TRAINING_TEMPLATES[archetype];
  const archetypeLabels: Record<CoachTrainingArchetype, string> = {
    technical: 'Technique',
    tactical: 'Tactique',
    physical: 'Physique',
    recovery: 'Récupération',
    collective: 'Collectif',
  };
  const totalMinutes = template.blocks.reduce((n, b) => n + b.minutes, 0);

  return finalizePlan(
    {
      context: 'training',
      archetype,
      title: `Entraînement · ${archetypeLabels[archetype]} · ${totalMinutes} min`,
      focus: template.focus,
      reason,
      blocks: template.blocks,
      difficulty: template.difficulty,
      dataConfidence: confidence,
      targetEventId: event?.id,
    },
    playerCount,
    wellnessAlerts,
  );
}

/** Composition déterministe — entraînement ou préparation match selon le calendrier. */
export function buildCoachComposedPlan(input: CoachComposedPlanInput): CoachComposedPlan {
  const { events, members, wellnessByUid = {}, hasClub } = input;
  const postMatch =
    input.postMatchAnalysis ??
    (hasClub ? findLatestPostMatchAnalysis(events, members) : null);
  const wellnessAlerts = members.filter((m) => wellnessConcern(wellnessByUid[m.uid])).length;
  const playerCount = estimatePlayerCount(events, members);
  const calendar = resolveCoachCalendarContext(events);

  const explicit = input.targetEvent ?? null;
  if (explicit) {
    if (isMatchEvent(explicit)) {
      return buildMatchPlan(input, explicit, postMatch, wellnessAlerts, playerCount);
    }
    if (isTrainingEvent(explicit)) {
      return buildTrainingPlan(input, explicit, postMatch, wellnessAlerts, playerCount);
    }
  }

  if (!calendar.primaryEvent) {
    return buildEmptyPlan(input, calendar);
  }

  if (calendar.primary === 'match') {
    return buildMatchPlan(input, calendar.primaryEvent, postMatch, wellnessAlerts, playerCount);
  }

  return buildTrainingPlan(
    input,
    calendar.primaryEvent,
    postMatch,
    wellnessAlerts,
    playerCount,
  );
}

/** Notes structurées pour session_plan.notes. */
export function formatRecommendedSessionNotes(plan: CoachComposedPlan): string {
  const typeLabel = plan.context === 'match' ? 'Préparation match' : 'Entraînement';
  const header = `${typeLabel}\nFocus : ${plan.focus}\n${plan.reason}\n`;
  if (plan.blocks.every((b) => b.minutes === 0)) {
    return `${header}\n${plan.blocks.map((b) => `• ${b.label}${b.objective ? ` — ${b.objective}` : ''}`).join('\n')}`;
  }
  const lines = plan.blocks.map((b) => {
    const parts = [`• ${b.label} (${b.minutes} min)`];
    if (b.objective) parts.push(` — ${b.objective}`);
    if (b.material && b.material !== '—') parts.push(` [${b.material}]`);
    return parts.join('');
  });
  return `${header}\n${lines.join('\n')}`;
}

export function coachArchetypeLabel(
  plan: CoachComposedPlan,
): string {
  if (plan.context === 'match') {
    const labels: Record<CoachMatchPrepArchetype, string> = {
      activation: 'Activation',
      tactical_brief: 'Causerie tactique',
      set_pieces: 'Coups de pied arrêtés',
      opponent_focus: 'Focus adversaire',
    };
    return labels[plan.archetype as CoachMatchPrepArchetype] ?? 'Préparation match';
  }
  const labels: Record<CoachTrainingArchetype, string> = {
    technical: 'Technique',
    tactical: 'Tactique',
    physical: 'Physique',
    recovery: 'Récupération',
    collective: 'Collectif',
  };
  return labels[plan.archetype as CoachTrainingArchetype] ?? 'Entraînement';
}

/** @deprecated Utiliser buildCoachComposedPlan */
export function buildRecommendedSession(input: CoachComposedPlanInput): CoachComposedPlan {
  return buildCoachComposedPlan(input);
}
