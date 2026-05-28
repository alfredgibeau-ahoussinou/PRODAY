import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { User, UserRole, VerificationStatus } from '../models/User';
import type { TeamEvent } from '../models/TeamEvent';
import type { FriendlyMatch } from '../models/FriendlyMatch';
import type { RecruitmentPost } from '../models/Player';
import type { Tournament } from '../models/Tournament';
import type { SponsorOffer, ClubFundingGoal } from '../models/SponsorOffer';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import { userFromFirestore } from '../lib/firestoreMappers';
import {
  teamEventFromFirestore,
  friendlyMatchFromFirestore,
  recruitmentPostFromFirestore,
  tournamentFromFirestore,
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
import { statsService } from './stats.service';

export interface PlatformStats {
  users: number;
  players: number;
  coaches: number;
  agents: number;
  clubs: number;
  teamEvents: number;
  friendlyMatches: number;
  recruitmentPosts: number;
  tournaments: number;
  paymentRequests: number;
  applications: number;
  announcements: number;
  pendingVerifications: number;
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
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await deleteDoc(doc(database, 'users', uid));
  },

  /**
   * Suppression complète (Auth + Firestore) via callable, ou profil Firestore seul si Functions absentes.
   */
  async deleteUserFull(uid: string): Promise<{ authDeleted: boolean }> {
    try {
      await callFunction<{ uid: string }, { success: boolean }>('adminDeleteUser', { uid });
      return { authDeleted: true };
    } catch (e) {
      if (!isFunctionsUnavailable(e)) {
        throw new Error(getCallableErrorMessage(e));
      }
      await this.deleteUserFirestore(uid);
      return {
        authDeleted: false,
      };
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
    const verified = action === 'approve';
    await this.updateUser(uid, {
      is_verified: verified,
      verification_status: verified ? 'VERIFIED' : 'REJECTED',
      verification_date: serverTimestamp(),
      rejection_reason: verified ? null : rejectionReason?.trim() || null,
    });
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

  async listUserDocuments(uid: string): Promise<{ id: string; name: string; url?: string }[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    const snap = await getDocs(collection(database, 'users', uid, 'documents'));
    return snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        name: String(data.name ?? data.file_name ?? 'Document'),
        url: data.url as string | undefined,
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

  async listAllTournaments(max = 80): Promise<Tournament[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, 'tournaments'),
        orderBy('date_start', 'desc'),
        limit(max)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        tournamentFromFirestore(d.id, d.data() as Record<string, unknown>)
      );
    } catch {
      const snap = await getDocs(collection(database, 'tournaments'));
      return snap.docs
        .map((d) => tournamentFromFirestore(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.date_start.getTime() - a.date_start.getTime())
        .slice(0, max);
    }
  },

  async deleteTournament(tournamentId: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await deleteDoc(doc(database, 'tournaments', tournamentId));
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

  async getPlatformStats(): Promise<PlatformStats> {
    const [
      users,
      events,
      matches,
      posts,
      tournaments,
      clubs,
      payments,
      applications,
      announcements,
    ] = await Promise.all([
      this.listAllUsers(300),
      this.listAllTeamEvents(200),
      this.listAllFriendlyMatches(200),
      this.listAllRecruitmentPosts(200),
      this.listAllTournaments(200),
      this.listAllClubs(200),
      this.listAllPaymentRequests(200),
      this.listAllApplications(200),
      this.listAllClubAnnouncements(200),
    ]);

    return {
      users: users.length,
      players: users.filter((u) => u.role === 'player').length,
      coaches: users.filter((u) => u.role === 'coach').length,
      agents: users.filter((u) => u.role === 'agent').length,
      clubs: clubs.length,
      teamEvents: events.length,
      friendlyMatches: matches.length,
      recruitmentPosts: posts.length,
      tournaments: tournaments.length,
      paymentRequests: payments.length,
      applications: applications.length,
      announcements: announcements.length,
      pendingVerifications: users.filter(
        (u) =>
          (u.role === 'coach' || u.role === 'agent') &&
          u.verification_status === 'PENDING'
      ).length,
    };
  },
};
