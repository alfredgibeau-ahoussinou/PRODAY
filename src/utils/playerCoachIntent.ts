import type { GenerateIndividualRequest, TrainingObjective } from '../models/TrainingSession';

/** Normalise pour détection d'intention sans accents. */
function normalizeIntent(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

export type PlayerNavigateTab =
  | 'home'
  | 'matchs'
  | 'feed'
  | 'profil'
  | 'plus'
  | 'messages'
  | 'train_ai'
  | 'train_coach';

export type PlayerCoachLateDelay = 'under_10' | 'over_10' | 'unknown';

/** Intent utilisateur : créer un entraînement maison / programme IA. */
export function isHomeTrainingIntent(text: string): boolean {
  const n = normalizeIntent(text.trim());
  if (!n) return false;
  if (n.includes('creer mon entrainement')) return true;
  if (n.includes('creer ma seance')) return true;
  if (n.includes('creer une seance')) return true;
  if (n.includes('programme ia')) return true;
  if (n.includes('entrainement ia')) return true;
  if (n.includes('entrainement a la maison')) return true;
  if (n.includes('seance') && (n.includes('30') || n.includes('min') || n.includes('pied'))) return true;
  if (n.includes('entrainement') && (n.includes('maison') || n.includes('solo') || n.includes('chez moi'))) {
    return true;
  }
  return false;
}

/** Navigation instantanée depuis le chat Coach IA. */
export function resolveNavigationIntent(text: string): PlayerNavigateTab | null {
  const n = normalizeIntent(text.trim());
  if (!n) return null;
  if (/\b(ouvre|va|aller|montre|affiche|dirige)\b/.test(n) || n.startsWith('open ')) {
    if (n.includes('match')) return 'matchs';
    if (n.includes('progress') || n.includes('saison') || n.includes('niveau')) return 'feed';
    if (n.includes('profil') || n.includes('carte')) return 'profil';
    if (n.includes('message')) return 'messages';
    if (n.includes('plus') || n.includes('menu')) return 'plus';
    if (n.includes('entrain') || n.includes('train') || n.includes('seance')) return 'train_ai';
    if (n.includes('accueil') || n.includes('parcours') || n.includes('home')) return 'home';
  }
  if (n === 'mes matchs' || n === 'matchs') return 'matchs';
  if (n === 'ma progression' || n === 'progression') return 'feed';
  if (n === 'mon profil' || n === 'profil') return 'profil';
  if (n === 'coach humain' || n.includes('coach humain') || n.includes('coach reel')) return 'train_coach';
  if (n.includes('reserver un coach') || n.includes('reserver coach')) return 'train_coach';
  return null;
}

/** Intent retard convocation / prochain match. */
export function parseLateRsvpIntent(text: string): PlayerCoachLateDelay | null {
  const n = normalizeIntent(text.trim());
  if (!n) return null;
  const late =
    n.includes('retard') ||
    n.includes('serai en retard') ||
    n.includes('je serai late') ||
    n.includes('arriverai en retard');
  if (!late) return null;
  if (/\b(10|dix)\s*min/.test(n) && (n.includes('plus') || n.includes('ou plus') || n.includes('minimum'))) {
    return 'over_10';
  }
  if (n.includes('moins de 10') || n.includes('under 10') || /\b(10|[1-9])\s*min/.test(n)) {
    return 'under_10';
  }
  if (n.includes('retard')) return 'unknown';
  return null;
}

/** Résumé hebdomadaire forme + activités. */
export function isWeeklySummaryIntent(text: string): boolean {
  const n = normalizeIntent(text.trim());
  if (!n) return false;
  return (
    (n.includes('semaine') &&
      (n.includes('progress') || n.includes('resume') || n.includes('bilan') || n.includes('ou en'))) ||
    n.includes('resume de la semaine') ||
    n.includes('bilan hebdo')
  );
}

/** Objectif focus hebdo — extrait le texte après les marqueurs courants. */
export function parseWeeklyGoalIntent(text: string): string | null {
  const raw = text.trim();
  const n = normalizeIntent(raw);
  if (!n) return null;
  const markers = [
    'mon objectif cette semaine',
    'objectif cette semaine',
    'mon objectif',
    'objectif du jour',
    'cette semaine je veux',
  ];
  for (const m of markers) {
    const idx = n.indexOf(m);
    if (idx >= 0) {
      const slice = raw.slice(idx + m.length).replace(/^[\s:,-]+/, '').trim();
      if (slice.length >= 3) return slice.slice(0, 200);
    }
  }
  if (n.startsWith('objectif ') && raw.length > 12) {
    return raw.replace(/^objectif\s*/i, '').trim().slice(0, 200);
  }
  return null;
}

/** Extrait objectif / durée pour generateHomeTraining. */
export function parseTrainingParams(text: string): Partial<GenerateIndividualRequest> | null {
  const n = normalizeIntent(text.trim());
  if (!isHomeTrainingIntent(text) && !n.includes('seance') && !n.includes('entrain')) return null;

  const params: Partial<GenerateIndividualRequest> = {};

  const durMatch = n.match(/(\d{2,3})\s*min/);
  if (durMatch) params.duration_min = Math.min(120, Math.max(15, parseInt(durMatch[1], 10)));

  const objectives: [RegExp, TrainingObjective][] = [
    [/pied faible|jambe faible|pied moins fort/, 'pied_faible'],
    [/tir|frappe|finition/, 'frappe'],
    [/vitesse|sprint|acceleration/, 'vitesse'],
    [/passes|passing|transmission/, 'passes'],
    [/dribble|technique|controle/, 'dribble'],
    [/physique|endurance|cardio/, 'endurance'],
    [/defense|defensif|tacle/, 'tactique'],
  ];
  for (const [re, label] of objectives) {
    if (re.test(n)) {
      params.objective = label;
      break;
    }
  }
  if (!params.objective && n.includes('seance')) {
    params.objective = 'technique';
  }

  if (n.includes('solo') || n.includes('seul') || n.includes('maison')) {
    params.partner = false;
  }

  return Object.keys(params).length > 0 ? params : { objective: 'technique' as TrainingObjective };
}
