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
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type {
  CreatePrivacyGrantInput,
  PrivacyAccessGrant,
  PrivacyAuditAction,
  PrivacyAuditEntry,
  PrivacyGrantScope,
  PrivacyPermission,
  PrivacyResourceType,
} from '../models/Privacy';

const COL_GRANTS = 'privacy_access_grants';
const COL_AUDIT = 'privacy_audit_log';

function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === 'object' && v && 'toDate' in v) {
    return (v as { toDate: () => Date }).toDate();
  }
  return new Date(String(v));
}

function mapGrant(id: string, data: Record<string, unknown>): PrivacyAccessGrant {
  return {
    id,
    owner_uid: String(data.owner_uid ?? ''),
    grantee_uid: String(data.grantee_uid ?? ''),
    resource_type: (data.resource_type as PrivacyResourceType) ?? 'medical_document',
    resource_id: data.resource_id ? String(data.resource_id) : null,
    scope: (data.scope as PrivacyGrantScope) ?? 'resource',
    permissions: Array.isArray(data.permissions)
      ? (data.permissions as PrivacyPermission[])
      : ['read'],
    purpose: data.purpose ? String(data.purpose) : null,
    expires_at: toDate(data.expires_at),
    revoked_at: toDate(data.revoked_at),
    created_at: toDate(data.created_at) ?? new Date(),
    updated_at: toDate(data.updated_at) ?? new Date(),
  };
}

function requireDb() {
  if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');
  const database = getDb();
  if (!database) throw new Error('Firebase non configuré');
  return database;
}

export const privacyGrantsService = {
  async listForOwner(ownerUid: string, max = 50): Promise<PrivacyAccessGrant[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = query(
        collection(database, COL_GRANTS),
        where('owner_uid', '==', ownerUid),
        limit(max),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => mapGrant(d.id, d.data() as Record<string, unknown>));
    } catch {
      return [];
    }
  },

  async listForGrantee(granteeUid: string, max = 50): Promise<PrivacyAccessGrant[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = query(
        collection(database, COL_GRANTS),
        where('grantee_uid', '==', granteeUid),
        limit(max),
      );
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => mapGrant(d.id, d.data() as Record<string, unknown>))
        .filter((g) => !g.revoked_at);
    } catch {
      return [];
    }
  },

  async create(input: CreatePrivacyGrantInput): Promise<string> {
    const database = requireDb();
    const ref = doc(collection(database, COL_GRANTS));
    await setDoc(ref, {
      owner_uid: input.owner_uid,
      grantee_uid: input.grantee_uid,
      resource_type: input.resource_type,
      resource_id: input.resource_id ?? null,
      scope: input.scope,
      permissions: input.permissions,
      purpose: input.purpose ?? null,
      expires_at: input.expires_at ?? null,
      revoked_at: null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    await privacyAuditService.log({
      actor_uid: input.owner_uid,
      action: 'grant',
      resource_type: 'privacy_grant',
      resource_id: ref.id,
      owner_uid: input.owner_uid,
      context: `grantee=${input.grantee_uid};scope=${input.scope}`,
    });
    return ref.id;
  },

  async revoke(grantId: string, ownerUid: string): Promise<void> {
    const database = requireDb();
    const ref = doc(database, COL_GRANTS, grantId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Autorisation introuvable');
    const data = snap.data() as Record<string, unknown>;
    if (String(data.owner_uid) !== ownerUid) throw new Error('Non autorisé');
    await updateDoc(ref, {
      revoked_at: new Date(),
      updated_at: serverTimestamp(),
    });
    await privacyAuditService.log({
      actor_uid: ownerUid,
      action: 'revoke',
      resource_type: 'privacy_grant',
      resource_id: grantId,
      owner_uid: ownerUid,
    });
  },
};

export const privacyAuditService = {
  async log(input: {
    actor_uid: string;
    action: PrivacyAuditAction;
    resource_type: PrivacyAuditEntry['resource_type'];
    resource_id: string;
    owner_uid?: string | null;
    context?: string | null;
  }): Promise<void> {
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;
    try {
      await addDoc(collection(database, COL_AUDIT), {
        actor_uid: input.actor_uid,
        action: input.action,
        resource_type: input.resource_type,
        resource_id: input.resource_id,
        owner_uid: input.owner_uid ?? null,
        context: input.context ?? null,
        created_at: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[privacyAudit]', err);
    }
  },

  async listForOwner(ownerUid: string, max = 40): Promise<PrivacyAuditEntry[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = query(
        collection(database, COL_AUDIT),
        where('owner_uid', '==', ownerUid),
        orderBy('created_at', 'desc'),
        limit(max),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          actor_uid: String(data.actor_uid ?? ''),
          action: data.action as PrivacyAuditAction,
          resource_type: data.resource_type as PrivacyAuditEntry['resource_type'],
          resource_id: String(data.resource_id ?? ''),
          owner_uid: data.owner_uid ? String(data.owner_uid) : null,
          context: data.context ? String(data.context) : null,
          created_at: toDate(data.created_at) ?? new Date(),
        };
      });
    } catch {
      return [];
    }
  },
};
