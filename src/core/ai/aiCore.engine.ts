import type { MainTabId } from '../../navigation/mainTabConfig';
import type {
  AiCoreInput,
  AiCoreOutput,
  ExpertId,
  ExpertVote,
  HeroIaState,
} from '../types/ai';
import type { HealthSnapshot } from '../types/health';
import type { MatchRecommendation } from '../types/recommendation';

const EXPERT_WEIGHTS: Record<ExpertId, number> = {
  health: 1.4,
  performance: 1.2,
  geo: 1.1,
  product: 1.0,
  social: 0.95,
  notification: 0.9,
  ux: 0.85,
  ui: 0.8,
  growth: 0.75,
  data: 0.7,
};

function simulateExpert(
  expert: ExpertId,
  input: AiCoreInput,
  health: HealthSnapshot,
  topMatch?: MatchRecommendation
): ExpertVote | null {
  switch (expert) {
    case 'health':
      if (health.state === 'OVERLOADED' || health.state === 'INJURY_RISK') {
        return {
          expert,
          reason: health.coachMessage,
          weight: EXPERT_WEIGHTS.health,
          primaryTab: 'sante',
        };
      }
      return {
        expert,
        reason: health.dailyPlanHint,
        weight: EXPERT_WEIGHTS.health * 0.6,
        primaryTab: 'sante',
      };
    case 'geo':
      if (input.nearbyMatchCount > 0) {
        return {
          expert,
          reason: `${input.nearbyMatchCount} match(s) à proximité`,
          weight: EXPERT_WEIGHTS.geo,
          primaryTab: 'matchs',
        };
      }
      return null;
    case 'social':
      if (input.unreadMessages > 0) {
        return {
          expert,
          reason: 'Réseau actif — messages en attente',
          weight: EXPERT_WEIGHTS.social,
          primaryTab: 'messages',
        };
      }
      return null;
    case 'performance':
      if (topMatch && health.allowIntenseMatch) {
        return {
          expert,
          reason: `Match recommandé : ${topMatch.title}`,
          weight: EXPERT_WEIGHTS.performance,
          primaryTab: 'matchs',
        };
      }
      return null;
    case 'product':
      return {
        expert,
        reason: 'Une action prioritaire maximise votre progression',
        weight: EXPERT_WEIGHTS.product,
        primaryTab: 'home',
      };
    case 'growth':
      if (input.applicationsCount === 0 && input.role === 'player') {
        return {
          expert,
          reason: 'Postulez sur le Mercato pour gagner en visibilité',
          weight: EXPERT_WEIGHTS.growth,
          primaryTab: 'recrutement',
        };
      }
      return null;
    case 'notification':
      if (input.upcomingEventsCount > 0) {
        return {
          expert,
          reason: `${input.upcomingEventsCount} événement(s) à venir`,
          weight: EXPERT_WEIGHTS.notification,
          primaryTab: 'matchs',
        };
      }
      return null;
    default:
      return null;
  }
}

function arbitrate(votes: ExpertVote[]): { state: HeroIaState; tab: MainTabId; reason: string } {
  const ranked = [...votes].sort((a, b) => b.weight - a.weight);
  const top = ranked[0];

  if (!top) {
    return {
      state: 'TRAINING_RECOMMENDATION',
      tab: 'matchs',
      reason: 'Entraînement léger recommandé',
    };
  }

  const tab = top.primaryTab ?? 'home';
  let state: HeroIaState = 'TRAINING_RECOMMENDATION';

  if (tab === 'matchs') state = 'MATCH_RECOMMENDATION';
  else if (tab === 'sante') state = 'REST_RECOMMENDATION';
  else if (tab === 'messages') state = 'SOCIAL_RECOMMENDATION';
  else if (top.expert === 'health') state = 'REST_RECOMMENDATION';

  return { state, tab, reason: top.reason };
}

const CTA_BY_TAB: Record<MainTabId, string> = {
  home: 'Voir l’accueil',
  matchs: 'Voir les matchs',
  recrutement: 'Ouvrir le Mercato',
  covoiturage: 'Covoiturage',
  sante: 'Plan santé',
  feed: 'Fil communauté',
  reels: 'Voir les réels',
  messages: 'Messages',
  profil: 'Mon profil',
  shop: 'Boutique',
};

/** IA Core — orchestration multi-cerveaux (spec §6, §10). */
export function runAiCore(
  input: AiCoreInput,
  matchRecommendations: MatchRecommendation[],
  health: HealthSnapshot
): AiCoreOutput {
  const topMatch = matchRecommendations[0];
  const experts: ExpertId[] = [
    'health',
    'geo',
    'social',
    'performance',
    'product',
    'growth',
    'notification',
  ];

  const expertVotes = experts
    .map((e) => simulateExpert(e, input, health, topMatch))
    .filter((v): v is ExpertVote => v != null);

  const decision = arbitrate(expertVotes);

  const heroTitle =
    decision.state === 'MATCH_RECOMMENDATION' && topMatch
      ? topMatch.title
      : decision.state === 'REST_RECOMMENDATION'
        ? 'Journée récupération'
        : decision.state === 'SOCIAL_RECOMMENDATION'
          ? 'Votre réseau vous attend'
          : 'Objectif du jour';

  const heroDescription =
    decision.state === 'MATCH_RECOMMENDATION' && topMatch
      ? `${topMatch.subtitle} · ${topMatch.city}`
      : decision.reason;

  const secondaryTab: MainTabId | undefined =
    decision.tab === 'matchs' ? 'sante' : decision.tab === 'sante' ? 'matchs' : 'profil';

  const maxMatchIntensity: AiCoreOutput['contentFilter']['maxMatchIntensity'] =
    health.state === 'INJURY_RISK' || health.state === 'OVERLOADED'
      ? 'low'
      : health.state === 'FATIGUED'
        ? 'medium'
        : 'high';

  return {
    heroState: decision.state,
    heroTitle,
    heroDescription,
    primaryCta: { label: CTA_BY_TAB[decision.tab] ?? 'Continuer', tab: decision.tab },
    secondaryCta: secondaryTab
      ? { label: CTA_BY_TAB[secondaryTab], tab: secondaryTab }
      : undefined,
    dynamicScore: Math.round(
      input.globalScore * 0.4 +
        input.userEnergy * 0.25 +
        health.recoveryScore * 0.2 +
        Math.min(100, input.streakDays * 6) * 0.15
    ),
    expertVotes,
    health,
    matchRecommendations,
    contentFilter: {
      reelsUsefulnessMin:
        health.state === 'OVERLOADED' || health.state === 'INJURY_RISK' ? 0.75 : 0.45,
      maxMatchIntensity,
    },
    generatedAt: new Date(),
  };
}
