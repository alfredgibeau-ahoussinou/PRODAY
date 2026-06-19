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
import { getDb, getFirebaseAuth } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import { callFunction } from '../lib/firebaseFunctions';
import { getSponsorAnonymousId } from '../utils/sponsorAnonymousId';
import { clubsService } from './clubs.service';
import { scoreSponsorProspect } from '../utils/sponsorProspectScoring';
import {
  sponsorOfferFromFirestore,
  fundingGoalFromFirestore,
} from '../lib/firestoreMappers';
import type {
  SponsorOffer,
  ClubFundingGoal,
  SponsorOfferType,
  SponsorAnalytics,
  SponsorActivityItem,
  SponsorContribution,
  SponsorProspect,
} from '../models/SponsorOffer';

const trackedViewsThisSession = new Set<string>();
const trackedProfileViewsThisSession = new Set<string>();

type SponsorTrackEventType = 'offer_view' | 'offer_click' | 'offer_lead' | 'profile_view';

async function invokeSponsorTrack(payload: {
  event: SponsorTrackEventType;
  offer_id?: string;
  sponsor_uid?: string;
}): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const anonymous_id = await getSponsorAnonymousId();
    await callFunction<
      typeof payload & { anonymous_id: string },
      { success: boolean }
    >('trackSponsorEvent', { ...payload, anonymous_id });
  } catch {
    // tracking best-effort
  }
}

const SPONSOR_GEO_PUSH_REGION = 'europe-west1';

async function invokeSponsorGeoPush(offerId: string, options?: { force?: boolean }): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    await callFunction<{ offerId: string; force?: boolean }, { recipients: number; pushes: number }>(
      'notifySponsorOfferInCityCallable',
      { offerId, force: options?.force },
      SPONSOR_GEO_PUSH_REGION
    );
  } catch {
    // push géo best-effort (callable europe-west1)
  }
}

function contributionFromFirestore(id: string, data: Record<string, unknown>): SponsorContribution {
  const at = data.created_at;
  return {
    id,
    goal_id: String(data.goal_id ?? ''),
    goal_title: String(data.goal_title ?? ''),
    amount_eur: Number(data.amount_eur ?? 0),
    at:
      at && typeof at === 'object' && 'toDate' in at
        ? (at as { toDate: () => Date }).toDate()
        : new Date(),
  };
}

function buildLiveActivity(
  sponsorUid: string,
  offers: SponsorOffer[],
  contributions: SponsorContribution[]
): SponsorActivityItem[] {
  const mine = offers.filter((o) => o.sponsor_uid === sponsorUid);
  const items: SponsorActivityItem[] = [];

  for (const offer of mine) {
    items.push({
      id: `pub-${offer.id}`,
      type: 'offer_published',
      title: offer.active ? 'Offre active' : 'Offre en pause',
      subtitle: `${offer.value} · ${offer.city}`,
      at: offer.created_at,
    });
    if ((offer.views_count ?? 0) > 0) {
      items.push({
        id: `view-${offer.id}`,
        type: 'offer_view',
        title: 'Vues sur votre offre',
        subtitle: `${offer.company_name} — ${offer.views_count} vues`,
        at: offer.created_at,
      });
    }
    if ((offer.leads_count ?? 0) > 0) {
      items.push({
        id: `lead-${offer.id}`,
        type: 'lead',
        title: 'Contacts générés',
        subtitle: `${offer.leads_count} lead(s) · ${offer.city}`,
        at: offer.created_at,
      });
    }
  }

  for (const c of contributions) {
    items.push({
      id: `contrib-${c.id}`,
      type: 'contribution',
      title: 'Soutien enregistré',
      subtitle: `${c.goal_title} — ${c.amount_eur} €`,
      at: c.at,
    });
  }

  return items.sort((a, b) => b.at.getTime() - a.at.getTime());
}

