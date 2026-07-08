import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  setDoc,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { User, UserRole, VerificationStatus, PlayerVerificationCheckId } from '../models/User';
import {
  computePlayerVerificationStatus,
  defaultPlayerVerificationState,
} from '../models/User';
import type { TeamEvent } from '../models/TeamEvent';
import type { FriendlyMatch } from '../models/FriendlyMatch';
import type { RecruitmentPost } from '../models/Player';
import type { SponsorOffer, ClubFundingGoal } from '../models/SponsorOffer';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import { userFromFirestore } from '../lib/firestoreMappers';
import {
  teamEventFromFirestore,
  friendlyMatchFromFirestore,
  recruitmentPostFromFirestore,
  sponsorOfferFromFirestore,
  fundingGoalFromFirestore,
  clubAnnouncementFromFirestore,
  applicationFromFirestore,
} from '../lib/firestoreMappers';
import {
  callFunction,
  getCallableErrorMessage,
  isFunctionsUnavailable,
} from '../lib/firebaseFunctions';
import type { ClubAnnouncement } from '../models/ClubAnnouncement';
import type { TeamPaymentRequest, TeamPaymentStatus } from '../models/TeamFinance';
import type { Application } from '../models/Player';
import type { Club } from '../models/Club';
import type { CommunityReel, CommunityReelStatus } from '../models/CommunityReel';
import type { ReelReport } from '../models/ReelReport';
import type { PlatformFeedPost, FeedAudience } from '../models/PlatformFeed';
import type { PlatformConfig } from '../models/PlatformConfig';
import type { StageOffer, StageApplication } from '../models/Stage';
import type { ShopOrder } from '../models/ShopOrder';
import {
  resolveBetaWaitlistStatus,
  type BetaWaitlistStatus as BetaWaitlistStatusUtil,
} from '../utils/betaWaitlistStatus';
import { getErrorCode } from '../utils/errors';
import { statsService } from './stats.service';
import { adminAuditService } from './adminAudit.service';
import { platformConfigService } from './platformConfig.service';
import {
  chatMessageFromFirestore,
  stageOfferFromFirestore,
  stageApplicationFromFirestore,
} from '../lib/firestoreMappers';
import type { ChatMessage } from '../lib/firestoreMappers';

/** Callables bêta admin déployées en europe-west1 (voir functions/src/index.ts). */
const BETA_ADMIN_FUNCTIONS_REGION = 'europe-west1';

export interface PlatformStats {
  users: number;
  players: number;
  coaches: number;
  agents: number;
  clubs: number;
  teamEvents: number;
  friendlyMatches: number;
  recruitmentPosts: number;
  paymentRequests: number;
  applications: number;
  announcements: number;
  pendingVerifications: number;
  pendingCommunityReels: number;
  reelReports: number;
  pendingPayments: number;
}

export interface PlatformDailySnapshot extends PlatformStats {
  day_key: string;
  recorded_at?: Date;
}

export interface AdminMessageThread {
  id: string;
  label: string;
  participant_ids: string[];
  last_message: string;
  updated_at: Date;
  thread_kind?: string;
}

export type BetaWaitlistStatus = 'pending' | 'approved' | 'rejected';

export interface BetaWaitlistEntry {
  id: string;
  email: string;
  name?: string;
  role?: string;
  role_label?: string;
  city?: string;
  status: BetaWaitlistStatus;
  access_token?: string;
  welcome_email_sent?: boolean;
  approved_at?: Date;
  created_at: Date;
}

export interface SubscriptionPurchase {
  id: string;
  user_uid: string;
  product_id: string;
  status: string;
  amount_eur?: number;
  created_at: Date;
}

export interface AdminTeam {
  id: string;
  club_id: string;
  name: string;
  category?: string;
}

export interface AdminTournament {
  id: string;
  name: string;
  organizer_uid: string;
  city?: string;
  status?: string;
  created_at: Date;
}

export function countPendingUserVerifications(users: User[]): number {
  return users.filter((u) => {
    if (u.role === 'coach' || u.role === 'agent' || u.role === 'recruiter') {
      return u.verification_status === 'PENDING';
    }
    if (u.role === 'player') {
      if (u.verification_status === 'PENDING') return true;
      if (u.player_verification) {
        return computePlayerVerificationStatus(u.player_verification) === 'PENDING';
      }
    }
    return false;
  }).length;
}

export interface AdminUserDocument {
  id: string;
  name: string;
  url?: string;
  type?: string;
  verification_check?: PlayerVerificationCheckId;
}

