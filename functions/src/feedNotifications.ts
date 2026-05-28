import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendPushToUser } from './messaging';

const db = admin.firestore();

const PUSH_CAP = 80;

async function notifyUsersWithRole(
  roles: string[],
  payload: { title: string; body: string; data?: Record<string, string> },
  excludeUid?: string
): Promise<number> {
  let pushes = 0;
  for (const role of roles) {
    const snap = await db.collection('users').where('role', '==', role).limit(PUSH_CAP).get();
    for (const doc of snap.docs) {
      if (doc.id === excludeUid) continue;
      const sent = await sendPushToUser(doc.id, payload);
      if (sent) pushes += 1;
    }
  }
  return pushes;
}

/** Nouvelle publication fil ProDay */
export const onPlatformFeedCreated = functions.firestore
  .document('platform_feed/{postId}')
  .onCreate(async (snap) => {
    const data = snap.data();
    const authorUid = data.author_uid as string | undefined;
    const type = String(data.type ?? 'news');
    const audience = String(data.audience ?? 'all');
    const title = String(data.title ?? 'ProDay');
    const authorName = String(data.author_name ?? 'ProDay');

    const body =
      type === 'poll'
        ? `${authorName} a lancé un sondage agents : ${title}`
        : `${authorName} : ${title}`;

    const payload = {
      title: type === 'poll' ? 'Nouveau sondage agents' : 'Fil ProDay',
      body: body.slice(0, 160),
      data: { type: 'platform_feed', postId: snap.id },
    };

    let pushes = 0;
    if (audience === 'agents') {
      pushes = await notifyUsersWithRole(['agent'], payload, authorUid);
    } else {
      pushes = await notifyUsersWithRole(
        ['player', 'coach', 'agent', 'physio', 'organizer'],
        payload,
        authorUid
      );
    }

    console.log(`[onPlatformFeedCreated] ${snap.id} → ${pushes} push(es)`);
  });

/** Nouveau message → push destinataire */
export const onChatMessageCreated = functions.firestore
  .document('messages/{messageId}')
  .onCreate(async (snap) => {
    const data = snap.data();
    const receiverUid = data.receiver_id as string | undefined;
    const senderUid = data.sender_id as string | undefined;
    const text = String(data.body ?? '').slice(0, 120);
    if (!receiverUid || receiverUid === senderUid) return;

    let senderName = 'ProDay';
    if (senderUid) {
      const senderSnap = await db.doc(`users/${senderUid}`).get();
      senderName = String(senderSnap.data()?.display_name ?? 'Un membre');
    }

    await sendPushToUser(receiverUid, {
      title: `Message de ${senderName}`,
      body: text || 'Nouveau message',
      data: {
        type: 'chat_message',
        threadId: String(data.thread_id ?? ''),
        messageId: snap.id,
      },
    });
  });
