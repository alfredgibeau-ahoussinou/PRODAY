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
  deleteField,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import type { User, UserRole, VerificationStatus, PlayerVerificationCheckId } from '../models/User';
import {
  computePlayerVerificationStatus,
  defaultPlayerVerificationState,
} from '../models/User';
import type { ProductLineId } from '../models/ProductLine';
import { resolveAdminProductLine } from '../utils/adminProductLine';
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
import {
  boostDisplayedDailySiteVisits,
  boostDisplayedSiteVisitsTotal,
} from '../utils/trafficDisplayBoost';
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

export interface TrafficTotals {
  site_visits: number;
  app_opens: number;
  tracking_started_at?: Date | null;
  updated_at?: Date | null;
}

export interface TrafficDailyRow {
  day_key: string;
  site_visits: number;
  app_opens: number;
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
  source?: string;
  created_at: Date;
}

export type AdminSubscriptionStatus = 'active' | 'trialing' | 'canceled' | 'past_due';

export type AdminSetSubscriptionInput = {
  tier: 'free' | 'pro';
  planId?: string | null;
  status?: AdminSubscriptionStatus | null;
  periodEnd?: Date | null;
  billing?: 'monthly' | 'yearly' | null;
  reason: string;
  logPurchase?: boolean;
};

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
  /** Résultat analyse Mistral (si présent). */
  ai_status?: string;
  ai_summary?: string;
  ai_confidence?: number;
  ai_approved?: boolean;
}

export interface AdminCreateUserInput {
  email: string;
  password: string;
  display_name: string;
  role: UserRole;
  city?: string;
  product_line?: ProductLineId;
  medical_specialty?: string;
  /** Profil joueur — genre déclaré (men / women). */
  gender?: 'men' | 'women';
  /** ISO `YYYY-MM-DD` — pilote l’univers -13 / ado / adulte. */
  birth_date?: string;
  age?: number;
  app_space?: string;
}

export type AdminUserUpdatePatch = {
  display_name?: string;
  role?: UserRole;
  product_line?: ProductLineId;
  is_active?: boolean;
  is_verified?: boolean;
  verification_status?: VerificationStatus;
  verification_date?: ReturnType<typeof serverTimestamp>;
  rejection_reason?: string | null;
  city?: string;
  sponsor_approved?: boolean;
  sponsor_tier?: 'starter' | 'territorial' | 'national' | null;
  job_title?: string;
  medical_specialty?: string | null;
  /** Parcours joueur (amateur / formation / haut niveau). */
  player_level?: 'amateur' | 'academy' | 'professional' | null;
  position?: string | null;
  level?: string | null;
  /** Genre déclaré — men / women (legacy minor accepté en lecture). */
  gender?: 'men' | 'women' | 'minor' | null;
  /** Date de naissance ISO — source de vérité univers joueur. */
  birth_date?: string | null;
  /** Âge dérivé (resynchronisé depuis birth_date côté admin). */
  age?: number | null;
  /** Communauté AppSpace (under_u13 / boys / men / girls / women). */
  app_space?: string | null;
  category?: string | null;
  jersey_number?: number | null;
  bio?: string | null;
  /** UIDs enfants liés (compte parent). */
  parent_of?: string[] | null;
  strong_foot?: 'left' | 'right' | 'both' | null;
};

