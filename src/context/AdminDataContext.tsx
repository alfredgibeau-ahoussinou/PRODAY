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
import type { Tournament } from '../models/Tournament';
import type { SponsorOffer, ClubFundingGoal } from '../models/SponsorOffer';
import { adminService, type PlatformStats } from '../services/admin.service';

interface AdminDataContextValue {
  loading: boolean;
  refreshing: boolean;
  stats: PlatformStats | null;
  users: User[];
  events: TeamEvent[];
  matches: FriendlyMatch[];
  posts: RecruitmentPost[];
  tournaments: Tournament[];
  clubs: Club[];
  payments: TeamPaymentRequest[];
  applications: Application[];
  announcements: ClubAnnouncement[];
  sponsorOffers: SponsorOffer[];
  fundingGoals: ClubFundingGoal[];
  userDocCounts: Record<string, number>;
  refresh: () => Promise<void>;
}

const AdminDataContext = createContext<AdminDataContextValue | null>(null);

export const AdminDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [matches, setMatches] = useState<FriendlyMatch[]>([]);
  const [posts, setPosts] = useState<RecruitmentPost[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [payments, setPayments] = useState<TeamPaymentRequest[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [announcements, setAnnouncements] = useState<ClubAnnouncement[]>([]);
  const [sponsorOffers, setSponsorOffers] = useState<SponsorOffer[]>([]);
  const [fundingGoals, setFundingGoals] = useState<ClubFundingGoal[]>([]);
  const [userDocCounts, setUserDocCounts] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    const [s, u, e, m, p, t, c, pay, apps, ann, so, fg] = await Promise.all([
      adminService.getPlatformStats(),
      adminService.listAllUsers(),
      adminService.listAllTeamEvents(),
      adminService.listAllFriendlyMatches(),
      adminService.listAllRecruitmentPosts(),
      adminService.listAllTournaments(),
      adminService.listAllClubs(),
      adminService.listAllPaymentRequests(),
      adminService.listAllApplications(),
      adminService.listAllClubAnnouncements(),
      adminService.listAllSponsorOffers(),
      adminService.listAllFundingGoals(),
    ]);
    setStats(s);
    setUsers(u);
    setEvents(e);
    setMatches(m);
    setPosts(p);
    setTournaments(t);
    setClubs(c);
    setPayments(pay);
    setApplications(apps);
    setAnnouncements(ann);
    setSponsorOffers(so);
    setFundingGoals(fg);

    const pendingStaff = u.filter(
      (x) =>
        (x.role === 'coach' || x.role === 'agent') && x.verification_status === 'PENDING'
    );
    const docCounts: Record<string, number> = {};
    await Promise.all(
      pendingStaff.slice(0, 12).map(async (x) => {
        const docs = await adminService.listUserDocuments(x.uid);
        docCounts[x.uid] = docs.length;
      })
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

  const value = useMemo(
    () => ({
      loading,
      refreshing,
      stats,
      users,
      events,
      matches,
      posts,
      tournaments,
      clubs,
      payments,
      applications,
      announcements,
      sponsorOffers,
      fundingGoals,
      userDocCounts,
      refresh,
    }),
    [
      loading,
      refreshing,
      stats,
      users,
      events,
      matches,
      posts,
      tournaments,
      clubs,
      payments,
      applications,
      announcements,
      sponsorOffers,
      fundingGoals,
      userDocCounts,
      refresh,
    ]
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
