import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';

export type ClubQuoteRequestInput = {
  club_name: string;
  owner_name: string;
  role?: string;
  members?: string;
  teams?: string;
  coaches?: string;
  categories?: string;
  needs?: string;
  video_gear?: string;
  phone?: string;
  email: string;
  requester_uid?: string;
  offer_hint?: 'club_premium' | 'club_video_pro';
};

/**
 * Demandes de devis Club (Tout inclus / Pro+Veo) — persistance réelle.
 * Admin lit `club_quote_requests` ; pas de faux “merci” sans écriture.
 */
export const clubQuoteService = {
  async submit(input: ClubQuoteRequestInput): Promise<string> {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase non configuré');
    }
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const email = input.email.trim().toLowerCase();
    const clubName = input.club_name.trim();
    const ownerName = input.owner_name.trim();
    if (!email || !clubName || !ownerName) {
      throw new Error('Club, responsable et email sont requis.');
    }

    const ref = await addDoc(collection(database, 'club_quote_requests'), {
      club_name: clubName,
      owner_name: ownerName,
      role: input.role?.trim() || null,
      members: input.members?.trim() || null,
      teams: input.teams?.trim() || null,
      coaches: input.coaches?.trim() || null,
      categories: input.categories?.trim() || null,
      needs: input.needs?.trim() || null,
      video_gear: input.video_gear?.trim() || null,
      phone: input.phone?.trim() || null,
      email,
      requester_uid: input.requester_uid ?? null,
      offer_hint: input.offer_hint ?? 'club_premium',
      status: 'pending',
      source: 'app',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return ref.id;
  },
};
