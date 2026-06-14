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
import type {
  SponsorOffer,
  ClubFundingGoal,
  SponsorOfferType,
  SponsorAnalytics,
  SponsorActivityItem,
  SponsorContribution,
  SponsorProspect,
} from '../models/SponsorOffer';

const DEMO_OFFERS: SponsorOffer[] = [
  {
    id: 'demo-offer-1',
    sponsor_uid: 'demo-sponsor',
    company_name: 'SportEquip Pro',
    logo_url: '',
    offer_type: 'equipment',
    description: 'Maillots et ballons pour clubs U15 locaux.',
    value: '500 € d’équipement',
    target_categories: ['U15', 'U17'],
    city: 'Lyon',
    active: true,
    created_at: new Date(),
    views_count: 1840,
    clicks_count: 124,
    leads_count: 18,
  },
  {
    id: 'demo-offer-2',
    sponsor_uid: 'demo-sponsor',
    company_name: 'VilleActive',
    logo_url: '',
    offer_type: 'visibility',
    description: 'Banderoles et visibilité sur événements locaux.',
    value: 'Campagne locale',
    target_categories: ['Senior'],
    city: 'Bordeaux',
    active: true,
    created_at: new Date(),
    views_count: 920,
    clicks_count: 61,
    leads_count: 9,
  },
];

const DEMO_GOALS: ClubFundingGoal[] = [
  {
    id: 'demo-goal-1',
    club_id: 'club-demo-1',
    title: 'Nouveaux maillots U17',
    target_amount_eur: 1200,
    raised_amount_eur: 480,
    description: 'Renouvellement tenues pour la saison.',
  },
  {
    id: 'demo-goal-2',
    club_id: 'club-demo-2',
    title: 'Transport tournoi régional',
    target_amount_eur: 800,
    raised_amount_eur: 200,
    description: 'Covoiturage et frais déplacement équipe fanions.',
  },
  {
    id: 'demo-goal-3',
    club_id: 'club-demo-3',
    title: 'Matériel gardien U15',
    target_amount_eur: 650,
    raised_amount_eur: 520,
    description: 'Gants, protège-tibias et sacs sport.',
  },
];

const demoCreatedOffers: SponsorOffer[] = [];
const demoOfferPatches: Record<string, Partial<SponsorOffer>> = {};
const demoGoalRaised: Record<string, number> = {};
const demoContributions: SponsorContribution[] = [];

function demoPartnerSeed(sponsorUid: string, companyName = 'Votre Marque'): SponsorOffer[] {
  const hasOwn = [...demoCreatedOffers, ...DEMO_OFFERS].some((o) => o.sponsor_uid === sponsorUid);
  if (hasOwn) return [];

  return [
    {
      id: `seed-offer-1-${sponsorUid}`,
      sponsor_uid: sponsorUid,
      company_name: companyName,
      logo_url: '',
      offer_type: 'visibility',
      description: 'Visibilité locale sur matchs et tournois — banderoles et réseaux sociaux club.',
      value: 'Pack visibilité saison',
      target_categories: ['U15', 'U17', 'Senior'],
      city: 'Île-de-France',
      active: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
      views_count: 2140,
      clicks_count: 156,
      leads_count: 22,
    },
    {
      id: `seed-offer-2-${sponsorUid}`,
      sponsor_uid: sponsorUid,
      company_name: companyName,
      logo_url: '',
      offer_type: 'equipment',
      description: 'Remise équipement pour clubs partenaires — maillots entraînement et ballons.',
      value: '-15 % équipement',
      target_categories: ['U13', 'U15'],
      city: 'Île-de-France',
      active: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
      views_count: 980,
      clicks_count: 74,
      leads_count: 11,
    },
  ];
}

function applyDemoOfferPatch(offer: SponsorOffer): SponsorOffer {
  const patch = demoOfferPatches[offer.id];
  return patch ? { ...offer, ...patch } : offer;
}

