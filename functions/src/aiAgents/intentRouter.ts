import type { AgentName } from './types';

type IntentRule = {
  patterns: string[];
  agents: AgentName[];
};

const INTENT_MAP: IntentRule[] = [
  { patterns: ['club', 'adhérent', 'membre', 'inscription', 'licencié'], agents: ['club'] },
  {
    patterns: ['match', 'score', 'résultat', 'classement', 'victoire', 'défaite', 'championnat'],
    agents: ['match', 'analytics'],
  },
  { patterns: ['entraînement', 'séance', 'exercice', 'training'], agents: ['training'] },
  {
    patterns: ['joueur', 'forme', 'stat', 'progression', 'blessure', 'performance'],
    agents: ['player'],
  },
  { patterns: ['vidéo', 'clip', 'analyse vidéo', 'replay'], agents: ['video'] },
  {
    patterns: ['revenu', 'abonnement', 'paiement', 'argent', 'finance', 'cotisation', 'facture'],
    agents: ['revenue'],
  },
  { patterns: ['coach', 'évaluation', 'tactique', 'formation'], agents: ['coach'] },
  {
    patterns: ['pourquoi', 'analyse', 'comprendre', 'tendance', 'comparer', 'anomalie'],
    agents: ['analytics'],
  },
];

const ROLE_FALLBACK: Record<string, AgentName[]> = {
  club: ['club', 'analytics'],
  coach: ['coach', 'analytics'],
  player: ['player', 'analytics'],
  admin: ['analytics', 'club'],
  sponsor: ['revenue', 'analytics'],
  parent: ['player', 'analytics'],
};

export function resolveIntents(query: string, role: string): AgentName[] {
  const lower = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const matched = new Set<AgentName>();

  for (const rule of INTENT_MAP) {
    for (const pattern of rule.patterns) {
      const normalized = pattern.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (lower.includes(normalized)) {
        for (const agent of rule.agents) matched.add(agent);
        break;
      }
    }
  }

  if (matched.size === 0) {
    const fallback = ROLE_FALLBACK[role] ?? ['analytics'];
    for (const a of fallback) matched.add(a);
  }

  return Array.from(matched);
}
