import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  limit,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import {
  sponsorOfferFromFirestore,
  fundingGoalFromFirestore,
} from '../lib/firestoreMappers';
import type { SponsorOffer, ClubFundingGoal, SponsorOfferType } from '../models/SponsorOffer';

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
        .filter((o) => o.active)
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
        .slice(0, max);
    }
  },

  async listFundingGoals(max = 20): Promise<ClubFundingGoal[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    const snap = await getDocs(collection(database, 'club_funding_goals'));
    return snap.docs
      .map((d) => fundingGoalFromFirestore(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => b.raised_amount_eur - a.raised_amount_eur)
      .slice(0, max);
  },

  async listFundingGoalsForClub(clubId: string): Promise<ClubFundingGoal[]> {
    const all = await this.listFundingGoals(50);
    return all.filter((g) => g.club_id === clubId);
  },

  async createOffer(input: {
    sponsor_uid: string;
    company_name: string;
    description: string;
    value: string;
    city: string;
    offer_type?: SponsorOfferType;
    target_categories?: string[];
  }): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const ref = await addDoc(collection(database, 'sponsor_offers'), {
      sponsor_uid: input.sponsor_uid,
      company_name: input.company_name,
      description: input.description,
      value: input.value,
      city: input.city,
      offer_type: input.offer_type ?? 'equipment',
      target_categories: input.target_categories ?? [],
      logo_url: '',
      active: true,
      created_at: serverTimestamp(),
    });
    return ref.id;
  },

  async createFundingGoal(input: {
    club_id: string;
    title: string;
    description: string;
    target_amount_eur: number;
  }): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const ref = await addDoc(collection(database, 'club_funding_goals'), {
      club_id: input.club_id,
      title: input.title,
      description: input.description,
      target_amount_eur: input.target_amount_eur,
      raised_amount_eur: 0,
      created_at: serverTimestamp(),
    });
    return ref.id;
  },

  async contributeToGoal(goalId: string, amountEur: number): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    if (amountEur <= 0) throw new Error('Montant invalide');

    const ref = doc(database, 'club_funding_goals', goalId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Objectif introuvable');

    const goal = fundingGoalFromFirestore(goalId, snap.data() as Record<string, unknown>);
    const next = goal.raised_amount_eur + amountEur;
    if (next > goal.target_amount_eur) {
      throw new Error('Montant supérieur à l’objectif restant');
    }

    await updateDoc(ref, {
      raised_amount_eur: increment(amountEur),
      updated_at: serverTimestamp(),
    });
  },
};
