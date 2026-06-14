import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface BrainProgressionDoc {
  xp?: number;
  level?: number;
  xp_to_next?: number;
  xp_progress?: number;
  streak_days?: number;
  rank_label?: string;
  badges?: unknown[];
}

interface BrainDoc {
  version?: number;
  progression?: BrainProgressionDoc;
  last_action?: string;
}

function progressionXp(data: BrainDoc | undefined): number {
  return data?.progression?.xp ?? 0;
}

/** Empêche la régression XP Brain entre appareils (spec § Scale). */
export const onV3BrainWrite = functions
  .region('europe-west1')
  .firestore.document('users/{uid}/v3_brain/state')
  .onWrite(async (change) => {
    if (!change.after.exists) return;

    const before = change.before.data() as BrainDoc | undefined;
    const after = change.after.data() as BrainDoc | undefined;
    if (!after?.progression) return;

    const beforeXp = progressionXp(before);
    const afterXp = progressionXp(after);
    const beforeStreak = before?.progression?.streak_days ?? 0;
    const afterStreak = after.progression?.streak_days ?? 0;

    const patch: Record<string, unknown> = {};
    if (afterXp < beforeXp) {
      patch['progression.xp'] = beforeXp;
    }
    if (afterStreak < beforeStreak) {
      patch['progression.streak_days'] = beforeStreak;
    }

    if (Object.keys(patch).length === 0) return;

    await change.after.ref.update({
      ...patch,
      merged_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
