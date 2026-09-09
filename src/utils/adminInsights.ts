import type { User, UserRole } from '../models/User';
import type { PlatformStats } from '../services/admin.service';
import type { AdminNavSectionId } from '../features/admin/navigation/adminNavConfig';
import type { Application, RecruitmentPost } from '../models/Player';
import type { SponsorQuoteRequest } from '../models/SponsorQuoteRequest';
import type { SubscriptionUpgradeRequest } from '../models/SubscriptionUpgradeRequest';
import type { Membership } from '../models/Membership';
import type { CommunityReel } from '../models/CommunityReel';
import type { ReelReport } from '../models/ReelReport';
import type { TeamPaymentRequest } from '../models/TeamFinance';
import type { ClubQuoteRequest } from '../services/clubQuote.service';
import { userNeedsAdminVerificationReview } from './adminUserVerification';
import { getRoleLabel } from '../screens/signup/signupFlowConfig';

export type AdminWorkPriority = 'critical' | 'high' | 'medium' | 'low';

export type AdminWorkKind =
  | 'verification'
  | 'reel'
  | 'report'
  | 'payment'
  | 'application'
  | 'post'
  | 'quote'
  | 'club_quote'
  | 'membership'
  | 'subscription_request';

export type AdminWorkItem = {
  id: string;
  kind: AdminWorkKind;
  priority: AdminWorkPriority;
  title: string;
  subtitle: string;
  meta?: string;
  targetSection: AdminNavSectionId;
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
  clubQuotes?: ClubQuoteRequest[];
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
      targetSection: 'users',
      entityId: u.uid,
      createdAt: u.created_at,
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
      targetSection: 'reels',
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
      targetSection: 'reels',
      entityId: report.bookmark_key,
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
      targetSection: 'payments',
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
      targetSection: 'recruitment',
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
      targetSection: 'quotes',
      entityId: quote.id,
      createdAt: quote.created_at,
    });
  }

  for (const quote of (input.clubQuotes ?? []).filter((q) => q.status === 'pending')) {
    items.push({
      id: `clubquote-${quote.id}`,
      kind: 'club_quote',
      priority: 'critical',
      title: `Devis club · ${quote.club_name}`,
      subtitle: `${quote.owner_name} · ${quote.email}`,
      meta: quote.offer_hint,
      targetSection: 'quotes',
      entityId: quote.id,
      createdAt: quote.created_at,
    });
  }

  for (const mem of (input.memberships ?? []).filter((m) => m.status === 'pending')) {
    const clubName = input.clubsById?.[mem.club_id] ?? mem.club_id;
    items.push({
      id: `mem-${mem.id}`,
      kind: 'membership',
      priority: 'high',
      title: `Adhésion · ${mem.player_name}`,
      subtitle: clubName,
      meta: mem.license_number,
      targetSection: 'memberships',
      entityId: mem.id,
      createdAt: mem.requested_at ?? mem.created_at,
    });
  }

  for (const req of (input.subscriptionUpgradeRequests ?? []).filter((r) => r.status === 'pending')) {
    items.push({
      id: `subreq-${req.id}`,
      kind: 'subscription_request',
      priority: 'high',
      title: `Demande abo · ${req.display_name}`,
      subtitle: `${req.plan_id} · ${req.billing === 'yearly' ? 'annuel' : 'mensuel'}`,
      meta: req.email,
      targetSection: 'subscriptions',
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

export function countWorkByKind(items: AdminWorkItem[]): Record<AdminWorkKind, number> {
  const base: Record<AdminWorkKind, number> = {
    verification: 0,
    reel: 0,
    report: 0,
    payment: 0,
    application: 0,
    post: 0,
    quote: 0,
    club_quote: 0,
    membership: 0,
    subscription_request: 0,
  };
  for (const item of items) base[item.kind] += 1;
  return base;
}

export const ADMIN_WORK_KIND_SHORTCUTS: {
  kind: AdminWorkKind;
  label: string;
}[] = [
  { kind: 'club_quote', label: 'Devis clubs' },
  { kind: 'verification', label: 'Vérifs' },
  { kind: 'quote', label: 'Devis sponsors' },
  { kind: 'payment', label: 'Paiements' },
  { kind: 'membership', label: 'Adhésions' },
  { kind: 'subscription_request', label: 'Demandes abo' },
  { kind: 'reel', label: 'Publications' },
  { kind: 'report', label: 'Signalements' },
];

export function moderationLoadScore(stats: PlatformStats): number {
  return (
    stats.pendingVerifications * 3 +
    stats.pendingCommunityReels * 2 +
    stats.reelReports * 2 +
    stats.pendingPayments
  );
}

/** Score santé ProDay 0–100 (heuristique ops, pas uptime infra). */
export function computeProdayHealth(input: {
  stats: PlatformStats | null;
  workCount: number;
  pendingPayments: number;
}): { score: number; label: string } {
  if (!input.stats) return { score: 0, label: 'Indisponible' };
  const pressure =
    input.stats.pendingVerifications * 2 +
    input.stats.reelReports * 3 +
    input.pendingPayments * 2 +
    Math.min(30, input.workCount);
  const score = Math.max(0, Math.min(100, 100 - pressure));
  const label =
    score >= 90 ? 'Excellent' : score >= 75 ? 'Stable' : score >= 55 ? 'Sous tension' : 'Critique';
  return { score, label };
}

export type GlobalSearchResult = {
  id: string;
  kind: 'user' | 'club' | 'post' | 'event';
  title: string;
  subtitle: string;
  targetSection: AdminNavSectionId;
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
        targetSection: 'users',
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
        targetSection: 'clubs',
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
        targetSection: 'clubs',
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
        targetSection: 'overview',
        entityId: e.id,
        focusQuery: e.title,
      });
    }
  }

  return results.slice(0, max);
}