async function buildLiveProspects(
  sponsorUid: string,
  offers: SponsorOffer[],
  fundingGoals: ClubFundingGoal[]
): Promise<SponsorProspect[]> {
  const clubs = await clubsService.list(50);
  if (clubs.length === 0) return [];

  const sponsorOffers = offers.filter((o) => o.sponsor_uid === sponsorUid);
  const activeFundingClubIds = new Set(
    fundingGoals
      .filter((g) => g.raised_amount_eur < g.target_amount_eur)
      .map((g) => g.club_id)
  );

  return clubs
    .map((club) => {
      const scored = scoreSponsorProspect({
        club,
        sponsorOffers,
        hasActiveFundingGoal: activeFundingClubIds.has(club.id),
      });
      if (!scored) return null;

      return {
        id: club.id,
        owner_uid: club.owner_uid,
        name: club.name,
        city: club.city,
        category: scored.category,
        match_score: scored.match_score,
        reason: scored.reason,
      } satisfies SponsorProspect;
    })
    .filter((p): p is SponsorProspect => p != null)
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 8);
}

const EMPTY_ANALYTICS: SponsorAnalytics = {
  impressions: 0,
  profile_views: 0,
  offer_clicks: 0,
  clubs_reached: 0,
  leads: 0,
  conversion_rate: 0,
};

