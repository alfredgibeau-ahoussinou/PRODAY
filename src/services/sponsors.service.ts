import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import {
  sponsorOfferFromFirestore,
  fundingGoalFromFirestore,
} from '../lib/firestoreMappers';
import type { SponsorOffer, ClubFundingGoal } from '../models/SponsorOffer';

export const sponsorsService = {
  async listOffers(max = 20): Promise<SponsorOffer[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, 'sponsor_offers'),
        where('active', '==', true),
        orderBy('created_at', 'desc'),
        limit(max)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        sponsorOfferFromFirestore(d.id, d.data() as Record<string, unknown>)
      );
    } catch {
      const snap = await getDocs(collection(database, 'sponsor_offers'));
      return snap.docs
        .map((d) => sponsorOfferFromFirestore(d.id, d.data() as Record<string, unknown>))
        .filter((o) => o.active);
    }
  },

  async listFundingGoals(max = 10): Promise<ClubFundingGoal[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    const snap = await getDocs(collection(database, 'club_funding_goals'));
    return snap.docs
      .slice(0, max)
      .map((d) => fundingGoalFromFirestore(d.id, d.data() as Record<string, unknown>));
  },
};
