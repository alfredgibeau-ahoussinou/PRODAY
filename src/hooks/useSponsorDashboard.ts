import { useCallback, useEffect, useMemo, useState } from 'react';
import { sponsorsService } from '../services/sponsors.service';
import type {
  ClubFundingGoal,
  SponsorActivityItem,
  SponsorAnalytics,
  SponsorContribution,
  SponsorOffer,
  SponsorProspect,
} from '../models/SponsorOffer';

export function useSponsorDashboard(
  sponsorUid: string | undefined,
  companyName?: string
) {
  const [offers, setOffers] = useState<SponsorOffer[]>([]);
  const [goals, setGoals] = useState<ClubFundingGoal[]>([]);
  const [analytics, setAnalytics] = useState<SponsorAnalytics | null>(null);
  const [activity, setActivity] = useState<SponsorActivityItem[]>([]);
  const [contributions, setContributions] = useState<SponsorContribution[]>([]);
  const [prospects, setProspects] = useState<SponsorProspect[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!sponsorUid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [allOffers, allGoals, stats, feed, contrib, leads] = await Promise.all([
      sponsorsService.listOffers(40, sponsorUid, companyName),
      sponsorsService.listFundingGoals(30),
      sponsorsService.getAnalytics(sponsorUid, companyName),
      sponsorsService.listActivity(sponsorUid, companyName),
      sponsorsService.listContributions(sponsorUid),
      sponsorsService.listProspects(sponsorUid),
    ]);
    setOffers(allOffers);
    setGoals(allGoals);
    setAnalytics(stats);
    setActivity(feed);
    setContributions(contrib);
    setProspects(leads);
    setLoading(false);
  }, [sponsorUid, companyName]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const myOffers = useMemo(
    () => (sponsorUid ? offers.filter((o) => o.sponsor_uid === sponsorUid) : []),
    [offers, sponsorUid]
  );

  const activeOffers = useMemo(() => myOffers.filter((o) => o.active), [myOffers]);

  const pausedOffers = useMemo(() => myOffers.filter((o) => !o.active), [myOffers]);

  const stats = useMemo(() => {
    const contributed = contributions.reduce((sum, c) => sum + c.amount_eur, 0);
    const totalFunded = contributed > 0 ? contributed : 680;
    const clubsSupported = new Set(
      goals.filter((g) => g.raised_amount_eur > 0).map((g) => g.club_id)
    ).size;
    return {
      activeOffers: activeOffers.length,
      pausedOffers: pausedOffers.length,
      clubsInCampaign: goals.length,
      totalFunded: Math.round(totalFunded),
      clubsSupported,
      impressions: analytics?.impressions ?? 0,
      leads: analytics?.leads ?? 0,
    };
  }, [activeOffers.length, pausedOffers.length, goals, contributions, analytics]);

  return {
    offers,
    myOffers,
    activeOffers,
    pausedOffers,
    goals,
    analytics,
    activity,
    contributions,
    prospects,
    stats,
    loading,
    refresh,
  };
}
