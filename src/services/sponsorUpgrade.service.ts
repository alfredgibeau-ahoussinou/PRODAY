import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import { sponsorQuoteService } from './sponsorQuote.service';
import type {
  SponsorUpgradeRequest,
  SponsorUpgradeRequestStatus,
  SponsorUpgradeTier,
} from '../models/SponsorUpgradeRequest';

const ACTIVE_STATUSES: SponsorUpgradeRequestStatus[] = ['pending', 'contacted'];

function parseTimestamp(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  return undefined;
}

function requestFromFirestore(id: string, data: Record<string, unknown>): SponsorUpgradeRequest {
  return {
    id,
    sponsor_uid: String(data.sponsor_uid ?? ''),
    tier: (data.tier as SponsorUpgradeTier) ?? 'territorial',
    company: String(data.company ?? ''),
    city: String(data.city ?? ''),
    status: (data.status as SponsorUpgradeRequest['status']) ?? 'pending',
    admin_note: data.admin_note ? String(data.admin_note) : undefined,
    created_at: parseTimestamp(data.created_at) ?? new Date(),
    contacted_at: parseTimestamp(data.contacted_at),
    approved_at: parseTimestamp(data.approved_at),
    rejected_at: parseTimestamp(data.rejected_at),
    updated_at: parseTimestamp(data.updated_at),
  };
}

function sortByCreatedDesc(requests: SponsorUpgradeRequest[]): SponsorUpgradeRequest[] {
  return [...requests].sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
}

