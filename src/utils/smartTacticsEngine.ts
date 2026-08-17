import type {
  AiMatchPreparation,
  CollectiveTrainingSession,
  IndividualSkillFocus,
  IndividualTrainingPlan,
  MatchPhase,
  MatchTacticalReport,
  OpponentAnalysis,
  TrainingBlock,
  TacticalPlan,
  SmartPlayerCardData,
} from '../models/SmartTactics';
import { DEFAULT_TEAM_INSTRUCTIONS } from '../models/SmartTactics';
import type { TeamEvent } from '../models/TeamEvent';
import type { User } from '../models/User';
import { resolveJoueurPositionGroup, type JoueurPositionGroup } from './joueurExperienceTheme';
import { parseFormationLines } from './formationPitch';

function uid(): string {
  return `st_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function isValidFormation(formation: string): boolean {
  const parts = formation.split('-').map((n) => parseInt(n, 10));
  if (parts.length < 2 || parts.length > 5) return false;
  if (parts.some((n) => !Number.isFinite(n) || n < 1 || n > 7)) return false;
  const outfield = parts.reduce((a, b) => a + b, 0);
  return outfield >= 7 && outfield <= 10;
}

export function countFormationSlots(formation: string): number {
  const parts = formation
    .split('-')
    .map((n) => parseInt(n, 10))
    .filter((n) => n > 0);
  return 1 + parts.reduce((a, b) => a + b, 0);
}

/** Groupe de poste attendu pour une ligne de formation (0 = GB). */
export function formationLinePositionGroup(
  lineIndex: number,
  lineCount: number,
): JoueurPositionGroup {
  if (lineIndex <= 0) return 'goalkeeper';
  if (lineIndex === 1) return 'defender';
  if (lineIndex >= lineCount - 1) return 'forward';
  return 'midfielder';
}

function scoreCard(c: SmartPlayerCardData): number {
  return c.readiness_pct * 0.6 + c.form * 0.4;
}

function sortByFitness(a: SmartPlayerCardData, b: SmartPlayerCardData): number {
  return scoreCard(b) - scoreCard(a);
}

/**
 * Compose un XI en respectant les postes de chaque joueur et les lignes
 * de la formation (GB → défense → milieux → attaque).
 */
export function selectStartingXiByPosition(
  cards: SmartPlayerCardData[],
  formation: string,
): { uids: string[]; labels: string[] } {
  const lines = parseFormationLines(formation);
  const available = cards.filter(
    (c) => c.availability === 'available' || c.availability === 'doubtful',
  );
  const pools: Record<JoueurPositionGroup, SmartPlayerCardData[]> = {
    goalkeeper: [],
    defender: [],
    midfielder: [],
    forward: [],
    unknown: [],
  };
  for (const c of available) {
    pools[resolveJoueurPositionGroup(c.position)].push(c);
  }
  for (const key of Object.keys(pools) as JoueurPositionGroup[]) {
    pools[key].sort(sortByFitness);
  }

  const picked: SmartPlayerCardData[] = [];
  const used = new Set<string>();
  const labels: string[] = [];

  const takeFrom = (
    group: JoueurPositionGroup,
    n: number,
    fallbacks: JoueurPositionGroup[],
  ) => {
    const takeOne = (g: JoueurPositionGroup): SmartPlayerCardData | undefined => {
      const next = pools[g].find((c) => !used.has(c.uid));
      return next;
    };
    for (let i = 0; i < n; i++) {
      let card = takeOne(group);
      if (!card) {
        for (const fb of fallbacks) {
          card = takeOne(fb);
          if (card) break;
        }
      }
      if (!card) {
        // dernier recours : meilleur restant toutes lignes
        card = available.find((c) => !used.has(c.uid));
      }
      if (!card) break;
      used.add(card.uid);
      picked.push(card);
      labels.push(card.position?.trim() || defaultLabelForGroup(group));
    }
  };

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const need = lines[lineIndex];
    const group = formationLinePositionGroup(lineIndex, lines.length);
    const fallbacks: JoueurPositionGroup[] =
      group === 'goalkeeper'
        ? ['unknown', 'defender']
        : group === 'defender'
          ? ['unknown', 'midfielder']
          : group === 'forward'
            ? ['unknown', 'midfielder']
            : ['unknown', 'defender', 'forward'];
    takeFrom(group, need, fallbacks);
  }

  return { uids: picked.map((c) => c.uid), labels };
}

function defaultLabelForGroup(group: JoueurPositionGroup): string {
  switch (group) {
    case 'goalkeeper':
      return 'Gardien';
    case 'defender':
      return 'Défenseur';
    case 'forward':
      return 'Attaquant';
    case 'midfielder':
    default:
      return 'Milieu';
  }
}

/** Réordonne un XI (uids) selon postes + formation pour le board. */
export function orderUidsByFormationPositions(
  uids: string[],
  cards: SmartPlayerCardData[],
  formation: string,
): string[] {
  const byUid = new Map(cards.map((c) => [c.uid, c]));
  const lines = parseFormationLines(formation);
  const remaining = uids
    .map((id) => byUid.get(id))
    .filter(Boolean) as SmartPlayerCardData[];
  const used = new Set<string>();
  const ordered: string[] = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const need = lines[lineIndex];
    const group = formationLinePositionGroup(lineIndex, lines.length);
    const matches = remaining
      .filter((c) => !used.has(c.uid) && resolveJoueurPositionGroup(c.position) === group)
      .sort(sortByFitness);
    const others = remaining
      .filter((c) => !used.has(c.uid) && !matches.includes(c))
      .sort(sortByFitness);
    const pick = [...matches, ...others].slice(0, need);
    for (const c of pick) {
      used.add(c.uid);
      ordered.push(c.uid);
    }
  }
  for (const c of remaining) {
    if (!used.has(c.uid)) ordered.push(c.uid);
  }
  return ordered;
}

/** Build opponent analysis with graceful sparse-data fallback. */
export function buildOpponentAnalysis(input: {
  opponent_name?: string;
  previous_results?: { goals_for: number; goals_against: number }[];
  notes?: string;
}): OpponentAnalysis {
  const results = input.previous_results ?? [];
  const hasData = results.length > 0;
  const gf = results.reduce((a, r) => a + r.goals_for, 0);
  const ga = results.reduce((a, r) => a + r.goals_against, 0);
  const avgGf = hasData ? gf / results.length : 0;
  const avgGa = hasData ? ga / results.length : 0;

  if (!hasData) {
    return {
      strengths: ['Ils peuvent monter haut dès le coup d’envoi — à confirmer en live'],
      weaknesses: ['Profil encore flou — teste les transitions après récupération'],
      key_players: [],
      risk_flags: ['Peu d’historique sur cet adversaire'],
      suggested_approach: 'Démarre en 4-4-2 compact et ajuste après le premier quart d’heure',
      formation_guess: '4-4-2',
      data_confidence: 'low',
    };
  }

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (avgGf >= 1.8) {
    strengths.push('Ils marquent régulièrement — attention aux espaces dans le dos');
  } else {
    strengths.push('Bloc défensif bien organisé');
  }
  if (avgGa <= 0.9) strengths.push('Solide derrière, peu de buts encaissés');
  if (avgGa >= 1.6) weaknesses.push('Fragiles dans la surface — attaque tôt');
  if (avgGf <= 1) weaknesses.push('Peu d’occasions créées — tu peux prendre le jeu');
  weaknesses.push('Les transitions après récup peuvent faire mal');

  return {
    strengths,
    weaknesses,
    key_players: [],
    risk_flags: avgGf >= 2 ? ['Attention si tu montes la ligne — ils punissent les espaces'] : [],
    suggested_approach:
      avgGa >= 1.5
        ? 'Presse au milieu et cherche la verticalité dans le dos des latéraux'
        : 'Patience avec le ballon, varie les côtés',
    formation_guess: avgGf >= 1.8 ? '4-3-3' : '4-4-2',
    data_confidence: results.length >= 3 ? 'high' : 'medium',
  };
}

function capitalizeFr(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildPrepBriefingFr(input: {
  formation: string;
  opponent: OpponentAnalysis;
  opponent_name?: string;
  formReport: ReturnType<typeof analyzeSquadForm>;
  pivot?: SmartPlayerCardData;
  physical_alerts: string[];
}): string {
  const { formation, opponent, opponent_name, formReport, pivot, physical_alerts } = input;
  const adv = opponent_name?.trim() || 'l’adversaire';

  let p1 = `Tu peux partir en ${formation}`;
  if (formReport.avg_form >= 75) {
    p1 += ` — l’effectif est chaud (moy. ${formReport.avg_form})`;
  } else if (formReport.avg_form >= 60) {
    p1 += ` — forme correcte côté groupe (moy. ${formReport.avg_form})`;
  } else {
    p1 += ` — la forme collective traîne un peu (moy. ${formReport.avg_form}), privilégie le ready`;
  }

  if (opponent.data_confidence === 'low') {
    p1 += `. On n’a pas grand-chose sur ${adv} — observe les 15 premières minutes`;
  } else {
    const s0 = opponent.strengths[0];
    const w0 = opponent.weaknesses[0];
    if (s0) p1 += `. ${capitalizeFr(s0)}`;
    if (w0 && w0 !== s0) p1 += `. ${capitalizeFr(w0)}`;
  }
  p1 += '.';

  const p2Parts: string[] = [];
  if (opponent.suggested_approach) {
    p2Parts.push(capitalizeFr(opponent.suggested_approach));
  }
  if (pivot) {
    p2Parts.push(
      pivot.position
        ? `${pivot.display_name} peut être ton pivot (${pivot.position}, forme ${pivot.form})`
        : `${pivot.display_name} peut être ton pivot (forme ${pivot.form})`,
    );
  }
  if (formReport.in_form.length > 0) {
    const hot = formReport.in_form
      .slice(0, 2)
      .map((c) => c.display_name)
      .join(' et ');
    p2Parts.push(`${hot} ${formReport.in_form.length > 1 ? 'sont' : 'est'} en confiance`);
  }
  if (physical_alerts.length > 0) {
    const names = physical_alerts
      .slice(0, 2)
      .map((a) => a.split(' — ')[0]?.trim() || a)
      .join(', ');
    p2Parts.push(`Garde un œil sur ${names} côté physique`);
  }

  const p2 = p2Parts.length > 0 ? `${p2Parts.map((part) => capitalizeFr(part)).join('. ')}.` : '';

  return p2 ? `${p1}\n\n${p2}` : p1;
}

export function buildAiMatchPreparation(input: {
  opponent_name?: string;
  cards: SmartPlayerCardData[];
  preferred_formation?: string;
  previous_results?: { goals_for: number; goals_against: number }[];
}): AiMatchPreparation {
  const opponent = buildOpponentAnalysis({
    opponent_name: input.opponent_name,
    previous_results: input.previous_results,
  });
  const available = input.cards.filter((c) => c.availability === 'available');
  const formation = input.preferred_formation ?? opponent.formation_guess ?? '4-3-3';
  const { uids: starting_xi_uids } = selectStartingXiByPosition(input.cards, formation);
  const formReport = analyzeSquadForm(input.cards);

  const physical_alerts = [
    ...formReport.at_risk.slice(0, 4).map(
      (c) => `${c.display_name} — forme ${c.form}, ready ${c.readiness_pct}%`,
    ),
    ...input.cards
      .filter((c) => c.availability === 'doubtful' && !formReport.at_risk.some((r) => r.uid === c.uid))
      .slice(0, 2)
      .map((c) => `${c.display_name} — incertain pour ce match`),
  ].slice(0, 5);

  const byUid = new Map(input.cards.map((c) => [c.uid, c]));
  const xiCards = starting_xi_uids.map((id) => byUid.get(id)).filter(Boolean) as SmartPlayerCardData[];
  const pivot = [...xiCards].sort(sortByFitness)[0];
  const xiForm =
    xiCards.length === 0
      ? 0
      : Math.round(xiCards.reduce((a, c) => a + c.form, 0) / xiCards.length);

  const tactical_suggestions = [
    formReport.summary_fr,
    opponent.suggested_approach,
    `Partir en ${formation} avec les meilleurs par poste (forme XI ~${xiForm})`,
    pivot
      ? `${pivot.display_name} en point d’ancrage${pivot.position ? ` (${pivot.position})` : ''}`
      : 'Répartir les rôles sans pivot unique',
    opponent.weaknesses[0] ?? 'Varier les axes d’attaque',
    ...formReport.lines.slice(0, 2),
  ];

  return {
    opponent,
    formation_recommendation: formation,
    starting_xi_uids,
    tactical_suggestions,
    physical_alerts,
    risk_analysis: [
      ...opponent.risk_flags,
      ...formReport.at_risk.slice(0, 3).map((c) => `${c.display_name} en forme fragile`),
      ...(physical_alerts.length ? ['Surveille la charge physique côté effectif'] : []),
    ],
    fallback: opponent.data_confidence === 'low' || available.length < 8,
    source: 'local',
    briefing_fr: buildPrepBriefingFr({
      formation,
      opponent,
      opponent_name: input.opponent_name,
      formReport,
      pivot,
      physical_alerts,
    }),
  };
}

/** Analyse de forme de tout l’effectif (par poste). */
export function analyzeSquadForm(cards: SmartPlayerCardData[]): {
  avg_form: number;
  avg_readiness: number;
  in_form: SmartPlayerCardData[];
  at_risk: SmartPlayerCardData[];
  by_position: Record<JoueurPositionGroup, { count: number; avg_form: number; avg_ready: number }>;
  lines: string[];
  summary_fr: string;
} {
  const usable = cards.filter((c) => c.availability !== 'out' && c.availability !== 'suspended');
  const avg = (arr: number[]) =>
    arr.length === 0 ? 0 : Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);

  const avg_form = avg(usable.map((c) => c.form));
  const avg_readiness = avg(usable.map((c) => c.readiness_pct));
  const in_form = [...usable].filter((c) => c.form >= 75).sort((a, b) => b.form - a.form);
  const at_risk = [...usable]
    .filter((c) => c.form < 55 || c.readiness_pct < 55 || c.availability === 'doubtful')
    .sort((a, b) => a.form - b.form || a.readiness_pct - b.readiness_pct);

  const groups: JoueurPositionGroup[] = [
    'goalkeeper',
    'defender',
    'midfielder',
    'forward',
    'unknown',
  ];
  const by_position = {} as Record<
    JoueurPositionGroup,
    { count: number; avg_form: number; avg_ready: number }
  >;
  for (const g of groups) {
    const slice = usable.filter((c) => resolveJoueurPositionGroup(c.position) === g);
    by_position[g] = {
      count: slice.length,
      avg_form: avg(slice.map((c) => c.form)),
      avg_ready: avg(slice.map((c) => c.readiness_pct)),
    };
  }

  const posLabel: Record<JoueurPositionGroup, string> = {
    goalkeeper: 'GB',
    defender: 'DEF',
    midfielder: 'MID',
    forward: 'ATT',
    unknown: '—',
  };
  const lines = groups
    .filter((g) => g !== 'unknown' && by_position[g].count > 0)
    .map((g) => {
      const row = by_position[g];
      return `${row.count} ${posLabel[g].toLowerCase()} · forme ${row.avg_form} · ready ${row.avg_ready}`;
    });

  const summary_fr =
    avg_form >= 75
      ? `L’effectif est chaud (moy. ${avg_form}) — tu peux viser un XI offensif.`
      : avg_form >= 60
        ? `Forme correcte (moy. ${avg_form}) — équilibre postes et ready.`
        : `Forme en baisse (moy. ${avg_form}) — pense rotation et ready.`;

  return {
    avg_form,
    avg_readiness,
    in_form,
    at_risk,
    by_position,
    lines,
    summary_fr,
  };
}

/** Scores récents vs un adversaire (ou tous les matchs) pour nourrir l’analyse. */
export function previousResultsFromEvents(
  events: TeamEvent[],
  opponentHint?: string,
): { goals_for: number; goals_against: number }[] {
  const hint = (opponentHint ?? '').trim().toLowerCase();
  const past = [...events]
    .filter((e) => {
      if (e.starts_at.getTime() > Date.now()) return false;
      if (!(e.event_type === 'friendly' || e.event_type === 'competition' || e.event_type === 'tournament')) {
        return false;
      }
      const score = e.live_state;
      if (score?.home_score == null || score?.away_score == null) return false;
      if (!hint) return true;
      const name = (score.opponent_name ?? e.title ?? '').toLowerCase();
      return name.includes(hint) || hint.includes(name.slice(0, 8));
    })
    .sort((a, b) => b.starts_at.getTime() - a.starts_at.getTime())
    .slice(0, 6);

  return past.map((e) => ({
    goals_for: e.live_state?.home_score ?? 0,
    goals_against: e.live_state?.away_score ?? 0,
  }));
}

/** Transforme une prep IA en plan hydratable sur le board. */
export function prepToTacticalPlan(input: {
  prep: AiMatchPreparation;
  members: User[];
  club_id: string;
  created_by: string;
  event_id?: string;
  opponent_name?: string;
  title?: string;
}): TacticalPlan {
  const byUid = new Map(input.members.map((m) => [m.uid, m]));
  const formation = input.prep.formation_recommendation || '4-3-3';
  const cards: SmartPlayerCardData[] = input.members.map((m) => ({
    uid: m.uid,
    display_name: m.display_name,
    position: m.profile.position,
    overall: 70,
    readiness_pct: 70,
    form: 70,
    availability: 'available',
    confidence: 70,
    progress: 40,
    badges: [],
    certifications: [],
  }));
  const orderedUids = orderUidsByFormationPositions(
    input.prep.starting_xi_uids,
    cards,
    formation,
  );
  const slotsNeeded = countFormationSlots(formation);
  const xi = orderedUids.slice(0, slotsNeeded);
  const lines = parseFormationLines(formation);
  const starters: {
    uid: string;
    display_name: string;
    role: 'starter';
    position_label: string;
  }[] = [];
  let lineCursor = 0;
  let inLine = 0;
  for (const id of xi) {
    const m = byUid.get(id);
    if (!m) continue;
    const group = formationLinePositionGroup(lineCursor, lines.length);
    const label = m.profile.position?.trim() || defaultLabelForGroup(group);
    starters.push({
      uid: m.uid,
      display_name: m.display_name,
      role: 'starter',
      position_label: label,
    });
    inLine += 1;
    if (lineCursor < lines.length && inLine >= lines[lineCursor]) {
      lineCursor = Math.min(lineCursor + 1, lines.length - 1);
      inLine = 0;
    }
  }
  const used = new Set(starters.map((s) => s.uid));
  const bench = input.members
    .filter((m) => !used.has(m.uid))
    .slice(0, 7)
    .map((m) => ({
      uid: m.uid,
      display_name: m.display_name,
      role: 'sub' as const,
      position_label: m.profile.position,
    }));
  const now = new Date();
  return {
    id: `ai_${now.getTime()}`,
    club_id: input.club_id,
    title:
      input.title ??
      `XI IA · ${formation}${input.opponent_name ? ` · ${input.opponent_name}` : ''}`,
    opponent_name: input.opponent_name,
    event_id: input.event_id,
    board: { formation, slots: [...starters, ...bench] },
    instructions: { ...DEFAULT_TEAM_INSTRUCTIONS },
    set_pieces: [],
    strategy_notes: [
      input.prep.briefing_fr,
      ...input.prep.tactical_suggestions.slice(0, 3),
    ]
      .filter(Boolean)
      .join('\n'),
    opponent_analysis: input.prep.opponent,
    created_at: now,
    updated_at: now,
    created_by: input.created_by,
  };
}

export function generateMatchReport(input: {
  event: TeamEvent;
  phase: MatchPhase;
  author_uid: string;
  prep?: AiMatchPreparation;
}): MatchTacticalReport {
  const opponent = input.event.live_state?.opponent_name ?? 'Adversaire';
  const titles: Record<MatchPhase, string> = {
    pre: `Pré-match · ${opponent}`,
    half: `Mi-temps · ${opponent}`,
    post: `Post-match · ${opponent}`,
    debrief: `Debrief · ${opponent}`,
  };
  const summaries: Record<MatchPhase, string> = {
    pre: input.prep?.tactical_suggestions[0] ?? 'Plan compact, observation des 15 premières minutes.',
    half: 'Ajuster largeur et pressing selon le score et la fatigue.',
    post: 'Capitaliser sur les points forts observés, corriger les transitions.',
    debrief: 'Historique tactique mis à jour — objectifs pour la prochaine séance.',
  };

  return {
    id: uid(),
    event_id: input.event.id,
    club_id: input.event.club_id,
    phase: input.phase,
    title: titles[input.phase],
    summary: summaries[input.phase],
    strengths: input.prep?.opponent.strengths.slice(0, 3) ?? ['Organisation collective'],
    weaknesses: input.prep?.opponent.weaknesses.slice(0, 3) ?? ['À affiner avec plus de données'],
    adjustments:
      input.phase === 'half'
        ? ['Remonter la ligne de 5 m', 'Alterner côté de construction']
        : input.prep?.tactical_suggestions.slice(0, 3) ?? ['Maintenir le plan A'],
    key_players: input.prep
      ? input.prep.starting_xi_uids.slice(0, 3)
      : [],
    risks: input.prep?.risk_analysis ?? [],
    created_at: new Date(),
    created_by: input.author_uid,
    ai_fallback: input.prep?.fallback ?? true,
  };
}

export function generateCollectiveTraining(input: {
  previous_match?: TeamEvent | null;
  opponent_profile?: OpponentAnalysis;
  team_weaknesses?: string[];
  season_objectives?: string[];
}): CollectiveTrainingSession {
  const based_on: string[] = [];
  if (input.previous_match) based_on.push(`Match précédent · ${input.previous_match.title}`);
  if (input.opponent_profile) based_on.push('Profil adversaire');
  if (input.team_weaknesses?.length) based_on.push('Faiblesses collectives');
  if (input.season_objectives?.length) based_on.push('Objectifs de saison');
  if (based_on.length === 0) based_on.push('Plan générique (données limitées)');

  const emphasizeTactical =
    Boolean(input.opponent_profile) || (input.team_weaknesses?.length ?? 0) > 0;
  const emphasizeRecovery = input.previous_match
    ? Date.now() - input.previous_match.starts_at.getTime() < 3 * 24 * 60 * 60 * 1000
    : false;

  const blocks: TrainingBlock[] = [
    {
      kind: 'warmup',
      title: 'Activation dynamique',
      duration_min: 12,
      focus: 'Mobilité + activation neuromusculaire',
      intensity: 'low',
    },
    {
      kind: 'technical',
      title: 'Circuits techniques',
      duration_min: 15,
      focus: 'Contrôle orientation + passes sous pression',
      intensity: 'balanced',
    },
    {
      kind: 'tactical',
      title: emphasizeTactical ? 'Bloc vs profil adverse' : 'Principes collectifs',
      duration_min: 20,
      focus: input.opponent_profile?.suggested_approach ?? 'Compacité et relances',
      intensity: 'high',
    },
    {
      kind: 'possession',
      title: 'Rondo progressif',
      duration_min: 12,
      focus: 'Conservation + third man',
      intensity: 'balanced',
    },
    {
      kind: 'finishing',
      title: 'Finitions situationnelles',
      duration_min: 12,
      focus: 'Centres + finitions 1er/2e ballon',
      intensity: 'high',
    },
    {
      kind: 'small_sided',
      title: 'Jeux réduits 5v5',
      duration_min: 16,
      focus: 'Transitions et duels',
      intensity: 'high',
    },
    {
      kind: emphasizeRecovery ? 'recovery' : 'physical',
      title: emphasizeRecovery ? 'Récupération active' : 'Puissance aérobie',
      duration_min: emphasizeRecovery ? 10 : 14,
      focus: emphasizeRecovery ? 'Étirements + mobilité' : 'Intermittent court',
      intensity: emphasizeRecovery ? 'low' : 'high',
    },
  ];

  const total = blocks.reduce((a, b) => a + b.duration_min, 0);
  return {
    id: uid(),
    title: 'Séance collective Tactique IA',
    total_duration_min: total,
    blocks,
    based_on,
    objectives: [
      ...(input.season_objectives?.slice(0, 2) ?? []),
      ...(input.team_weaknesses?.slice(0, 2) ?? ['Maintenir l’intensité collective']),
    ],
    created_at: new Date(),
  };
}

const POSITION_FOCUS: Record<string, IndividualSkillFocus[]> = {
  Gardien: ['decision_making', 'vision', 'agility'],
  Défenseur: ['defensive_positioning', 'heading', 'strength', 'acceleration'],
  Milieu: ['passing', 'vision', 'decision_making', 'ball_control'],
  Attaquant: ['shooting', 'dribbling', 'acceleration', 'weak_foot'],
};

export function generateIndividualTrainingPlan(input: {
  player: User;
  premium?: boolean;
  weak_areas?: IndividualSkillFocus[];
}): IndividualTrainingPlan {
  const pos = input.player.profile.position ?? 'Milieu';
  const base = POSITION_FOCUS[pos] ?? POSITION_FOCUS.Milieu;
  const focus = [...new Set([...(input.weak_areas ?? []), ...base])].slice(
    0,
    input.premium ? 5 : 3,
  ) as IndividualSkillFocus[];

  const drillsBySkill: Record<IndividualSkillFocus, string[]> = {
    weak_foot: ['Finitions pied faible', 'Passes courtes pied faible'],
    shooting: ['Frappe en mouvement', '1v1 gardien'],
    passing: ['Triangles sous pression', 'Passes longues ciblées'],
    dribbling: ['1v1 couloirs', 'Changements de rythme'],
    ball_control: ['Contrôle orientation', 'Ballon sous pression'],
    speed: ['Sprints 20 m', 'Relais'],
    acceleration: ['Départs arrêtés', 'Premiers appuis'],
    strength: ['Gainage + contacts', 'Duels protégés'],
    agility: ['Slalom + appui', 'Changements de direction'],
    heading: ['Centres + reprise', 'Duels aériens'],
    crossing: ['Centres 1er ballon', 'Centres 2e poteau'],
    defensive_positioning: ['Couverture / marquage', 'Bloc bas'],
    decision_making: ['Scénarios vidéo', 'Choix sous timer'],
    vision: ['Scan avant réception', 'Passes 3e homme'],
    explosiveness: ['Pliométrie courte', 'Démarrages'],
  };

  const days = input.premium
    ? ['Lun', 'Mer', 'Ven', 'Sam']
    : ['Mar', 'Jeu', 'Sam'];

  const weekly_sessions = days.map((day, i) => {
    const skill = focus[i % focus.length];
    return {
      day,
      title: `Session ${skill}`,
      drills: drillsBySkill[skill],
      duration_min: input.premium ? 45 : 30,
    };
  });

  return {
    id: uid(),
    player_uid: input.player.uid,
    focus,
    weekly_sessions,
    premium: Boolean(input.premium),
    created_at: new Date(),
    updated_at: new Date(),
  };
}
