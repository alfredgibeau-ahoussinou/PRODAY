import type { User, UserRole } from '../models/User';
import type { PlatformStats } from '../services/admin.service';
import type { AdminSectionId } from '../navigation/adminNavConfig';
import { adminSectionForSearchKind } from '../navigation/adminNavConfig';
import type { Application, RecruitmentPost } from '../models/Player';
import type { SponsorQuoteRequest } from '../models/SponsorQuoteRequest';
import type { SubscriptionUpgradeRequest } from '../models/SubscriptionUpgradeRequest';
import type { CommunityReel } from '../models/CommunityReel';
import type { ReelReport } from '../models/ReelReport';
import type { TeamPaymentRequest } from '../models/TeamFinance';
import type { Membership } from '../models/Membership';
import { userNeedsAdminVerificationReview } from './adminUserVerification';
import { getRoleLabel } from '../screens/signup/signupFlowConfig';

export type AdminWorkPriority = 'critical' | 'high' | 'medium' | 'low';

export type AdminWorkItem = {
  id: string;
  kind:
    | 'verification'
    | 'reel'
    | 'report'
    | 'payment'
    | 'application'
    | 'post'
    | 'quote'
    | 'subscription_request'
    | 'membership';
  priority: AdminWorkPriority;
  title: string;
  subtitle: string;
  meta?: string;
  targetSection: AdminSectionId;
  targetTab?: string;
  entityId?: string;
  createdAt?: Date;
};