export const sponsorUpgradeService = {
  async submitRequest(input: {
    sponsorUid: string;
    tier?: SponsorUpgradeTier;
    company: string;
    city: string;
    contactEmail?: string;
    contactName?: string;
    phone?: string;
  }): Promise<{ ok: boolean; messageKey: string }> {
    if (!isFirebaseConfigured()) {
      return { ok: false, messageKey: 'sponsor.upgrade.error.firebase' };
    }
    const database = getDb();
    if (!database) {
      return { ok: false, messageKey: 'sponsor.upgrade.error.firebase' };
    }

    const company = input.company.trim();
    const city = input.city.trim();
    if (!company || !city) {
      return { ok: false, messageKey: 'sponsor.upgrade.error.profile' };
    }

    const tier = input.tier ?? 'territorial';

    try {
      const pendingQ = query(
        collection(database, 'sponsor_upgrade_requests'),
        where('sponsor_uid', '==', input.sponsorUid),
        where('tier', '==', tier),
        where('status', '==', 'pending'),
        limit(1)
      );
      const pending = await getDocs(pendingQ);
      if (!pending.empty) {
        return { ok: true, messageKey: 'sponsor.upgrade.success.pending' };
      }
    } catch {
      // index composite absent — on tente la création
    }

    await addDoc(collection(database, 'sponsor_upgrade_requests'), {
      sponsor_uid: input.sponsorUid,
      tier,
      company,
      city,
      status: 'pending',
      created_at: serverTimestamp(),
    });

    void sponsorQuoteService
      .submitQuoteRequest({
        companyName: company,
        contactEmail: input.contactEmail ?? '',
        contactName: input.contactName ?? company,
        phone: input.phone,
        packageTier: tier === 'territorial' ? 'territorial' : 'custom',
        message: `Demande commerciale depuis l'app — ${city}`,
        source: 'app',
        sponsorUid: input.sponsorUid,
      })
      .catch(() => undefined);

    return { ok: true, messageKey: 'sponsor.upgrade.success.pending' };
  },

  async listActiveForAdmin(max = 30): Promise<SponsorUpgradeRequest[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, 'sponsor_upgrade_requests'),
        where('status', 'in', ACTIVE_STATUSES),
        orderBy('created_at', 'desc'),
        limit(max)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => requestFromFirestore(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(collection(database, 'sponsor_upgrade_requests'));
      return sortByCreatedDesc(
        snap.docs
          .map((d) => requestFromFirestore(d.id, d.data() as Record<string, unknown>))
          .filter((r) => ACTIVE_STATUSES.includes(r.status))
      ).slice(0, max);
    }
  },

  /** @deprecated Utiliser listActiveForAdmin */
  async listPendingForAdmin(max = 30): Promise<SponsorUpgradeRequest[]> {
    return this.listActiveForAdmin(max);
  },

  async getApprovedTerritorial(sponsorUid: string): Promise<SponsorUpgradeRequest | null> {
    if (!isFirebaseConfigured()) return null;
    const database = getDb();
    if (!database) return null;

    try {
      const q = query(
        collection(database, 'sponsor_upgrade_requests'),
        where('sponsor_uid', '==', sponsorUid),
        where('tier', '==', 'territorial'),
        where('status', '==', 'approved'),
        orderBy('approved_at', 'desc'),
        limit(1)
      );
      const snap = await getDocs(q);
      const docSnap = snap.docs[0];
      if (!docSnap) return null;
      return requestFromFirestore(docSnap.id, docSnap.data() as Record<string, unknown>);
    } catch {
      const snap = await getDocs(
        query(
          collection(database, 'sponsor_upgrade_requests'),
          where('sponsor_uid', '==', sponsorUid),
          where('status', '==', 'approved'),
          limit(5)
        )
      );
      const match = snap.docs
        .map((d) => requestFromFirestore(d.id, d.data() as Record<string, unknown>))
        .filter((r) => r.tier === 'territorial')
        .sort((a, b) => (b.approved_at?.getTime() ?? 0) - (a.approved_at?.getTime() ?? 0))[0];
      return match ?? null;
    }
  },

  async updateRequestStatus(
    requestId: string,
    nextStatus: Exclude<SponsorUpgradeRequestStatus, 'pending'>,
    note?: string
  ): Promise<{ ok: boolean; messageKey: string }> {
    if (!isFirebaseConfigured()) {
      return { ok: false, messageKey: 'admin.upgrade.error.firebase' };
    }
    const database = getDb();
    if (!database) {
      return { ok: false, messageKey: 'admin.upgrade.error.firebase' };
    }

    const trimmedNote = note?.trim();
    const patch: Record<string, unknown> = {
      status: nextStatus,
      updated_at: serverTimestamp(),
    };
    if (trimmedNote) patch.admin_note = trimmedNote;
    if (nextStatus === 'contacted') patch.contacted_at = serverTimestamp();
    if (nextStatus === 'approved') patch.approved_at = serverTimestamp();
    if (nextStatus === 'rejected') patch.rejected_at = serverTimestamp();

    try {
      await updateDoc(doc(database, 'sponsor_upgrade_requests', requestId), patch);
      return { ok: true, messageKey: `admin.upgrade.success.${nextStatus}` };
    } catch {
      return { ok: false, messageKey: 'admin.upgrade.error.update' };
    }
  },

  async approveRequest(
    requestId: string,
    note?: string
  ): Promise<{ ok: boolean; messageKey: string }> {
    if (!isFirebaseConfigured()) {
      return { ok: false, messageKey: 'admin.upgrade.error.firebase' };
    }
    const database = getDb();
    if (!database) {
      return { ok: false, messageKey: 'admin.upgrade.error.firebase' };
    }

    const requestRef = doc(database, 'sponsor_upgrade_requests', requestId);
    let requestSnap;
    try {
      requestSnap = await getDoc(requestRef);
    } catch {
      return { ok: false, messageKey: 'admin.upgrade.error.update' };
    }
    if (!requestSnap.exists()) {
      return { ok: false, messageKey: 'admin.upgrade.error.update' };
    }

    const requestData = requestSnap.data() as Record<string, unknown>;
    const sponsorUid = String(requestData.sponsor_uid ?? '').trim();
    const tier = (requestData.tier as SponsorUpgradeTier) ?? 'territorial';

    const trimmedNote = note?.trim();
    const requestPatch: Record<string, unknown> = {
      status: 'approved',
      updated_at: serverTimestamp(),
      approved_at: serverTimestamp(),
    };
    if (trimmedNote) requestPatch.admin_note = trimmedNote;

    try {
      const batch = writeBatch(database);
      batch.update(requestRef, requestPatch);

      if (tier === 'territorial' && sponsorUid) {
        batch.update(doc(database, 'users', sponsorUid), {
          sponsor_tier: 'territorial',
          sponsor_territorial_approved_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }

      await batch.commit();
      return { ok: true, messageKey: 'admin.upgrade.success.approved' };
    } catch {
      return { ok: false, messageKey: 'admin.upgrade.error.update' };
    }
  },

  markContacted(requestId: string, note?: string) {
    return this.updateRequestStatus(requestId, 'contacted', note);
  },

  rejectRequest(requestId: string, note?: string) {
    return this.updateRequestStatus(requestId, 'rejected', note);
  },
};