export const sponsorsService = {
  async listOffers(max = 20, sponsorUid?: string, companyName?: string): Promise<SponsorOffer[]> {
    void sponsorUid;
    void companyName;
    if (!isFirebaseConfigured()) {
      return [];
    }
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
    if (!isFirebaseConfigured()) {
      return [];
    }
    const database = getDb();
    if (!database) return [];

    const snap = await getDocs(collection(database, 'club_funding_goals'));
    return snap.docs
      .map((d) => fundingGoalFromFirestore(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => b.raised_amount_eur - a.raised_amount_eur)
      .slice(0, max);
  },

  async listOffersBySponsor(sponsorUid: string, max = 50): Promise<SponsorOffer[]> {
    if (!isFirebaseConfigured() || !sponsorUid) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, 'sponsor_offers'),
        where('sponsor_uid', '==', sponsorUid),
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
        .filter((o) => o.sponsor_uid === sponsorUid)
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
        .slice(0, max);
    }
  },

  async listActiveOffersBySponsor(sponsorUid: string, max = 20): Promise<SponsorOffer[]> {
    const offers = await this.listOffersBySponsor(sponsorUid, max);
    return offers.filter((o) => o.active);
  },

  async listFundingGoalsForClub(clubId: string): Promise<ClubFundingGoal[]> {
    const all = await this.listFundingGoals(50);
    return all.filter((g) => g.club_id === clubId);
  },

  async getAnalytics(sponsorUid: string, companyName?: string): Promise<SponsorAnalytics> {
    void companyName;
    if (!isFirebaseConfigured()) return { ...EMPTY_ANALYTICS };
    const mine = await this.listOffersBySponsor(sponsorUid, 100);
    const impressions = mine.reduce((s, o) => s + (o.views_count ?? 0), 0);
    const offerClicks = mine.reduce((s, o) => s + (o.clicks_count ?? 0), 0);
    const leads = mine.reduce((s, o) => s + (o.leads_count ?? 0), 0);
    const [contributions, profileViews] = await Promise.all([
      this.listContributions(sponsorUid),
      this.countProfileViews(sponsorUid),
    ]);
    const fundedGoals = new Set(contributions.map((c) => c.goal_id));
    return {
      impressions,
      profile_views: profileViews,
      offer_clicks: offerClicks,
      clubs_reached: fundedGoals.size,
      leads,
      conversion_rate: offerClicks > 0 ? Math.round((leads / offerClicks) * 100) : 0,
    };
  },

  /**
   * Compte les viewers uniques (uid authentifié ou id anonyme) par sponsor.
   * L’écriture côté serveur déduplique déjà les vues sur 24 h ; ici on agrège
   * l’historique sans double-compter un même viewer.
   */
  async countProfileViews(sponsorUid: string): Promise<number> {
    if (!isFirebaseConfigured()) return 0;
    const database = getDb();
    if (!database) return 0;

    try {
      const snap = await getDocs(
        query(
          collection(database, 'sponsor_profile_views'),
          where('sponsor_uid', '==', sponsorUid),
          limit(500)
        )
      );
      const seen = new Set<string>();
      for (const docSnap of snap.docs) {
        const data = docSnap.data() as Record<string, unknown>;
        const key =
          typeof data.viewer_uid === 'string' && data.viewer_uid
            ? `uid:${data.viewer_uid}`
            : typeof data.viewer_anonymous_id === 'string' && data.viewer_anonymous_id
              ? `anon:${data.viewer_anonymous_id}`
              : `doc:${docSnap.id}`;
        seen.add(key);
      }
      return seen.size;
    } catch {
      return 0;
    }
  },

  async listActivity(sponsorUid: string, companyName?: string): Promise<SponsorActivityItem[]> {
    if (!isFirebaseConfigured()) return [];
    const offers = await this.listOffersBySponsor(sponsorUid, 50);
    const contributions = await this.listContributions(sponsorUid);
    return buildLiveActivity(sponsorUid, offers, contributions).slice(0, 12);
  },

  async listContributions(sponsorUid: string): Promise<SponsorContribution[]> {
    if (!isFirebaseConfigured()) {
      return [];
    }
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, 'sponsor_contributions'),
        where('sponsor_uid', '==', sponsorUid),
        orderBy('created_at', 'desc'),
        limit(30)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        contributionFromFirestore(d.id, d.data() as Record<string, unknown>)
      );
    } catch {
      const q = query(
        collection(database, 'sponsor_contributions'),
        where('sponsor_uid', '==', sponsorUid),
        limit(30)
      );
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => contributionFromFirestore(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.at.getTime() - a.at.getTime());
    }
  },

  async listProspects(sponsorUid: string): Promise<SponsorProspect[]> {
    if (!isFirebaseConfigured()) return [];
    const [offers, fundingGoals] = await Promise.all([
      this.listOffers(30, sponsorUid),
      this.listFundingGoals(50),
    ]);
    return buildLiveProspects(sponsorUid, offers, fundingGoals);
  },

  async trackOfferView(offerId: string): Promise<void> {
    if (!isFirebaseConfigured() || trackedViewsThisSession.has(offerId)) return;
    trackedViewsThisSession.add(offerId);
    await invokeSponsorTrack({ event: 'offer_view', offer_id: offerId });
  },

  async trackOfferClick(offerId: string): Promise<void> {
    await invokeSponsorTrack({ event: 'offer_click', offer_id: offerId });
  },

  async trackOfferLead(offerId: string): Promise<void> {
    await invokeSponsorTrack({ event: 'offer_lead', offer_id: offerId });
  },

  async trackSponsorProfileView(sponsorUid: string): Promise<void> {
    if (!isFirebaseConfigured() || !sponsorUid || trackedProfileViewsThisSession.has(sponsorUid)) {
      return;
    }
    const auth = getFirebaseAuth();
    const viewerUid = auth?.currentUser?.uid;
    if (viewerUid === sponsorUid) return;

    trackedProfileViewsThisSession.add(sponsorUid);
    await invokeSponsorTrack({ event: 'profile_view', sponsor_uid: sponsorUid });
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
    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');

    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const city = input.city.trim();
    const ref = await addDoc(collection(database, 'sponsor_offers'), {
      sponsor_uid: input.sponsor_uid,
      company_name: input.company_name,
      description: input.description,
      value: input.value,
      city,
      geo_target_city: city.toLowerCase(),
      offer_type: input.offer_type ?? 'equipment',
      target_categories: input.target_categories ?? [],
      logo_url: '',
      active: true,
      views_count: 0,
      clicks_count: 0,
      leads_count: 0,
      created_at: serverTimestamp(),
    });
    void invokeSponsorGeoPush(ref.id);
    return ref.id;
  },

  async toggleOfferActive(offerId: string, active: boolean): Promise<void> {
    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, 'sponsor_offers', offerId), { active });
    if (active) void invokeSponsorGeoPush(offerId);
  },

  async duplicateOffer(offer: SponsorOffer): Promise<string> {
    return this.createOffer({
      sponsor_uid: offer.sponsor_uid ?? '',
      company_name: offer.company_name,
      description: `${offer.description} (copie)`,
      value: offer.value,
      city: offer.city,
      offer_type: offer.offer_type,
      target_categories: offer.target_categories,
    });
  },

  async createFundingGoal(input: {
    club_id: string;
    title: string;
    description: string;
    target_amount_eur: number;
  }): Promise<string> {
    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');
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

  async contributeToGoal(goalId: string, amountEur: number, sponsorUid?: string): Promise<void> {
    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');

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

    if (sponsorUid) {
      await addDoc(collection(database, 'sponsor_contributions'), {
        sponsor_uid: sponsorUid,
        goal_id: goalId,
        goal_title: goal.title,
        amount_eur: amountEur,
        created_at: serverTimestamp(),
      });
    }
  },
};