export const adminService = {
  async getUser(uid: string): Promise<User | null> {
    if (!isFirebaseConfigured() || !uid) return null;
    const database = getDb();
    if (!database) return null;
    const snap = await getDoc(doc(database, 'users', uid));
    if (!snap.exists()) return null;
    return userFromFirestore(snap.id, snap.data() as Record<string, unknown>);
  },

  async findUserByEmail(email: string): Promise<User | null> {
    if (!isFirebaseConfigured()) return null;
    const database = getDb();
    if (!database) return null;
    const normalized = email.trim().toLowerCase();
    if (!normalized) return null;
    const q = query(
      collection(database, 'users'),
      where('email', '==', normalized),
      limit(1),
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0]!;
    return userFromFirestore(d.id, d.data() as Record<string, unknown>);
  },

  async listAllUsers(max = 500): Promise<User[]> {
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

  async updateUser(uid: string, patch: AdminUserUpdatePatch): Promise<void> {
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
    if (patch.sponsor_approved !== undefined) {
      update.sponsor_approved = patch.sponsor_approved;
    }
    if (patch.sponsor_tier !== undefined) {
      update.sponsor_tier = patch.sponsor_tier;
    }
    if (patch.job_title !== undefined) {
      update['profile.job_title'] = patch.job_title || null;
    }
    if (patch.medical_specialty !== undefined) {
      update['profile.medical_specialty'] = patch.medical_specialty || null;
    }
    if (patch.player_level !== undefined) {
      update.player_level = patch.player_level || null;
    }
    if (patch.position !== undefined) {
      update['profile.position'] = patch.position || null;
    }
    if (patch.level !== undefined) {
      update['profile.level'] = patch.level || null;
    }
    if (patch.gender !== undefined) {
      update['profile.gender'] = patch.gender || null;
    }
    if (patch.birth_date !== undefined) {
      update['profile.birth_date'] = patch.birth_date || null;
    }
    if (patch.age !== undefined) {
      update['profile.age'] = patch.age == null ? null : patch.age;
    }
    if (patch.app_space !== undefined) {
      update.app_space = patch.app_space || null;
    }
    if (patch.category !== undefined) {
      update['profile.category'] = patch.category || null;
    }
    if (patch.jersey_number !== undefined) {
      update['profile.jersey_number'] =
        patch.jersey_number == null ? null : patch.jersey_number;
    }
    if (patch.bio !== undefined) {
      update['profile.bio'] = patch.bio || null;
    }
    if (patch.strong_foot !== undefined) {
      update['profile.strong_foot'] = patch.strong_foot || null;
    }
    if (patch.parent_of !== undefined) {
      update.parent_of = patch.parent_of ?? [];
    }

    if (patch.product_line !== undefined || patch.role !== undefined) {
      let role = patch.role;
      let preferred = patch.product_line;
      if (role === undefined || preferred === undefined) {
        const snap = await getDoc(doc(database, 'users', uid));
        const data = snap.data() as Record<string, unknown> | undefined;
        role = role ?? (data?.role as UserRole);
        preferred =
          preferred ??
          (typeof data?.product_line === 'string'
            ? (data.product_line as ProductLineId)
            : undefined);
      }
      if (role) {
        update.product_line = resolveAdminProductLine(role, preferred);
      }
    }

    if (patch.role && patch.role !== 'sponsor' && patch.sponsor_approved === undefined) {
      update.sponsor_approved = false;
    }

    await updateDoc(doc(database, 'users', uid), update);
  },

  /**
   * Lie un enfant mineur à un compte parent (parent_of + parental_settings.parent_uid).
   */
  async linkParentToChild(parentUid: string, childUid: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const parentRef = doc(database, 'users', parentUid);
    const childRef = doc(database, 'users', childUid);
    const [parentSnap, childSnap] = await Promise.all([
      getDoc(parentRef),
      getDoc(childRef),
    ]);
    if (!parentSnap.exists()) throw new Error('Compte parent introuvable.');
    if (!childSnap.exists()) throw new Error('Compte enfant introuvable.');
    const parent = parentSnap.data() as Record<string, unknown>;
    const child = childSnap.data() as Record<string, unknown>;
    if (parent.role !== 'parent') throw new Error('Le compte source n’est pas un parent.');
    const parental =
      (child.parental_settings as Record<string, unknown> | undefined) ?? {};
    const batch = writeBatch(database);
    batch.update(parentRef, {
      parent_of: arrayUnion(childUid),
      product_line: 'parent',
      updated_at: serverTimestamp(),
    });
    batch.update(childRef, {
      parental_settings: {
        ...parental,
        is_minor: true,
        parent_uid: parentUid,
        guardian_email:
          typeof parental.guardian_email === 'string' && parental.guardian_email
            ? parental.guardian_email
            : String(parent.email ?? '').trim().toLowerCase(),
        guardian_name:
          typeof parental.guardian_name === 'string' && parental.guardian_name
            ? parental.guardian_name
            : String(parent.display_name ?? 'Parent'),
        supervision_enabled: parental.supervision_enabled !== false,
      },
      updated_at: serverTimestamp(),
    });
    await batch.commit();
  },

  async unlinkParentFromChild(parentUid: string, childUid: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const parentRef = doc(database, 'users', parentUid);
    const childRef = doc(database, 'users', childUid);
    const childSnap = await getDoc(childRef);
    const parental =
      childSnap.exists()
        ? ((childSnap.data() as Record<string, unknown>).parental_settings as
            | Record<string, unknown>
            | undefined)
        : undefined;
    const batch = writeBatch(database);
    batch.update(parentRef, {
      parent_of: arrayRemove(childUid),
      updated_at: serverTimestamp(),
    });
    if (childSnap.exists() && parental) {
      const next = { ...parental };
      if (next.parent_uid === parentUid) {
        next.parent_uid = null;
      }
      batch.update(childRef, {
        parental_settings: next,
        updated_at: serverTimestamp(),
      });
    }
    await batch.commit();
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

    if (role === 'sponsor') {
      update.sponsor_approved = verified;
      update.product_line = 'sponsor';
    }

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
      const ai =
        data.ai_verification && typeof data.ai_verification === 'object'
          ? (data.ai_verification as Record<string, unknown>)
          : null;
      const confidenceRaw = ai?.confidence;
      return {
        id: d.id,
        name: String(data.name ?? data.file_name ?? type),
        url: (data.storage_url ?? data.url) as string | undefined,
        type,
        verification_check: check,
        ai_status: ai?.status != null ? String(ai.status) : undefined,
        ai_summary: ai?.summary_fr != null ? String(ai.summary_fr) : undefined,
        ai_confidence:
          typeof confidenceRaw === 'number'
            ? confidenceRaw
            : confidenceRaw != null
              ? Number(confidenceRaw)
              : undefined,
        ai_approved: typeof ai?.approved === 'boolean' ? ai.approved : undefined,
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
      this.listAllTeamEvents(500),
      this.listAllFriendlyMatches(500),
      this.listAllRecruitmentPosts(500),
      this.listAllClubs(500),
      this.listAllPaymentRequests(500),
      this.listAllApplications(500),
      this.listAllClubAnnouncements(500),
      this.listCommunityReels(500),
      this.listReelReports(500),
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

  async getTrafficTotals(): Promise<TrafficTotals> {
    const empty: TrafficTotals = {
      site_visits: 0,
      app_opens: 0,
      tracking_started_at: null,
      updated_at: null,
    };
    if (!isFirebaseConfigured()) return empty;
    const database = getDb();
    if (!database) return empty;
    try {
      const snap = await getDoc(doc(database, 'traffic_stats', 'totals'));
      if (!snap.exists()) return empty;
      const data = snap.data();
      const trackingStartedAt = data.tracking_started_at?.toDate?.() ?? null;
      return {
        site_visits: boostDisplayedSiteVisitsTotal(
          Number(data.site_visits ?? 0),
          trackingStartedAt,
        ),
        app_opens: Number(data.app_opens ?? 0),
        tracking_started_at: trackingStartedAt,
        updated_at: data.updated_at?.toDate?.() ?? null,
      };
    } catch {
      return empty;
    }
  },

  async listTrafficDaily(maxDays = 30): Promise<TrafficDailyRow[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const snap = await getDocs(
        query(
          collection(database, 'traffic_stats_daily'),
          orderBy('day_key', 'desc'),
          limit(maxDays),
        ),
      );
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          day_key: String(data.day_key ?? d.id),
          site_visits: boostDisplayedDailySiteVisits(Number(data.site_visits ?? 0)),
          app_opens: Number(data.app_opens ?? 0),
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

  async deleteBetaWaitlistEntry(entryId: string): Promise<{ success: boolean }> {
    return callFunction<{ entryId: string }, { success: boolean }>(
      'adminDeleteBetaWaitlistEntry',
      { entryId },
      BETA_ADMIN_FUNCTIONS_REGION,
    );
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
          product_id: String(data.product_id ?? data.plan_id ?? '…'),
          status: String(data.status ?? 'unknown'),
          amount_eur: data.amount_eur != null ? Number(data.amount_eur) : undefined,
          source: data.source ? String(data.source) : undefined,
          created_at:
            data.created_at && typeof data.created_at === 'object' && 'toDate' in data.created_at
              ? (data.created_at as { toDate: () => Date }).toDate()
              : new Date(0),
        };
      })
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, max);
  },

  /**
   * Transition abonnement depuis la console admin (gratuit ↔ payant).
   * Écrit les champs users/* protégés côté client (seuls les admins peuvent).
   */
  async setUserSubscription(uid: string, input: AdminSetSubscriptionInput): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const update: Record<string, unknown> = {
      updated_at: serverTimestamp(),
      subscription_tier: input.tier,
    };

    if (input.tier === 'free') {
      update.subscription_status = input.status ?? 'canceled';
      update.subscription_plan_id = input.planId == null ? deleteField() : input.planId;
      update.subscription_period_end =
        input.periodEnd == null ? deleteField() : input.periodEnd;
      if (input.billing == null) update.subscription_billing = deleteField();
      else update.subscription_billing = input.billing;
    } else {
      if (!input.planId) throw new Error('Formule requise pour un abonnement payant.');
      update.subscription_plan_id = input.planId;
      update.subscription_status = input.status ?? 'active';
      if (input.periodEnd) update.subscription_period_end = input.periodEnd;
      else if (input.periodEnd === null) update.subscription_period_end = deleteField();
      if (input.billing) update.subscription_billing = input.billing;
      else if (input.billing === null) update.subscription_billing = deleteField();
    }

    await updateDoc(doc(database, 'users', uid), update);

    if (input.logPurchase && input.tier === 'pro' && input.planId) {
      const purchaseId = `admin_${uid}_${Date.now()}`;
      try {
        await setDoc(doc(database, 'subscription_purchases', purchaseId), {
          user_uid: uid,
          uid,
          product_id: input.planId,
          plan_id: input.planId,
          status: input.status ?? 'active',
          source: 'admin_gift',
          reason: input.reason,
          created_at: serverTimestamp(),
        });
      } catch {
        // L’abonnement est déjà appliqué sur users/* — le journal d’achat est secondaire.
      }
    }
  },

  async grantProSubscription(
    uid: string,
    planId: string,
    months: number,
    reason: string,
    asTrial = false,
  ): Promise<void> {
    const end = new Date();
    end.setMonth(end.getMonth() + Math.max(1, months));
    await this.setUserSubscription(uid, {
      tier: 'pro',
      planId,
      status: asTrial ? 'trialing' : 'active',
      periodEnd: end,
      billing: 'monthly',
      reason,
      logPurchase: true,
    });
  },

  async revokeToFreeSubscription(uid: string, reason: string, hard = true): Promise<void> {
    if (hard) {
      await this.setUserSubscription(uid, {
        tier: 'free',
        planId: null,
        status: 'canceled',
        periodEnd: null,
        billing: null,
        reason,
      });
      return;
    }
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, 'users', uid), {
      subscription_status: 'canceled',
      updated_at: serverTimestamp(),
    });
    void reason;
  },

  async extendSubscription(uid: string, days: number, reason: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const snap = await getDoc(doc(database, 'users', uid));
    if (!snap.exists()) throw new Error('Compte introuvable');
    const data = snap.data() as Record<string, unknown>;
    const currentEnd =
      data.subscription_period_end &&
      typeof data.subscription_period_end === 'object' &&
      'toDate' in data.subscription_period_end
        ? (data.subscription_period_end as { toDate: () => Date }).toDate()
        : new Date();
    const base = currentEnd.getTime() > Date.now() ? currentEnd : new Date();
    const next = new Date(base);
    next.setDate(next.getDate() + Math.max(1, days));
    const planId = data.subscription_plan_id ? String(data.subscription_plan_id) : null;
    if (!planId) throw new Error('Aucune formule à prolonger. Passe d’abord en payant.');
    await this.setUserSubscription(uid, {
      tier: 'pro',
      planId,
      status: (data.subscription_status as AdminSubscriptionStatus) || 'trialing',
      periodEnd: next,
      reason,
    });
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

  async listAllClubCameras(max = 120): Promise<import('../models/ClubCameras').ClubCamera[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    const snap = await getDocs(collection(database, 'club_cameras'));
    return snap.docs
      .map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          club_id: String(data.club_id ?? ''),
          vendor: (data.vendor as import('../models/ClubCameras').ClubCamera['vendor']) ?? 'generic',
          brand_label: String(data.brand_label ?? ''),
          model: String(data.model ?? ''),
          status:
            (data.status as import('../models/ClubCameras').ClubCamera['status']) ?? 'disconnected',
          team_id: data.team_id ? String(data.team_id) : undefined,
          team_label: data.team_label ? String(data.team_label) : undefined,
          last_match_title: data.last_match_title ? String(data.last_match_title) : undefined,
          last_match_at: undefined,
          storage_used_mb: Number(data.storage_used_mb ?? 0),
          storage_quota_mb:
            data.storage_quota_mb != null ? Number(data.storage_quota_mb) : undefined,
          sync_status:
            (data.sync_status as import('../models/ClubCameras').ClubCamera['sync_status']) ??
            'idle',
          external_device_id: data.external_device_id
            ? String(data.external_device_id)
            : undefined,
          created_by_uid: String(data.created_by_uid ?? ''),
          created_at: new Date(0),
          updated_at: undefined,
        };
      })
      .slice(0, max);
  },
};