const PRIORITY_ORDER: Record<AdminWorkPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function computeRoleBreakdown(users: User[]): { role: UserRole; count: number }[] {
  const map = new Map<UserRole, number>();
  for (const u of users) {
    map.set(u.role, (map.get(u.role) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count);
}

export function computeStatDelta(current: number, previous?: number): number | null {
  if (previous == null || previous === 0) return null;
  return current - previous;
}

export function buildAdminWorkQueue(input: {
  users: User[];
  communityReels: CommunityReel[];
  reelReports: ReelReport[];
  payments: TeamPaymentRequest[];
  applications: Application[];
  posts: RecruitmentPost[];
  sponsorQuotes?: SponsorQuoteRequest[];
  subscriptionUpgradeRequests?: SubscriptionUpgradeRequest[];
  memberships?: Membership[];
  clubsById?: Record<string, string>;
}): AdminWorkItem[] {
  const items: AdminWorkItem[] = [];

  for (const u of input.users.filter(userNeedsAdminVerificationReview)) {
    items.push({
      id: `verify-${u.uid}`,
      kind: 'verification',
      priority: 'critical',
      title: `Vérifier ${u.display_name}`,
      subtitle: `${getRoleLabel(u.role)} · ${u.email}`,
      meta: u.city ?? undefined,
      targetSection: 'utilisateurs',
      entityId: u.uid,
      createdAt: u.created_at,
    });
  }

  for (const m of (input.memberships ?? []).filter((x) => x.status === 'pending')) {
    const clubName = input.clubsById?.[m.club_id] ?? m.club_id;
    items.push({
      id: `membership-${m.id}`,
      kind: 'membership',
      priority: 'high',
      title: `Adhésion club · ${m.player_name}`,
      subtitle: `Demande pour ${clubName}`,
      meta: m.club_id,
      targetSection: 'utilisateurs',
      entityId: m.id,
      createdAt: m.requested_at,
    });
  }

  for (const reel of input.communityReels.filter((r) => r.status === 'pending')) {
    items.push({
      id: `reel-${reel.id}`,
      kind: 'reel',
      priority: 'high',
      title: `Modérer publication · ${reel.author_name}`,
      subtitle: reel.caption?.slice(0, 80) || 'Sans légende',
      meta: reel.theme,
      targetSection: 'contenus',
      targetTab: 'fil',
      createdAt: reel.created_at,
    });
  }

  for (const report of input.reelReports) {
    items.push({
      id: `report-${report.id}`,
      kind: 'report',
      priority: 'high',
      title: 'Signalement publication',
      subtitle: report.reason,
      meta: report.bookmark_key.slice(0, 24),
      targetSection: 'signalements',
      targetTab: 'decisions',
      createdAt: report.created_at,
    });
  }

  for (const pay of input.payments.filter((p) => p.status === 'pending')) {
    items.push({
      id: `pay-${pay.id}`,
      kind: 'payment',
      priority: 'medium',
      title: `Paiement en attente · ${pay.label}`,
      subtitle: `${pay.amount_eur} €`,
      meta: pay.club_id,
      targetSection: 'abonnements',
      targetTab: 'paiements',
      createdAt: pay.created_at,
    });
  }

  for (const app of input.applications.filter((a) => a.status === 'PENDING')) {
    items.push({
      id: `app-${app.id}`,
      kind: 'application',
      priority: 'medium',
      title: `Candidature · ${app.player_name ?? 'Joueur'}`,
      subtitle: app.cover_letter.slice(0, 72),
      targetSection: 'recrutement',
      targetTab: 'apps',
      createdAt: app.created_at,
    });
  }

  for (const quote of (input.sponsorQuotes ?? []).filter((q) => q.status === 'pending')) {
    items.push({
      id: `quote-${quote.id}`,
      kind: 'quote',
      priority: 'high',
      title: `Devis partenaire · ${quote.company_name}`,
      subtitle: `${quote.contact_name} · ${quote.contact_email}`,
      meta: quote.package_tier,
      targetSection: 'sponsors',
      targetTab: 'sponsors',
      createdAt: quote.created_at,
    });
  }

  for (const req of (input.subscriptionUpgradeRequests ?? []).filter((r) => r.status === 'pending')) {
    items.push({
      id: `sub-req-${req.id}`,
      kind: 'subscription_request',
      priority: 'high',
      title: `Demande Pro bêta · ${req.display_name}`,
      subtitle: `${req.email} · ${req.plan_id}`,
      targetSection: 'abonnements',
      targetTab: 'abonnements',
      entityId: req.user_uid,
      createdAt: req.created_at,
    });
  }

  return items.sort((a, b) => {
    const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (p !== 0) return p;
    const at = a.createdAt?.getTime() ?? 0;
    const bt = b.createdAt?.getTime() ?? 0;
    return bt - at;
  });
}

export function countWorkByKind(items: AdminWorkItem[]): Record<AdminWorkItem['kind'], number> {
  const base: Record<AdminWorkItem['kind'], number> = {
    verification: 0,
    reel: 0,
    report: 0,
    payment: 0,
    application: 0,
    post: 0,
    quote: 0,
    subscription_request: 0,
    membership: 0,
  };
  for (const item of items) base[item.kind] += 1;
  return base;
}

export function moderationLoadScore(stats: PlatformStats): number {
  return (
    stats.pendingVerifications * 3 +
    stats.pendingCommunityReels * 2 +
    stats.reelReports * 2 +
    stats.pendingPayments
  );
}

export type GlobalSearchResult = {
  id: string;
  kind: 'user' | 'club' | 'post' | 'event';
  title: string;
  subtitle: string;
  targetSection: AdminSectionId;
  targetTab?: string;
  entityId?: string;
  focusQuery?: string;
};

export function globalAdminSearch(
  query: string,
  data: {
    users: User[];
    clubs: { id: string; name: string; city: string }[];
    posts: { id: string; title: string; club_name: string; city: string }[];
    events: { id: string; title: string; city: string }[];
  },
  max = 20,
): GlobalSearchResult[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const results: GlobalSearchResult[] = [];

  for (const u of data.users) {
    if (
      u.display_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.city?.toLowerCase().includes(q) ?? false)
    ) {
      results.push({
        id: `u-${u.uid}`,
        kind: 'user',
        title: u.display_name,
        subtitle: `${getRoleLabel(u.role)} · ${u.email}`,
        targetSection: adminSectionForSearchKind('user'),
        entityId: u.uid,
        focusQuery: u.display_name,
      });
    }
  }

  for (const c of data.clubs) {
    if (c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)) {
      results.push({
        id: `c-${c.id}`,
        kind: 'club',
        title: c.name,
        subtitle: c.city,
        targetSection: adminSectionForSearchKind('club'),
        entityId: c.id,
        focusQuery: c.name,
      });
    }
  }

  for (const p of data.posts) {
    if (
      p.title.toLowerCase().includes(q) ||
      p.club_name.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q)
    ) {
      results.push({
        id: `p-${p.id}`,
        kind: 'post',
        title: p.title,
        subtitle: `${p.club_name} · ${p.city}`,
        targetSection: adminSectionForSearchKind('post'),
        targetTab: 'posts',
        entityId: p.id,
        focusQuery: p.title,
      });
    }
  }

  for (const e of data.events) {
    if (e.title.toLowerCase().includes(q) || e.city.toLowerCase().includes(q)) {
      results.push({
        id: `e-${e.id}`,
        kind: 'event',
        title: e.title,
        subtitle: e.city,
        targetSection: adminSectionForSearchKind('event'),
        targetTab: 'competitions',
        entityId: e.id,
        focusQuery: e.title,
      });
    }
  }

  return results.slice(0, max);
}
