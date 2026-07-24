import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { User } from '../models/User';
import type { Club } from '../models/Club';
import type { TeamPaymentRequest } from '../models/TeamFinance';
import type { Application, RecruitmentPost } from '../models/Player';
import type { ClubAnnouncement } from '../models/ClubAnnouncement';
import type { TeamEvent } from '../models/TeamEvent';
import type { FriendlyMatch } from '../models/FriendlyMatch';
import type { SponsorOffer, ClubFundingGoal } from '../models/SponsorOffer';
import type { CommunityReel } from '../models/CommunityReel';
import type { ReelReport } from '../models/ReelReport';
import type { SponsorQuoteRequest } from '../models/SponsorQuoteRequest';
import {
  adminService,
  type PlatformStats,
  type PlatformDailySnapshot,
  type TrafficTotals,
  type TrafficDailyRow,
} from '../services/admin.service';
import { userNeedsAdminVerificationReview } from '../utils/adminUserVerification';
import {
  buildAdminWorkQueue,
  computeRoleBreakdown,
  moderationLoadScore,
  type AdminWorkItem,
} from '../utils/adminInsights';
import { sponsorQuoteService } from '../services/sponsorQuote.service';

interface AdminDataContextValue {
  loading: boolean;
  refreshing: boolean;
  lastRefreshedAt: Date | null;
  stats: PlatformStats | null;
  dailySnapshots: PlatformDailySnapshot[];
  trafficTotals: TrafficTotals;
  trafficDaily: TrafficDailyRow[];
  workQueue: AdminWorkItem[];
  roleBreakdown: { role: User['role']; count: number }[];
  moderationScore: number;
  users: User[];
  events: TeamEvent[];
  matches: FriendlyMatch[];
  posts: RecruitmentPost[];
  clubs: Club[];
  payments: TeamPaymentRequest[];
  applications: Application[];
  announcements: ClubAnnouncement[];
  sponsorOffers: SponsorOffer[];
  fundingGoals: ClubFundingGoal[];
  communityReels: CommunityReel[];
  reelReports: ReelReport[];
  sponsorQuoteRequests: SponsorQuoteRequest[];
  userDocCounts: Record<string, number>;
  refresh: () => Promise<void>;
}

const AdminDataContext = createContext<AdminDataContextValue | null>(null);

export const AdminDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [dailySnapshots, setDailySnapshots] = useState<PlatformDailySnapshot[]>([]);
  const [trafficTotals, setTrafficTotals] = useState<TrafficTotals>({
    site_visits: 0,
    app_opens: 0,
    tracking_started_at: null,
    updated_at: null,
  });
  const [trafficDaily, setTrafficDaily] = useState<TrafficDailyRow[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [matches, setMatches] = useState<FriendlyMatch[]>([]);
  const [posts, setPosts] = useState<RecruitmentPost[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [payments, setPayments] = useState<TeamPaymentRequest[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [announcements, setAnnouncements] = useState<ClubAnnouncement[]>([]);
  const [sponsorOffers, setSponsorOffers] = useState<SponsorOffer[]>([]);
  const [fundingGoals, setFundingGoals] = useState<ClubFundingGoal[]>([]);
  const [communityReels, setCommunityReels] = useState<CommunityReel[]>([]);
  const [reelReports, setReelReports] = useState<ReelReport[]>([]);
  const [sponsorQuoteRequests, setSponsorQuoteRequests] = useState<SponsorQuoteRequest[]>([]);
  const [userDocCounts, setUserDocCounts] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    const [
      s,
      u,
      e,
      m,
      p,
      c,
      pay,
      apps,
      ann,
      so,
      fg,
      reels,
      reports,
      snapshots,
      quotes,
      trafficT,
      trafficD,
    ] = await Promise.all([
      adminService.getPlatformStats(),
      adminService.listAllUsers(),
      adminService.listAllTeamEvents(),
      adminService.listAllFriendlyMatches(),
      adminService.listAllRecruitmentPosts(),
      adminService.listAllClubs(),
      adminService.listAllPaymentRequests(),
      adminService.listAllApplications(),
      adminService.listAllClubAnnouncements(),
      adminService.listAllSponsorOffers(),
      adminService.listAllFundingGoals(),
      adminService.listCommunityReels(),
      adminService.listReelReports(),
      adminService.listDailyPlatformSnapshots(14),
      sponsorQuoteService.listForAdmin('pending', 30),
      adminService.getTrafficTotals(),
      adminService.listTrafficDaily(30),
    ]);
    setStats(s);
    setDailySnapshots(snapshots);
    setTrafficTotals(trafficT);
    setTrafficDaily(trafficD);
    setUsers(u);
    setEvents(e);
    setMatches(m);
    setPosts(p);
    setClubs(c);
    setPayments(pay);
    setApplications(apps);
    setAnnouncements(ann);
    setSponsorOffers(so);
    setFundingGoals(fg);
    setCommunityReels(reels);
    setReelReports(reports);
    setSponsorQuoteRequests(quotes);
    setLastRefreshedAt(new Date());

    const pendingReview = u.filter((x) => userNeedsAdminVerificationReview(x));
    const docCounts: Record<string, number> = {};
    await Promise.all(
      pendingReview.slice(0, 24).map(async (x) => {
        const docs = await adminService.listUserDocuments(x.uid);
        docCounts[x.uid] = docs.length;
      }),
    );
    setUserDocCounts(docCounts);
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [load]);

  const workQueue = useMemo(
    () =>
      buildAdminWorkQueue({
        users,
        communityReels,
        reelReports,
        payments,
        applications,
        posts,
        sponsorQuotes: sponsorQuoteRequests,
      }),
    [users, communityReels, reelReports, payments, applications, posts, sponsorQuoteRequests],
  );

  const roleBreakdown = useMemo(() => computeRoleBreakdown(users), [users]);
  const moderationScore = useMemo(
    () => (stats ? moderationLoadScore(stats) : 0),
    [stats],
  );

  const value = useMemo(
    () => ({
      loading,
      refreshing,
      lastRefreshedAt,
      stats,
      dailySnapshots,
      trafficTotals,
      trafficDaily,
      workQueue,
      roleBreakdown,
      moderationScore,
      users,
      events,
      matches,
      posts,
      clubs,
      payments,
      applications,
      announcements,
      sponsorOffers,
      fundingGoals,
      communityReels,
      reelReports,
      sponsorQuoteRequests,
      userDocCounts,
      refresh,
    }),
    [
      loading,
      refreshing,
      lastRefreshedAt,
      stats,
      dailySnapshots,
      trafficTotals,
      trafficDaily,
      workQueue,
      roleBreakdown,
      moderationScore,
      users,
      events,
      matches,
      posts,
      clubs,
      payments,
      applications,
      announcements,
      sponsorOffers,
      fundingGoals,
      communityReels,
      reelReports,
      sponsorQuoteRequests,
      userDocCounts,
      refresh,
    ],
  );

  return (
    <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>
  );
};

export function useAdminData(): AdminDataContextValue {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error('useAdminData doit être utilisé dans AdminDataProvider');
  return ctx;
}