function getDemoOffers(sponsorUid?: string, companyName?: string): SponsorOffer[] {
  const seeded = sponsorUid ? demoPartnerSeed(sponsorUid, companyName) : [];
  const merged = [...demoCreatedOffers, ...seeded, ...DEMO_OFFERS].map(applyDemoOfferPatch);
  const seen = new Set<string>();
  return merged.filter((o) => {
    if (seen.has(o.id)) return false;
    seen.add(o.id);
    return true;
  });
}

function getDemoGoals(): ClubFundingGoal[] {
  return DEMO_GOALS.map((g) => ({
    ...g,
    raised_amount_eur: demoGoalRaised[g.id] ?? g.raised_amount_eur,
  }));
}

function buildDemoAnalytics(sponsorUid: string, offers: SponsorOffer[]): SponsorAnalytics {
  const mine = offers.filter((o) => o.sponsor_uid === sponsorUid);
  const impressions = mine.reduce((s, o) => s + (o.views_count ?? 0), 0) + 420;
  const offerClicks = mine.reduce((s, o) => s + (o.clicks_count ?? 0), 0);
  const leads = mine.reduce((s, o) => s + (o.leads_count ?? 0), 0);
  const clubsReached = Math.max(3, mine.length * 4 + demoContributions.length);
  return {
    impressions,
    profile_views: Math.round(impressions * 0.34),
    offer_clicks: offerClicks,
    clubs_reached: clubsReached,
    leads,
    conversion_rate: offerClicks > 0 ? Math.round((leads / offerClicks) * 100) : 0,
  };
}

function buildDemoActivity(sponsorUid: string, offers: SponsorOffer[]): SponsorActivityItem[] {
  const mine = offers.filter((o) => o.sponsor_uid === sponsorUid && o.active);
  const items: SponsorActivityItem[] = [
    {
      id: 'act-1',
      type: 'lead',
      title: 'Nouveau contact club',
      subtitle: 'FC Villebon — intéressé par votre offre visibilité',
      at: new Date(Date.now() - 1000 * 60 * 45),
    },
    {
      id: 'act-2',
      type: 'offer_view',
      title: 'Pic de vues',
      subtitle: `${mine[0]?.company_name ?? 'Votre offre'} — +86 vues aujourd’hui`,
      at: new Date(Date.now() - 1000 * 60 * 60 * 3),
    },
    {
      id: 'act-3',
      type: 'contribution',
      title: 'Soutien club enregistré',
      subtitle: 'Campagne maillots U17 — 150 €',
      at: new Date(Date.now() - 1000 * 60 * 60 * 26),
    },
    {
      id: 'act-4',
      type: 'message',
      title: 'Message reçu',
      subtitle: 'AS Saint-Michel — demande de devis équipement',
      at: new Date(Date.now() - 1000 * 60 * 60 * 48),
    },
  ];

  if (mine[0]) {
    items.unshift({
      id: 'act-0',
      type: 'offer_published',
      title: 'Offre active',
      subtitle: `${mine[0].value} · ${mine[0].city}`,
      at: mine[0].created_at,
    });
  }

  return items.sort((a, b) => b.at.getTime() - a.at.getTime());
}

const DEMO_PROSPECTS: SponsorProspect[] = [
  {
    id: 'prospect-1',
    name: 'FC Villebon',
    city: 'Villebon-sur-Yvette',
    category: 'U17',
    match_score: 92,
    reason: 'Zone alignée · recherche équipement',
  },
  {
    id: 'prospect-2',
    name: 'AS Saint-Michel',
    city: 'Massy',
    category: 'Senior',
    match_score: 87,
    reason: 'Campagne visibilité en cours',
  },
  {
    id: 'prospect-3',
    name: 'US Torcy Futsal',
    city: 'Torcy',
    category: 'Futsal',
    match_score: 81,
    reason: 'Catégorie ciblée par votre offre',
  },
  {
    id: 'prospect-4',
    name: 'Olympique Juvisy',
    city: 'Juvisy-sur-Orge',
    category: 'U15',
    match_score: 78,
    reason: 'Club actif sur ProDay',
  },
];

