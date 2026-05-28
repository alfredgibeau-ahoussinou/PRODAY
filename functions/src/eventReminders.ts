import * as admin from 'firebase-admin';
import { sendFcmToUser } from './messaging';

const db = admin.firestore();
const HOUR_MS = 60 * 60 * 1000;

interface TeamEventDoc {
  title?: string;
  city?: string;
  starts_at?: admin.firestore.Timestamp;
  reminder_hours_before?: number;
  invitee_uids?: string[];
  rsvps?: Record<string, string>;
  auto_reminder_sent_at?: admin.firestore.Timestamp;
}

export async function processScheduledEventReminders(): Promise<{
  scanned: number;
  reminded: number;
  pushes: number;
}> {
  const now = Date.now();
  const horizon = new Date(now + 48 * HOUR_MS);

  const snap = await db
    .collection('team_events')
    .where('starts_at', '>=', admin.firestore.Timestamp.now())
    .where('starts_at', '<=', admin.firestore.Timestamp.fromDate(horizon))
    .get();

  let reminded = 0;
  let pushes = 0;

  for (const doc of snap.docs) {
    const data = doc.data() as TeamEventDoc;
    const startsAt = data.starts_at?.toDate();
    if (!startsAt) continue;

    const hoursBefore = data.reminder_hours_before ?? 24;
    const reminderAt = startsAt.getTime() - hoursBefore * HOUR_MS;
    const inWindow = now >= reminderAt && now < reminderAt + HOUR_MS;

    if (!inWindow || data.auto_reminder_sent_at) continue;

    const invitees = data.invitee_uids ?? [];
    const rsvps = data.rsvps ?? {};
    const pending = invitees.filter((uid) => (rsvps[uid] ?? 'pending') === 'pending');

    if (pending.length === 0) continue;

    const dateLabel = startsAt.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    const title = 'Rappel convocation ProDay';
    const body = `${data.title ?? 'Événement'} — ${dateLabel} · ${data.city ?? ''}. Confirmez votre présence.`;

    for (const uid of pending) {
      const sent = await sendFcmToUser(uid, { title, body });
      if (sent) pushes += 1;
    }

    await doc.ref.update({
      auto_reminder_sent_at: admin.firestore.FieldValue.serverTimestamp(),
      last_reminder_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    reminded += 1;
  }

  return { scanned: snap.size, reminded, pushes };
}
