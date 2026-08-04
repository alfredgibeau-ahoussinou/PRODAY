import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { sendFcmToUser } from './messaging';

const db = admin.firestore();

type PositionFilterId = 'all' | 'gk' | 'def' | 'mid' | 'fwd';

type MercatoAlertDoc = {
  uid: string;
  search?: string;
  position?: PositionFilterId;
  level?: string;
  category?: string;
  city?: string;
  enabled?: boolean;
};

function postMatchesPositionFilter(position: string, filter: PositionFilterId): boolean {
  if (filter === 'all') return true;
  const p = position.toLowerCase();
  switch (filter) {
    case 'gk':
      return p.includes('gard') || p.includes('gb');
    case 'def':
      return (
        p.includes('déf') ||
        p.includes('def') ||
        p.includes('latéral') ||
        p.includes('central')
      );
    case 'mid':
      return p.includes('milieu') || p.includes('médian') || p.includes('relayeur');
    case 'fwd':
      return (
        p.includes('attaquant') ||
        p.includes('ailier') ||
        p.includes('buteur') ||
        p.includes('pointe')
      );
    default:
      return true;
  }
}

function postMatchesTextSearch(
  post: {
    club_name?: string;
    position?: string;
    title?: string;
    city?: string;
    category?: string;
    level?: string;
  },
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    String(post.club_name ?? '').toLowerCase().includes(q) ||
    String(post.position ?? '').toLowerCase().includes(q) ||
    String(post.title ?? '').toLowerCase().includes(q) ||
    String(post.city ?? '').toLowerCase().includes(q) ||
    String(post.category ?? '').toLowerCase().includes(q) ||
    String(post.level ?? '').toLowerCase().includes(q)
  );
}

export function postMatchesMercatoAlert(
  post: {
    author_uid?: string;
    club_name?: string;
    position?: string;
    title?: string;
    city?: string;
    category?: string;
    level?: string;
    status?: string;
  },
  alert: MercatoAlertDoc,
  alertUid: string
): boolean {
  if (!alert.enabled) return false;
  if (post.status && post.status !== 'OPEN') return false;
  if (post.author_uid && post.author_uid === alertUid) return false;

  const position = (alert.position ?? 'all') as PositionFilterId;
  if (!postMatchesPositionFilter(String(post.position ?? ''), position)) return false;

  const level = alert.level ?? 'all';
  if (level !== 'all' && post.level !== level) return false;

  const category = alert.category ?? 'all';
  if (category !== 'all' && post.category !== category) return false;

  const cityQ = String(alert.city ?? '').trim().toLowerCase();
  if (cityQ && !String(post.city ?? '').toLowerCase().includes(cityQ)) return false;

  return postMatchesTextSearch(post, String(alert.search ?? ''));
}

/** Nouvelle annonce mercato → push (Gen2, europe-west1 / Firestore eur3). */
export const onRecruitmentPostCreated = onDocumentCreated(
  { document: 'recruitment_posts/{postId}', region: 'europe-west1' },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const post = snap.data();
    if (String(post.status ?? 'OPEN') !== 'OPEN') return;

    const clubName = String(post.club_name ?? 'Un club');
    const position = String(post.position ?? 'poste');
    const title = `Nouvelle annonce — ${clubName}`;
    const body = `${position}${post.city ? ` · ${post.city}` : ''}`;

    const alertsSnap = await db
      .collection('mercato_alerts')
      .where('enabled', '==', true)
      .get();

    let sent = 0;
    for (const alertDoc of alertsSnap.docs) {
      const alert = alertDoc.data() as MercatoAlertDoc;
      const uid = alertDoc.id;
      if (!postMatchesMercatoAlert(post, alert, uid)) continue;

      const ok = await sendFcmToUser(uid, {
        title,
        body,
        data: {
          type: 'mercato_alert',
          postId: snap.id,
          clubName,
        },
      });
      if (ok) sent += 1;
    }

    console.log(`[onRecruitmentPostCreated] ${snap.id} → ${sent} push(es)`);
  }
);