export interface AdminCreateUserInput {
  email: string;
  password: string;
  display_name: string;
  role: UserRole;
  city?: string;
}

export const adminService = {
  async listAllUsers(max = 200): Promise<User[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, 'users'),
        orderBy('created_at', 'desc'),
        limit(max)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        userFromFirestore(d.id, d.data() as Record<string, unknown>)
      );
    } catch {
      const snap = await getDocs(collection(database, 'users'));
      return snap.docs
        .map((d) => userFromFirestore(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
        .slice(0, max);
    }
  },

  async updateUser(
    uid: string,
    patch: {
      display_name?: string;
      role?: UserRole;
      is_active?: boolean;
      is_verified?: boolean;
      verification_status?: VerificationStatus;
      verification_date?: ReturnType<typeof serverTimestamp>;
      rejection_reason?: string | null;
      city?: string;
    }
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const update: Record<string, unknown> = { updated_at: serverTimestamp() };
    if (patch.display_name !== undefined) update.display_name = patch.display_name;
    if (patch.role !== undefined) update.role = patch.role;
    if (patch.is_active !== undefined) update.is_active = patch.is_active;
    if (patch.is_verified !== undefined) update.is_verified = patch.is_verified;
    if (patch.verification_status !== undefined) {
      update.verification_status = patch.verification_status;
    }
    if (patch.verification_date !== undefined) {
      update.verification_date = patch.verification_date;
    }
    if (patch.rejection_reason !== undefined) {
      update.rejection_reason = patch.rejection_reason;
    }
    if (patch.city !== undefined) update.city = patch.city;

    await updateDoc(doc(database, 'users', uid), update);
  },

  async deleteUserFirestore(uid: string): Promise<void> {
    await this.deleteUserFirestoreWithDocuments(uid);
  },

  async deleteUserFirestoreWithDocuments(uid: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const docsSnap = await getDocs(collection(database, 'users', uid, 'documents'));
    const batch = writeBatch(database);
    docsSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(database, 'users', uid));
    await batch.commit();
  },

  /**
   * Suppression complète (Auth + Firestore) via callable, ou profil Firestore seul si Functions absentes.
   */
  async deleteUserFull(uid: string): Promise<{ authDeleted: boolean }> {
    try {
      await callFunction<{ uid: string }, { success: boolean }>('adminDeleteUser', { uid });
      return { authDeleted: true };
    } catch (e) {
      const msg = getCallableErrorMessage(e);
      if (!isFunctionsUnavailable(e)) {
        const code = getErrorCode(e);
        if (code === 'functions/permission-denied' || code === 'functions/unauthenticated') {
          throw new Error(msg);
        }
      }
      await this.deleteUserFirestoreWithDocuments(uid);
      return { authDeleted: false };
    }
  },

  async createUser(input: AdminCreateUserInput): Promise<{ uid: string }> {
    return callFunction<AdminCreateUserInput, { success: boolean; uid: string }>(
      'adminCreateUser',
      input
    );
  },

  /** Mise à jour directe Firestore (règles admin) — fonctionne sans Cloud Functions déployées */
  async validateProfileDirect(
    uid: string,
    action: 'approve' | 'reject',
    rejectionReason?: string
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const snap = await getDoc(doc(database, 'users', uid));
    if (!snap.exists()) throw new Error('Utilisateur introuvable.');

    const data = snap.data() as Record<string, unknown>;
    const role = data.role as UserRole;
    const verified = action === 'approve';
    const checkStatus = verified ? 'verified' : 'rejected';

    const update: Record<string, unknown> = {
      is_verified: verified,
      verification_status: verified ? 'VERIFIED' : 'REJECTED',
      verification_date: serverTimestamp(),
      rejection_reason: verified ? null : rejectionReason?.trim() || null,
      updated_at: serverTimestamp(),
    };

    if (role === 'player' && data.player_verification) {
      const pv = {
        ...defaultPlayerVerificationState(false),
        ...(data.player_verification as Record<string, unknown>),
      } as ReturnType<typeof defaultPlayerVerificationState>;

      (['identity', 'club_license', 'parental_consent'] as const).forEach((key) => {
        const check = pv[key];
        if (check?.status === 'pending') {
          pv[key] = {
            ...check,
            status: checkStatus,
            ...(verified ? {} : { rejection_reason: rejectionReason?.trim() || 'Refusé par l’administrateur' }),
          };
        }
      });

      update.player_verification = pv;
      update.verification_status = verified
        ? 'VERIFIED'
        : computePlayerVerificationStatus(pv);
      if (verified) {
        update.onboarding_documents_submitted = true;
      }
    }

    await updateDoc(doc(database, 'users', uid), update);
  },

  /**
   * Approuver / rejeter un compte — callable (push FCM) ou repli Firestore.
   */
  async validateProfile(
    uid: string,
    action: 'approve' | 'reject',
    rejectionReason?: string
  ): Promise<{ via: 'callable' | 'firestore' }> {
    try {
      await callFunction('validateProfile', { uid, action, rejectionReason });
      return { via: 'callable' };
    } catch (e) {
      if (!isFunctionsUnavailable(e)) {
        throw new Error(getCallableErrorMessage(e));
      }
      await this.validateProfileDirect(uid, action, rejectionReason);
      return { via: 'firestore' };
    }
  },

  async updateRecruitmentPost(postId: string, status: 'OPEN' | 'CLOSED'): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, 'recruitment_posts', postId), {
      status,
      updated_at: serverTimestamp(),
    });
  },

  async listAllClubs(max = 100): Promise<Club[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    const snap = await getDocs(query(collection(database, 'clubs'), limit(max)));
    return snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      const loc = data.location as { latitude?: number; longitude?: number } | undefined;
      return {
        id: d.id,
        name: String(data.name ?? ''),
        city: String(data.city ?? ''),
        department: data.department as string | undefined,
        location: { latitude: loc?.latitude ?? 0, longitude: loc?.longitude ?? 0 },
        logo_url: data.logo_url as string | undefined,
        verified: Boolean(data.verified),
        categories: (data.categories as string[]) ?? [],
        sponsor_ids: (data.sponsor_ids as string[]) ?? [],
        owner_uid: String(data.owner_uid ?? ''),
        created_at: new Date(),
      };
    });
  },

  async deleteClub(clubId: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await deleteDoc(doc(database, 'clubs', clubId));
  },

  async updateClubVerified(clubId: string, verified: boolean): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, 'clubs', clubId), {
      verified,
      updated_at: serverTimestamp(),
    });
  },

  async listAllPaymentRequests(max = 100): Promise<TeamPaymentRequest[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    const snap = await getDocs(collection(database, 'team_payment_requests'));
    return snap.docs
      .map((d) => {
        const data = d.data() as Record<string, unknown>;
        const toDate = (v: unknown) =>
          v && typeof v === 'object' && 'toDate' in v
            ? (v as { toDate: () => Date }).toDate()
            : new Date();
        return {
          id: d.id,
          club_id: String(data.club_id ?? ''),
          label: String(data.label ?? ''),
          amount_eur: Number(data.amount_eur ?? 0),
          due_at: toDate(data.due_at),
          member_uid: String(data.member_uid ?? ''),
          member_name: String(data.member_name ?? ''),
          status: (data.status as TeamPaymentStatus) ?? 'pending',
          paid_at: data.paid_at ? toDate(data.paid_at) : undefined,
          created_by_uid: String(data.created_by_uid ?? ''),
          created_at: toDate(data.created_at),
          updated_at: toDate(data.updated_at),
        };
      })
      .sort((a, b) => b.due_at.getTime() - a.due_at.getTime())
      .slice(0, max);
  },

  async updatePaymentStatus(requestId: string, status: TeamPaymentStatus): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, 'team_payment_requests', requestId), {
      status,
      paid_at: status === 'paid' ? serverTimestamp() : null,
      updated_at: serverTimestamp(),
    });
  },

  async deletePaymentRequest(requestId: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await deleteDoc(doc(database, 'team_payment_requests', requestId));
  },

  async listAllApplications(max = 100): Promise<Application[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = query(
        collection(database, 'recruitment_applications'),
        orderBy('created_at', 'desc'),
        limit(max)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        applicationFromFirestore(d.id, d.data() as Record<string, unknown>)
      );
    } catch {
      const snap = await getDocs(collection(database, 'recruitment_applications'));
      return snap.docs
        .map((d) => applicationFromFirestore(d.id, d.data() as Record<string, unknown>))
        .slice(0, max);
    }
  },

  async deleteApplication(appId: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await deleteDoc(doc(database, 'recruitment_applications', appId));
  },

  async listAllClubAnnouncements(max = 100): Promise<ClubAnnouncement[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    const snap = await getDocs(collection(database, 'club_announcements'));
    return snap.docs
      .map((d) => clubAnnouncementFromFirestore(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, max);
  },

  async deleteClubAnnouncement(id: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await deleteDoc(doc(database, 'club_announcements', id));
  },

  async refreshPublicStats() {
    return statsService.refreshAndPublishRecruitmentStats();
  },

  async listUserDocuments(uid: string): Promise<AdminUserDocument[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    const snap = await getDocs(collection(database, 'users', uid, 'documents'));
    return snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      const type = String(data.type ?? data.document_type ?? 'document');
      const check = data.verification_check as PlayerVerificationCheckId | undefined;
      return {
        id: d.id,
        name: String(data.name ?? data.file_name ?? type),
        url: (data.storage_url ?? data.url) as string | undefined,
        type,
        verification_check: check,
      };
    });
  },

  async listAllTeamEvents(max = 80): Promise<TeamEvent[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, 'team_events'),
        orderBy('starts_at', 'desc'),
        limit(max)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        teamEventFromFirestore(d.id, d.data() as Record<string, unknown>)
      );
    } catch {
      const snap = await getDocs(collection(database, 'team_events'));
      return snap.docs
        .map((d) => teamEventFromFirestore(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.starts_at.getTime() - a.starts_at.getTime())
        .slice(0, max);
    }
  },

  async deleteTeamEvent(eventId: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await deleteDoc(doc(database, 'team_events', eventId));
  },

  async listAllFriendlyMatches(max = 80): Promise<FriendlyMatch[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    const snap = await getDocs(collection(database, 'friendly_matches'));
    return snap.docs
      .map((d) => friendlyMatchFromFirestore(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, max);
  },

  async deleteFriendlyMatch(matchId: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await deleteDoc(doc(database, 'friendly_matches', matchId));
  },

  async listAllRecruitmentPosts(max = 80): Promise<RecruitmentPost[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    const snap = await getDocs(collection(database, 'recruitment_posts'));
    return snap.docs
      .map((d) => recruitmentPostFromFirestore(d.id, d.data() as Record<string, unknown>))
      .slice(0, max);
  },

  async deleteRecruitmentPost(postId: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await deleteDoc(doc(database, 'recruitment_posts', postId));
  },

  async listAllSponsorOffers(max = 80): Promise<SponsorOffer[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    const snap = await getDocs(collection(database, 'sponsor_offers'));
    return snap.docs
      .map((d) => sponsorOfferFromFirestore(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, max);
  },

  async listAllFundingGoals(max = 80): Promise<ClubFundingGoal[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    const snap = await getDocs(collection(database, 'club_funding_goals'));
    return snap.docs
      .map((d) => fundingGoalFromFirestore(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => b.raised_amount_eur - a.raised_amount_eur)
      .slice(0, max);
  },

  async deleteSponsorOffer(offerId: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await deleteDoc(doc(database, 'sponsor_offers', offerId));
  },

  async deleteFundingGoal(goalId: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await deleteDoc(doc(database, 'club_funding_goals', goalId));
  },

  async listCommunityReels(max = 100, status?: CommunityReelStatus): Promise<CommunityReel[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    const mapReel = (id: string, data: Record<string, unknown>): CommunityReel => {
      const toDate = (v: unknown) =>
        v && typeof v === 'object' && 'toDate' in v
          ? (v as { toDate: () => Date }).toDate()
          : new Date(0);
      return {
        id,
        author_uid: String(data.author_uid ?? ''),
        author_name: String(data.author_name ?? ''),
        club_id: data.club_id as string | undefined,
        video_url: String(data.video_url ?? ''),
        poster_url: data.poster_url as string | undefined,
        caption: String(data.caption ?? ''),
        theme: (data.theme as CommunityReel['theme']) ?? 'skills',
        status: (data.status as CommunityReel['status']) ?? 'pending',
        created_at: toDate(data.created_at),
        updated_at: toDate(data.updated_at),
      };
    };

    try {
      if (status) {
        const snap = await getDocs(
          query(
            collection(database, 'community_reels'),
            where('status', '==', status),
            orderBy('created_at', 'desc'),
            limit(max)
          )
        );
        return snap.docs.map((d) => mapReel(d.id, d.data() as Record<string, unknown>));
      }
      const snap = await getDocs(
        query(collection(database, 'community_reels'), orderBy('created_at', 'desc'), limit(max))
      );
      return snap.docs.map((d) => mapReel(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(collection(database, 'community_reels'));
      return snap.docs
        .map((d) => mapReel(d.id, d.data() as Record<string, unknown>))
        .filter((r) => !status || r.status === status)
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
        .slice(0, max);
    }
  },

  async updateCommunityReelStatus(
    reelId: string,
    status: 'approved' | 'rejected',
    actor?: { uid: string; email?: string },
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, 'community_reels', reelId), {
      status,
      updated_at: serverTimestamp(),
    });
    if (actor?.uid) {
      await adminAuditService.log({
        action: status === 'approved' ? 'reel_approved' : 'reel_rejected',
        actor_uid: actor.uid,
        actor_email: actor.email,
        target_type: 'community_reel',
        target_id: reelId,
        summary: `Reel ${status === 'approved' ? 'approuvé' : 'refusé'}`,
      });
    }
  },

  async deleteCommunityReel(
    reelId: string,
    actor?: { uid: string; email?: string },
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await deleteDoc(doc(database, 'community_reels', reelId));
    if (actor?.uid) {
      await adminAuditService.log({
        action: 'reel_deleted',
        actor_uid: actor.uid,
        actor_email: actor.email,
        target_type: 'community_reel',
        target_id: reelId,
        summary: 'Reel communauté supprimé',
      });
    }
  },

  async listReelReports(max = 100): Promise<ReelReport[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    const mapReport = (id: string, data: Record<string, unknown>): ReelReport => {
      const toDate = (v: unknown) =>
        v && typeof v === 'object' && 'toDate' in v
          ? (v as { toDate: () => Date }).toDate()
          : new Date(0);
      return {
        id,
        bookmark_key: String(data.bookmark_key ?? ''),
        reporter_uid: String(data.reporter_uid ?? ''),
        reason: String(data.reason ?? ''),
        source_url: String(data.source_url ?? ''),
        created_at: toDate(data.created_at),
      };
    };

    try {
      const snap = await getDocs(
        query(collection(database, 'reel_reports'), orderBy('created_at', 'desc'), limit(max))
      );
      return snap.docs.map((d) => mapReport(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(collection(database, 'reel_reports'));
      return snap.docs
        .map((d) => mapReport(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
        .slice(0, max);
    }
  },

  async deleteReelReport(reportId: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await deleteDoc(doc(database, 'reel_reports', reportId));
  },

  async getPlatformStats(): Promise<PlatformStats> {
    const [
      users,
      events,
      matches,
      posts,
      clubs,
      payments,
      applications,
      announcements,
      communityReels,
      reelReports,
    ] = await Promise.all([
      this.listAllUsers(300),
      this.listAllTeamEvents(200),
      this.listAllFriendlyMatches(200),
      this.listAllRecruitmentPosts(200),
      this.listAllClubs(200),
      this.listAllPaymentRequests(200),
      this.listAllApplications(200),
      this.listAllClubAnnouncements(200),
      this.listCommunityReels(200),
      this.listReelReports(200),
    ]);

    const stats = {
      users: users.length,
      players: users.filter((u) => u.role === 'player').length,
      coaches: users.filter((u) => u.role === 'coach').length,
      agents: users.filter((u) => u.role === 'agent').length,
      clubs: clubs.length,
      teamEvents: events.length,
      friendlyMatches: matches.length,
      recruitmentPosts: posts.length,
      paymentRequests: payments.length,
      applications: applications.length,
      announcements: announcements.length,
      pendingVerifications: countPendingUserVerifications(users),
      pendingCommunityReels: communityReels.filter((r) => r.status === 'pending').length,
      reelReports: reelReports.length,
      pendingPayments: payments.filter((p) => p.status === 'pending').length,
    };

    void this.recordDailyPlatformSnapshot(stats);

    return stats;
  },

  async recordDailyPlatformSnapshot(stats: PlatformStats): Promise<void> {
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;
    const dayKey = new Date().toISOString().slice(0, 10);
    try {
      await setDoc(
        doc(database, 'platform_stats_daily', dayKey),
        { ...stats, day_key: dayKey, recorded_at: serverTimestamp() },
        { merge: true },
      );
    } catch {
      /* snapshot optionnel */
    }
  },

  async listDailyPlatformSnapshots(maxDays = 14): Promise<PlatformDailySnapshot[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const snap = await getDocs(
        query(
          collection(database, 'platform_stats_daily'),
          orderBy('day_key', 'desc'),
          limit(maxDays),
        ),
      );
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          day_key: String(data.day_key ?? d.id),
          users: Number(data.users ?? 0),
          players: Number(data.players ?? 0),
          coaches: Number(data.coaches ?? 0),
          agents: Number(data.agents ?? 0),
          clubs: Number(data.clubs ?? 0),
          teamEvents: Number(data.teamEvents ?? 0),
          friendlyMatches: Number(data.friendlyMatches ?? 0),
          recruitmentPosts: Number(data.recruitmentPosts ?? 0),
          paymentRequests: Number(data.paymentRequests ?? 0),
          applications: Number(data.applications ?? 0),
          announcements: Number(data.announcements ?? 0),
          pendingVerifications: Number(data.pendingVerifications ?? 0),
          pendingCommunityReels: Number(data.pendingCommunityReels ?? 0),
          reelReports: Number(data.reelReports ?? 0),
          pendingPayments: Number(data.pendingPayments ?? 0),
          recorded_at: data.recorded_at?.toDate?.(),
        };
      });
    } catch {
      return [];
    }
  },

  async listAllMessageThreads(max = 80): Promise<AdminMessageThread[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const snap = await getDocs(
        query(collection(database, 'message_threads'), orderBy('updated_at', 'desc'), limit(max)),
      );
      return snap.docs.map((d) => {
        const data = d.data();
        const names = (data.participant_names as Record<string, string>) ?? {};
        const ids = (data.participant_ids as string[]) ?? [];
        const label =
          data.thread_title != null
            ? String(data.thread_title)
            : ids.map((id) => names[id] ?? id.slice(0, 8)).join(' · ') || d.id;
        const toDate = (v: unknown) =>
          v && typeof v === 'object' && 'toDate' in v
            ? (v as { toDate: () => Date }).toDate()
            : new Date(0);
        return {
          id: d.id,
          label,
          participant_ids: ids,
          last_message: String(data.last_message ?? ''),
          updated_at: toDate(data.updated_at),
          thread_kind: data.thread_kind ? String(data.thread_kind) : undefined,
        };
      });
    } catch {
      const snap = await getDocs(collection(database, 'message_threads'));
      return snap.docs
        .map((d) => {
          const data = d.data();
          const names = (data.participant_names as Record<string, string>) ?? {};
          const ids = (data.participant_ids as string[]) ?? [];
          return {
            id: d.id,
            label: ids.map((id) => names[id] ?? id.slice(0, 8)).join(' · ') || d.id,
            participant_ids: ids,
            last_message: String(data.last_message ?? ''),
            updated_at: new Date(0),
            thread_kind: data.thread_kind ? String(data.thread_kind) : undefined,
          };
        })
        .slice(0, max);
    }
  },

  async listThreadMessages(threadId: string, max = 100): Promise<ChatMessage[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const snap = await getDocs(
        query(
          collection(database, 'messages'),
          where('thread_id', '==', threadId),
          orderBy('created_at', 'desc'),
          limit(max),
        ),
      );
      return snap.docs
        .map((d) => chatMessageFromFirestore(d.id, d.data() as Record<string, unknown>))
        .reverse();
    } catch {
      const snap = await getDocs(
        query(collection(database, 'messages'), where('thread_id', '==', threadId), limit(max)),
      );
      return snap.docs
        .map((d) => chatMessageFromFirestore(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
    }
  },

  async deleteMessageAdmin(
    messageId: string,
    actorUid: string,
    actorEmail: string | undefined,
    threadId: string,
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await deleteDoc(doc(database, 'messages', messageId));
    await adminAuditService.log({
      action: 'message_deleted',
      actor_uid: actorUid,
      actor_email: actorEmail,
      target_type: 'message',
      target_id: messageId,
      summary: `Message supprimé (thread ${threadId.slice(0, 12)}…)`,
    });
  },

  async deleteMessageThreadAdmin(
    threadId: string,
    actorUid: string,
    actorEmail: string | undefined,
    label: string,
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const msgs = await getDocs(
      query(collection(database, 'messages'), where('thread_id', '==', threadId), limit(200)),
    );
    const batch = writeBatch(database);
    msgs.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(database, 'message_threads', threadId));
    await batch.commit();
    await adminAuditService.log({
      action: 'thread_deleted',
      actor_uid: actorUid,
      actor_email: actorEmail,
      target_type: 'message_thread',
      target_id: threadId,
      summary: `Conversation supprimée · ${label}`,
    });
  },

  async deleteWeeklyQuestionResponse(
    questionId: string,
    responseUid: string,
    actorUid: string,
    actorEmail: string | undefined,
    authorName: string,
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await deleteDoc(doc(database, 'weekly_questions', questionId, 'responses', responseUid));
    await adminAuditService.log({
      action: 'weekly_response_deleted',
      actor_uid: actorUid,
      actor_email: actorEmail,
      target_type: 'weekly_response',
      target_id: responseUid,
      summary: `Réponse fil supprimée · ${authorName}`,
    });
  },

  async getPlatformConfig(): Promise<PlatformConfig> {
    return platformConfigService.getConfig();
  },

  async updatePlatformConfig(
    patch: Parameters<typeof platformConfigService.saveConfig>[0],
    actorUid: string,
    actorEmail?: string,
  ): Promise<void> {
    await platformConfigService.saveConfig(patch, actorUid);
    await adminAuditService.log({
      action: 'platform_config_updated',
      actor_uid: actorUid,
      actor_email: actorEmail,
      target_type: 'platform_config',
      target_id: 'main',
      summary: 'Configuration plateforme mise à jour',
    });
  },

  async listPlatformFeedPosts(max = 80): Promise<PlatformFeedPost[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    const mapPost = (id: string, data: Record<string, unknown>): PlatformFeedPost => {
      const pollVotes = data.poll_votes as Record<string, string[]> | undefined;
      return {
        id,
        type: (data.type as PlatformFeedPost['type']) ?? 'news',
        audience: (data.audience as PlatformFeedPost['audience']) ?? 'all',
        author_uid: String(data.author_uid ?? ''),
        author_name: String(data.author_name ?? ''),
        author_role: (data.author_role as PlatformFeedPost['author_role']) ?? 'club',
        title: String(data.title ?? ''),
        body: String(data.body ?? ''),
        image_url: data.image_url ? String(data.image_url) : undefined,
        poll_options: Array.isArray(data.poll_options)
          ? (data.poll_options as string[]).map(String)
          : undefined,
        poll_votes: pollVotes,
        created_at:
          data.created_at && typeof data.created_at === 'object' && 'toDate' in data.created_at
            ? (data.created_at as { toDate: () => Date }).toDate()
            : new Date(0),
        updated_at:
          data.updated_at && typeof data.updated_at === 'object' && 'toDate' in data.updated_at
            ? (data.updated_at as { toDate: () => Date }).toDate()
            : undefined,
      };
    };

    try {
      const snap = await getDocs(
        query(collection(database, 'platform_feed'), orderBy('created_at', 'desc'), limit(max)),
      );
      return snap.docs.map((d) => mapPost(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(collection(database, 'platform_feed'));
      return snap.docs
        .map((d) => mapPost(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
        .slice(0, max);
    }
  },

  async createPlatformFeedNews(input: {
    author_uid: string;
    author_name: string;
    title: string;
    body: string;
    audience?: FeedAudience;
  }): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const ref = await addDoc(collection(database, 'platform_feed'), {
      type: 'news',
      audience: input.audience ?? 'all',
      author_uid: input.author_uid,
      author_name: input.author_name.trim(),
      author_role: 'club',
      title: input.title.trim(),
      body: input.body.trim(),
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return ref.id;
  },

  async deletePlatformFeedPost(postId: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await deleteDoc(doc(database, 'platform_feed', postId));
  },

  async listBetaWaitlist(max = 100): Promise<BetaWaitlistEntry[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    const mapEntry = (id: string, data: Record<string, unknown>): BetaWaitlistEntry => {
      const toDate = (v: unknown): Date | undefined => {
        if (v && typeof v === 'object' && 'toDate' in v) {
          return (v as { toDate: () => Date }).toDate();
        }
        return undefined;
      };
      return {
        id,
        email: String(data.email ?? ''),
        name: data.name ? String(data.name) : undefined,
        role: data.role ? String(data.role) : undefined,
        role_label: data.role_label ? String(data.role_label) : undefined,
        city: data.city ? String(data.city) : undefined,
        status: resolveBetaWaitlistStatus(data) as BetaWaitlistStatusUtil,
        access_token: data.access_token ? String(data.access_token) : undefined,
        welcome_email_sent: data.welcome_email_sent === true,
        approved_at: toDate(data.approved_at),
        created_at: toDate(data.created_at) ?? new Date(0),
      };
    };

    try {
      const snap = await getDocs(
        query(collection(database, 'beta_waitlist'), orderBy('created_at', 'desc'), limit(max)),
      );
      return snap.docs.map((d) => mapEntry(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(collection(database, 'beta_waitlist'));
      return snap.docs
        .map((d) => mapEntry(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
        .slice(0, max);
    }
  },

  async approveBetaWaitlistEntry(
    entryId: string,
  ): Promise<{ success: boolean; emailSent: boolean; emailError?: string }> {
    return callFunction<
      { entryId: string },
      { success: boolean; emailSent: boolean; emailError?: string }
    >('adminApproveBetaAccess', { entryId }, BETA_ADMIN_FUNCTIONS_REGION);
  },

  async rejectBetaWaitlistEntry(entryId: string): Promise<{ success: boolean }> {
    return callFunction<{ entryId: string }, { success: boolean }>(
      'adminRejectBetaAccess',
      { entryId },
      BETA_ADMIN_FUNCTIONS_REGION,
    );
  },

  async resendBetaWelcomeEmail(
    entryId: string,
  ): Promise<{ success: boolean; emailSent: boolean; emailError?: string }> {
    return callFunction<
      { entryId: string },
      { success: boolean; emailSent: boolean; emailError?: string }
    >('adminResendBetaWelcomeEmail', { entryId }, BETA_ADMIN_FUNCTIONS_REGION);
  },

  async listSubscriptionPurchases(max = 100): Promise<SubscriptionPurchase[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    const snap = await getDocs(collection(database, 'subscription_purchases'));
    return snap.docs
      .map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          user_uid: String(data.user_uid ?? data.uid ?? ''),
          product_id: String(data.product_id ?? data.plan_id ?? '—'),
          status: String(data.status ?? 'unknown'),
          amount_eur: data.amount_eur != null ? Number(data.amount_eur) : undefined,
          created_at:
            data.created_at && typeof data.created_at === 'object' && 'toDate' in data.created_at
              ? (data.created_at as { toDate: () => Date }).toDate()
              : new Date(0),
        };
      })
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, max);
  },

  async listShopOrders(max = 100): Promise<ShopOrder[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    const snap = await getDocs(collection(database, 'shop_orders'));
    return snap.docs
      .map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          buyer_uid: String(data.buyer_uid ?? ''),
          product_line: String(data.product_line ?? ''),
          lines: Array.isArray(data.lines) ? (data.lines as ShopOrder['lines']) : [],
          total_eur: Number(data.total_eur ?? 0),
          status: (data.status as ShopOrder['status']) ?? 'pending',
          created_at:
            data.created_at && typeof data.created_at === 'object' && 'toDate' in data.created_at
              ? (data.created_at as { toDate: () => Date }).toDate()
              : null,
        };
      })
      .sort((a, b) => (b.created_at?.getTime() ?? 0) - (a.created_at?.getTime() ?? 0))
      .slice(0, max);
  },

  async listAllStageOffers(max = 80): Promise<StageOffer[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    const snap = await getDocs(collection(database, 'stage_offers'));
    return snap.docs
      .map((d) => stageOfferFromFirestore(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, max);
  },

  async listAllStageApplications(max = 100): Promise<StageApplication[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const snap = await getDocs(
        query(
          collection(database, 'stage_applications'),
          orderBy('created_at', 'desc'),
          limit(max),
        ),
      );
      return snap.docs.map((d) =>
        stageApplicationFromFirestore(d.id, d.data() as Record<string, unknown>),
      );
    } catch {
      const snap = await getDocs(collection(database, 'stage_applications'));
      return snap.docs
        .map((d) => stageApplicationFromFirestore(d.id, d.data() as Record<string, unknown>))
        .slice(0, max);
    }
  },

  async deleteStageOffer(offerId: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await deleteDoc(doc(database, 'stage_offers', offerId));
  },

  async deleteStageApplication(appId: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await deleteDoc(doc(database, 'stage_applications', appId));
  },

  async updateStageOfferStatus(offerId: string, status: 'OPEN' | 'CLOSED'): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, 'stage_offers', offerId), {
      status,
      updated_at: serverTimestamp(),
    });
  },

  async listAllTeams(max = 120): Promise<AdminTeam[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    const snap = await getDocs(query(collection(database, 'teams'), limit(max)));
    return snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        club_id: String(data.club_id ?? ''),
        name: String(data.name ?? ''),
        category: data.category ? String(data.category) : undefined,
      };
    });
  },

  async deleteTeam(teamId: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await deleteDoc(doc(database, 'teams', teamId));
  },

  async listAllTournaments(max = 80): Promise<AdminTournament[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    const snap = await getDocs(collection(database, 'tournaments'));
    return snap.docs
      .map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          name: String(data.name ?? data.title ?? 'Tournoi'),
          organizer_uid: String(data.organizer_uid ?? ''),
          city: data.city ? String(data.city) : undefined,
          status: data.status ? String(data.status) : undefined,
          created_at:
            data.created_at && typeof data.created_at === 'object' && 'toDate' in data.created_at
              ? (data.created_at as { toDate: () => Date }).toDate()
              : new Date(0),
        };
      })
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, max);
  },

  async deleteTournament(tournamentId: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await deleteDoc(doc(database, 'tournaments', tournamentId));
  },
};
