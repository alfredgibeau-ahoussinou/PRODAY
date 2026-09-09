import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { User } from '../../../models/User';
import type { Club } from '../../../models/Club';
import type { TeamPaymentRequest } from '../../../models/TeamFinance';
import type { Application, RecruitmentPost } from '../../../models/Player';
import type { ClubAnnouncement } from '../../../models/ClubAnnouncement';
import type { TeamEvent } from '../../../models/TeamEvent';
import type { FriendlyMatch } from '../../../models/FriendlyMatch';
import type { SponsorOffer, ClubFundingGoal } from '../../../models/SponsorOffer';
import type { CommunityReel } from '../../../models/CommunityReel';
import type { ReelReport } from '../../../models/ReelReport';
import type { SponsorQuoteRequest } from '../../../models/SponsorQuoteRequest';
import type { SubscriptionUpgradeRequest } from '../../../models/SubscriptionUpgradeRequest';
import type { Membership } from '../../../models/Membership';
import type { StageOffer } from '../../../models/Stage';
import type { ClubCamera } from '../../../models/ClubCameras';
import {
  adminService,
  type AdminTeam,
  type AdminTournament,
  type PlatformStats,
  type PlatformDailySnapshot,
  type TrafficTotals,
  type TrafficDailyRow,
} from '../../../services/admin.service';
import { userNeedsAdminVerificationReview } from '../../../utils/adminUserVerification';
import {
  buildAdminWorkQueue,
  computeProdayHealth,
  computeRoleBreakdown,
  moderationLoadScore,
  type AdminWorkItem,
} from '../../../utils/adminInsights';
import { sponsorQuoteService } from '../../../services/sponsorQuote.service';
import { subscriptionUpgradeRequestService } from '../../../services/subscriptionUpgradeRequest.service';
import {
  clubQuoteService,
  type ClubQuoteRequest,
} from '../../../services/clubQuote.service';

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
  health: { score: number; label: string };
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
  pendingMemberships: Membership[];
  sponsorQuoteRequests: SponsorQuoteRequest[];
  clubQuoteRequests: ClubQuoteRequest[];
  subscriptionUpgradeRequests: SubscriptionUpgradeRequest[];
  stageOffers: StageOffer[];
  tournaments: AdminTournament[];
  teams: AdminTeam[];
  cameras: ClubCamera[];
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
  const [pendingMemberships, setPendingMemberships] = useState<Membership[]>([]);
  const [sponsorQuoteRequests, setSponsorQuoteRequests] = useState<SponsorQuoteRequest[]>([]);
  const [clubQuoteRequests, setClubQuoteRequests] = useState<ClubQuoteRequest[]>([]);
  const [subscriptionUpgradeRequests, setSubscriptionUpgradeRequests] = useState<
    SubscriptionUpgradeRequest[]
  >([]);
  const [stageOffers, setStageOffers] = useState<StageOffer[]>([]);
  const [tournaments, setTournaments] = useState<AdminTournament[]>([]);
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [cameras, setCameras] = useState<ClubCamera[]>([]);
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
      clubQuotes,
      trafficT,
      trafficD,
      stages,
      tourneys,
      subUpgradeReqs,
      memberships,
      cams,
      teamRows,
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
      sponsorQuoteService.listForAdmin('all', 80),
      clubQuoteService.listForAdmin('all', 80),
      adminService.getTrafficTotals(),
      adminService.listTrafficDaily(30),
      adminService.listAllStageOffers(100),
      adminService.listAllTournaments(100),
      subscriptionUpgradeRequestService.listPendingForAdmin(50),
      adminService.listPendingMemberships(100),
      adminService.listAllClubCameras(120),
      adminService.listAllTeams(200),
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
    setPendingMemberships(memberships);
    setSponsorQuoteRequests(quotes);
    setClubQuoteRequests(clubQuotes);
    setSubscriptionUpgradeRequests(subUpgradeReqs);
    setStageOffers(stages);
    setTournaments(tourneys);
    setTeams(teamRows);
    setCameras(cams);
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
        clubQuotes: clubQuoteRequests,
        subscriptionUpgradeRequests,
        memberships: pendingMemberships,
        clubsById: Object.fromEntries(clubs.map((club) => [club.id, club.name])),
      }),
    [
      users,
      communityReels,
      reelReports,
      payments,
      applications,
      posts,
      sponsorQuoteRequests,
      clubQuoteRequests,
      subscriptionUpgradeRequests,
      pendingMemberships,
      clubs,
    ],
  );

  const roleBreakdown = useMemo(() => computeRoleBreakdown(users), [users]);
  const moderationScore = useMemo(
    () => (stats ? moderationLoadScore(stats) : 0),
    [stats],
  );
  const health = useMemo(
    () =>
      computeProdayHealth({
        stats,
        workCount: workQueue.length,
        pendingPayments: payments.filter((p) => p.status === 'pending').length,
      }),
    [stats, workQueue.length, payments],
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
      health,
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
      pendingMemberships,
      sponsorQuoteRequests,
      clubQuoteRequests,
      subscriptionUpgradeRequests,
      stageOffers,
      tournaments,
      teams,
      cameras,
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
      health,
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
      pendingMemberships,
      sponsorQuoteRequests,
      clubQuoteRequests,
      subscriptionUpgradeRequests,
      stageOffers,
      tournaments,
      teams,
      cameras,
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
