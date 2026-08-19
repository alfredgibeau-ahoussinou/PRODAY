import * as admin from 'firebase-admin';

export type PlayerAiAction =
  | { type: 'navigate'; tab: string }
  | { type: 'open_training'; params?: Record<string, unknown> }
  | { type: 'report_late'; eventId: string; delay: 'under_10' | 'over_10' | 'unknown' }
  | { type: 'generate_training'; objective: string; durationMin: number }
  | { type: 'save_weekly_goal'; goal: string };

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

function parseLateDelay(text: string): 'under_10' | 'over_10' | 'unknown' | null {
  const n = normalize(text);
  if (!n.includes('retard')) return null;
  if (/\b(10|dix)\s*min/.test(n) && (n.includes('plus') || n.includes('ou plus'))) return 'over_10';
  if (n.includes('moins de 10') || /\b([1-9])\s*min/.test(n)) return 'under_10';
  return 'unknown';
}

function parseTraining(text: string): { objective: string; durationMin: number } | null {
  const n = normalize(text);
  if (!n.includes('entrain') && !n.includes('seance') && !n.includes('creer')) return null;
  const durMatch = n.match(/(\d{2,3})\s*min/);
  const durationMin = durMatch ? Math.min(120, Math.max(15, parseInt(durMatch[1], 10))) : 30;
  const objectives: [RegExp, string][] = [
    [/pied faible|jambe faible/, 'Renforcement pied faible'],
    [/tir|frappe|finition/, 'Amélioration du tir'],
    [/vitesse|sprint/, 'Vitesse et explosivité'],
    [/passes|passing/, 'Précision des passes'],
    [/physique|endurance/, 'Endurance et physique'],
  ];
  for (const [re, label] of objectives) {
    if (re.test(n)) return { objective: label, durationMin };
  }
  if (n.includes('seance') || n.includes('entrain')) {
    return { objective: text.trim().slice(0, 120), durationMin };
  }
  return null;
}

function parseWeeklyGoal(text: string): string | null {
  const raw = text.trim();
  const n = normalize(raw);
  const markers = ['mon objectif cette semaine', 'objectif cette semaine', 'mon objectif'];
  for (const m of markers) {
    const idx = n.indexOf(m);
    if (idx >= 0) {
      const slice = raw.slice(idx + m.length).replace(/^[\s:,-]+/, '').trim();
      if (slice.length >= 3) return slice.slice(0, 200);
    }
  }
  return null;
}

/** Détecte actions structurées depuis la requête + facts agent. */
export function detectPlayerCoachActions(
  query: string,
  facts: Record<string, unknown>,
): PlayerAiAction[] {
  const actions: PlayerAiAction[] = [];
  const n = normalize(query);
  const nextEvent = facts.next_event as Record<string, unknown> | null | undefined;

  const training = parseTraining(query);
  if (training && (n.includes('creer') || n.includes('seance') || n.includes('programme'))) {
    actions.push({
      type: 'generate_training',
      objective: training.objective,
      durationMin: training.durationMin,
    });
  }

  const late = parseLateDelay(query);
  if (late && nextEvent?.id) {
    actions.push({
      type: 'report_late',
      eventId: String(nextEvent.id),
      delay: late,
    });
  }

  const goal = parseWeeklyGoal(query);
  if (goal) {
    actions.push({ type: 'save_weekly_goal', goal });
  }

  return actions;
}

/** Suggestions contextuelles post-réponse. */
export function buildPlayerCoachSuggestions(
  facts: Record<string, unknown>,
): string[] {
  const chips: string[] = [];
  const nextEvent = facts.next_event as Record<string, unknown> | null | undefined;

  if (nextEvent?.title) {
    chips.push('Prochain match');
    if (!nextEvent.rsvp_status || String(nextEvent.rsvp_status).startsWith('late')) {
      chips.push('Signaler un retard');
    }
  } else {
    chips.push('Mes matchs');
  }

  if (facts.wellness_score == null) {
    chips.push('Ma forme');
  } else {
    chips.push('Résumé semaine');
  }

  chips.push('Pied faible', 'Créer séance');
  return chips.slice(0, 5);
}

/** Persiste objectif hebdo joueur. */
export async function savePlayerWeeklyFocus(uid: string, goal: string): Promise<void> {
  const value = goal.trim().slice(0, 200);
  if (!value) return;
  await admin
    .firestore()
    .doc(`users/${uid}/v3_prefs/career`)
    .set({ weekly_focus: value, updated_at: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
}