export const sponsorsService = {
  async listOffers(max = 20, sponsorUid?: string, companyName?: string): Promise<SponsorOffer[]> {
    if (!isFirebaseConfigured()) {
      return getDemoOffers(sponsorUid, companyName)
        .filter((o) => o.active)
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
        .slice(0, max);
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
      return getDemoGoals()
        .sort((a, b) => b.raised_amount_eur - a.raised_amount_eur)
        .slice(0, max);
    }
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

  async getAnalytics(sponsorUid: string, companyName?: string): Promise<SponsorAnalytics> {
    const offers = await this.listOffers(50, sponsorUid, companyName);
    if (!isFirebaseConfigured()) return buildDemoAnalytics(sponsorUid, offers);
    const mine = offers.filter((o) => o.sponsor_uid === sponsorUid);
    const impressions = mine.reduce((s, o) => s + (o.views_count ?? 0), 0);
    const offerClicks = mine.reduce((s, o) => s + (o.clicks_count ?? 0), 0);
    const leads = mine.reduce((s, o) => s + (o.leads_count ?? 0), 0);
    return {
      impressions,
      profile_views: Math.round(impressions * 0.3),
      offer_clicks: offerClicks,
      clubs_reached: mine.length * 3,
      leads,
      conversion_rate: offerClicks > 0 ? Math.round((leads / offerClicks) * 100) : 0,
    };
  },

  async listActivity(sponsorUid: string, companyName?: string): Promise<SponsorActivityItem[]> {
    const offers = await this.listOffers(50, sponsorUid, companyName);
    if (!isFirebaseConfigured()) return buildDemoActivity(sponsorUid, offers);
    return buildDemoActivity(sponsorUid, offers).slice(0, 5);
  },

  async listContributions(sponsorUid: string): Promise<SponsorContribution[]> {
    if (!isFirebaseConfigured()) {
      return [...demoContributions].sort((a, b) => b.at.getTime() - a.at.getTime());
    }
    return [];
  },

  async listProspects(_sponsorUid: string): Promise<SponsorProspect[]> {
    if (!isFirebaseConfigured()) return DEMO_PROSPECTS;
    return DEMO_PROSPECTS;
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
    if (!isFirebaseConfigured()) {
      const id = `demo-created-${Date.now()}`;
      demoCreatedOffers.unshift({
        id,
        sponsor_uid: input.sponsor_uid,
        company_name: input.company_name,
        logo_url: '',
        offer_type: input.offer_type ?? 'equipment',
        description: input.description,
        value: input.value,
        target_categories: input.target_categories ?? [],
        city: input.city,
        active: true,
        created_at: new Date(),
        views_count: 0,
        clicks_count: 0,
        leads_count: 0,
      });
      return id;
    }

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
      views_count: 0,
      clicks_count: 0,
      leads_count: 0,
      created_at: serverTimestamp(),
    });
    return ref.id;
  },

  async toggleOfferActive(offerId: string, active: boolean): Promise<void> {
    if (!isFirebaseConfigured()) {
      demoOfferPatches[offerId] = { ...demoOfferPatches[offerId], active };
      const created = demoCreatedOffers.find((o) => o.id === offerId);
      if (created) created.active = active;
      return;
    }
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, 'sponsor_offers', offerId), { active });
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
    if (!isFirebaseConfigured()) {
      const goal = getDemoGoals().find((g) => g.id === goalId);
      if (!goal) throw new Error('Objectif introuvable');
      const current = demoGoalRaised[goalId] ?? goal.raised_amount_eur;
      const next = current + amountEur;
      if (next > goal.target_amount_eur) {
        throw new Error('Montant supérieur à l’objectif restant');
      }
      demoGoalRaised[goalId] = next;
      demoContributions.unshift({
        id: `contrib-${Date.now()}`,
        goal_id: goalId,
        goal_title: goal.title,
        amount_eur: amountEur,
        at: new Date(),
      });
      void sponsorUid;
      return;
    }

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
