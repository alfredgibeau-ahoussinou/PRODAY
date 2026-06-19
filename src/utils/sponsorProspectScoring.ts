import type { Club } from '../models/Club';
import type { SponsorOffer } from '../models/SponsorOffer';

export interface ProspectScoreInput {
  club: Pick<Club, 'city' | 'categories' | 'verified' | 'created_at'>;
  sponsorOffers: Pick<SponsorOffer, 'city' | 'target_categories'>[];
  hasActiveFundingGoal?: boolean;
}

export interface ProspectScoreResult {
  match_score: number;
  reason: string;
  category: string;
}

const RECENT_CLUB_DAYS = 90;

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

function zoneMatchLevel(
  offerCities: string[],
  clubCity: string
): 'exact' | 'partial' | 'open' | 'none' {
  const city = normalizeToken(clubCity);
  if (!city) return 'none';
  if (offerCities.length === 0) return 'open';

  let best: 'exact' | 'partial' | 'none' = 'none';
  for (const offerCity of offerCities) {
    const o = normalizeToken(offerCity);
    if (!o) continue;
    if (o === city) return 'exact';
    if (city.includes(o) || o.includes(city)) {
      best = 'partial';
    }
  }
  return best;
}

function categoryOverlap(
  offerCategories: string[],
  clubCategories: string[]
): { score: number; label: string | null } {
  const offers = [...new Set(offerCategories.map(normalizeToken).filter(Boolean))];
  const clubs = clubCategories.map((c) => ({ raw: c, norm: normalizeToken(c) })).filter((c) => c.norm);

  if (offers.length === 0 || clubs.length === 0) {
    return { score: 8, label: clubs[0]?.raw ?? null };
  }

  const matched = clubs.filter((club) =>
    offers.some((offer) => club.norm.includes(offer) || offer.includes(club.norm))
  );
  const ratio = matched.length / Math.max(offers.length, clubs.length, 1);
  const score = Math.min(35, Math.round(ratio * 35) + (matched.length > 0 ? 10 : 0));
  return {
    score,
    label: matched[0]?.raw ?? clubs[0]?.raw ?? null,
  };
}

function isRecentClub(createdAt: Date): boolean {
  const ageMs = Date.now() - createdAt.getTime();
  return ageMs >= 0 && ageMs <= RECENT_CLUB_DAYS * 24 * 60 * 60 * 1000;
}

/** Score prospect sponsor 0–100 à partir de données réelles (offres, club, financement). */
export function scoreSponsorProspect(input: ProspectScoreInput): ProspectScoreResult | null {
  const offerCities = input.sponsorOffers
    .map((o) => o.city)
    .filter((c) => c.trim().length > 0);
  const offerCategories = input.sponsorOffers.flatMap((o) => o.target_categories);

  const zone = zoneMatchLevel(offerCities, input.club.city);
  if (zone === 'none') return null;

  const zoneScore =
    zone === 'exact' ? 35 : zone === 'partial' ? 22 : zone === 'open' ? 12 : 0;

  const { score: categoryScore, label: categoryLabel } = categoryOverlap(
    offerCategories,
    input.club.categories
  );

  const verifiedScore = input.club.verified ? 15 : 0;
  const fundingScore = input.hasActiveFundingGoal ? 10 : 0;
  const recentScore = isRecentClub(input.club.created_at) ? 5 : 0;

  const match_score = Math.min(
    100,
    zoneScore + categoryScore + verifiedScore + fundingScore + recentScore
  );

  const reasons: string[] = [];
  if (zone === 'exact') reasons.push('Même ville que vos offres');
  else if (zone === 'partial') reasons.push('Zone compatible avec vos offres');
  else if (zone === 'open') reasons.push('Aucune zone offre — club visible');

  if (categoryScore >= 25) reasons.push('Catégories alignées avec vos offres');
  else if (categoryScore >= 12) reasons.push('Catégories partiellement alignées');

  if (input.club.verified) reasons.push('Club vérifié');
  if (input.hasActiveFundingGoal) reasons.push('Campagne de financement active');
  if (recentScore > 0) reasons.push('Club récent sur ProDay');

  const reason =
    reasons.length > 0 ? reasons.join(' · ') : 'Correspondance géographique avec vos offres';

  return {
    match_score,
    reason,
    category: categoryLabel ?? input.club.categories[0] ?? 'Club',
  };
}

export function collectOfferCities(offers: Pick<SponsorOffer, 'city' | 'sponsor_uid'>[], sponsorUid: string): string[] {
  return offers
    .filter((o) => o.sponsor_uid === sponsorUid)
    .map((o) => o.city.trim().toLowerCase())
    .filter(Boolean);
}

export function clubPassesZoneFilter(
  clubCity: string,
  offerCities: string[]
): boolean {
  return zoneMatchLevel(offerCities, clubCity) !== 'none';
}
